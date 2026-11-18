// Older versions (/v/): the Pages Function and its rules, with GitHub and the edge cache faked. node tests/versions.mjs
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const mod = await import(new URL('../functions/v/%5B%5Bpath%5D%5D.js', import.meta.url));
const {onRequestGet, patchGame, REPO, LIST_TTL, BUILD} = mod;

// 103 game commits on main, newest first: two pages from GitHub
const sha = i => (i.toString(16).padStart(4, '0') + 'abc').repeat(6).slice(0, 40);
const COMMITS = Array.from({length: 103}, (_, i) => ({sha: sha(i + 1), commit: {committer: {date: `2026-11-${String(17 - (i % 9)).padStart(2, '0')}T12:00:00Z`}, message: `Commit ${i + 1}\n\nbody`}}));
const OLD = COMMITS[40].sha, FORK = 'f0'.repeat(20);
const GAME_HTML = '<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<title>Lift &amp; Shift</title>\n<script src="./pwa.js" defer></script>\n<p>old game</p>';

let calls = [], github = true;
globalThis.fetch = async (url, init) => {
  url = String(url); calls.push(url);
  if (url.startsWith(`https://api.github.com/repos/${REPO}/commits?`)) {
    if (!github) return new Response('rate limited', {status: 403});
    assert.ok(init.headers['user-agent'], 'GitHub needs a User-Agent');
    const page = +new URL(url).searchParams.get('page');
    return Response.json(COMMITS.slice((page - 1) * 100, page * 100));
  }
  if (url === `https://raw.githubusercontent.com/${REPO}/${OLD}/lift-and-shift.html`) return new Response(GAME_HTML);
  if (url === `https://raw.githubusercontent.com/${REPO}/${OLD}/assets/lift-and-shift-logo.png`) return new Response('PNG');
  return new Response('missing', {status: 404});
};
const store = new Map();
globalThis.caches = {default: {match: async r => store.get(r.url)?.clone(), put: async (r, res) => store.set(r.url, res)}};
const env = {ASSETS: {fetch: async u => new Response(`asset ${new URL(u).pathname}`)}};
const get = async path => { const later = [];
  const r = await onRequestGet({request: new Request(`https://las.test${path}`), env, waitUntil: p => later.push(p)});
  await Promise.all(later); return r; };

// the list: every game commit on main, newest first, from both pages
let r = await get('/v/versions.json');
assert.equal(r.status, 200);
let list = (await r.json()).versions;
assert.equal(list.length, 103);
assert.deepEqual(list[0], {sha: COMMITS[0].sha, date: COMMITS[0].commit.committer.date, subject: 'Commit 1'});
assert.equal(r.headers.get('x-robots-tag'), 'noindex');
assert.ok(calls.every(u => !u.includes('api.github.com') || u.includes('path=lift-and-shift.html') && u.includes('sha=main')), 'only main commits that changed the game');

// cached: no second trip to GitHub inside the TTL
calls = []; await get('/v/versions.json');
assert.equal(calls.length, 0, 'the list should come from the edge cache');

// an older build: the game file with the storage shim and the current picker added, served from that commit
r = await get(`/v/${OLD.slice(0, 8)}/`);
assert.equal(r.status, 200);
assert.match(r.headers.get('content-type'), /text\/html/);
let html = await r.text();
assert.ok(html.includes('<p>old game</p>'));
assert.ok(html.indexOf('LAS_VERSION') < html.indexOf('<title>'), 'the shim runs before the game');
assert.equal(html.match(/version-picker\.js/g).length, 1);
assert.equal((await (await get(`/v/${OLD}/lift-and-shift.html`)).text()), html, 'full hash and file name serve the same build');
// already has the picker (a future build): not added twice
assert.equal(patchGame('<meta charset="utf-8"><script src="./version-picker.js" defer></script>', {sha: OLD, date: 'x'}).match(/version-picker\.js/g).length, 1);
// no <meta charset>: still goes in first
assert.match(patchGame('<html><body>x', {sha: OLD, date: 'x'}), /^<html><script>/);

// the shim gives saved data per-version keys, so an old build can't touch your current records
const shim = html.match(/<script>([\s\S]*?)<\/script>/)[1];
class Storage { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }
const ls = new Storage(); ls.m.set('liftshift-best', '123');
const ctx = {window: {}, Storage}; vm.runInNewContext(shim, ctx);
assert.equal(ctx.window.LAS_VERSION.sha, OLD);
assert.equal(ls.getItem('liftshift-best'), null, 'an old build must not read current records');
ls.setItem('liftshift-best', '5'); ls.removeItem('liftshift-avatar');
assert.equal(ls.m.get('liftshift-best'), '123', 'an old build must not overwrite current records');
assert.equal(ls.m.get(`liftshift@${OLD.slice(0, 8)}:liftshift-best`), '5');
assert.doesNotMatch(patchGame('<meta charset="utf-8">', {sha: OLD, date: '</script><script>alert(1)//'}), /<\/script><script>alert/, 'data in the shim cannot close the script');

// its other files come from the same commit; pwa.js is a no-op; the picker is always the current one
r = await get(`/v/${OLD.slice(0, 8)}/assets/lift-and-shift-logo.png`);
assert.equal(r.headers.get('content-type'), 'image/png'); assert.equal(await r.text(), 'PNG');
r = await get(`/v/${OLD.slice(0, 8)}/pwa.js`);
assert.doesNotMatch(await r.text(), /serviceWorker/, 'an old build must not register a service worker');
assert.equal(await (await get(`/v/${OLD.slice(0, 8)}/version-picker.js`)).text(), 'asset /version-picker.js');

// without the trailing slash relative paths break: redirect
r = await get(`/v/${OLD.slice(0, 8)}?x=1`);
assert.equal(r.status, 302); assert.equal(r.headers.get('location'), `https://las.test/v/${OLD.slice(0, 8)}/?x=1`);
assert.equal((await get('/v/')).status, 302);

// refused: a fork's commit (GitHub's raw host would serve it), ambiguous or malformed ids, traversal, odd file types
calls = [];
for (const path of [`/v/${FORK}/`, `/v/${FORK.slice(0, 8)}/`, '/v/0001/', '/v/zzzzzzzz/',
  `/v/${OLD.slice(0, 8)}/a//b.png`, `/v/${OLD.slice(0, 8)}/script.sh`, `/v/${OLD.slice(0, 8)}/noext`]) {
  assert.equal((await get(path)).status, 404, path);
}
assert.ok(calls.every(u => !u.includes('raw.githubusercontent.com')), 'refused versions must never be fetched');
// a prefix two commits share is ambiguous
COMMITS.push({sha: OLD.slice(0, 8) + 'f'.repeat(32), commit: {committer: {date: '2026-11-01T00:00:00Z'}, message: 'twin'}});
store.clear();
assert.equal((await get(`/v/${OLD.slice(0, 8)}/`)).status, 404, 'an ambiguous short hash');
assert.equal((await get(`/v/${OLD.slice(0, 9)}/`)).status, 200, 'one more character settles it');
COMMITS.pop(); store.clear();
await get('/v/versions.json'); // a fresh list in the cache for the next checks

// An older build served once stays cached at the edge, keyed by BUILD, and comes back with no list and no GitHub at all
const key8 = `https://las.test/v/${OLD.slice(0, 8)}/?build=${BUILD}`, logoKey = `https://las.test/v/${OLD.slice(0, 8)}/assets/lift-and-shift-logo.png?build=${BUILD}`;
const first = await (await get(`/v/${OLD.slice(0, 8)}/`)).text();
await get(`/v/${OLD.slice(0, 8)}/assets/lift-and-shift-logo.png`);
assert.ok(store.has(key8) && store.has(logoKey), 'served builds should be cached at the edge');
assert.match(store.get(key8).headers.get('cache-control'), /max-age=31536000/, 'the edge copy lasts a year');
assert.ok(![...store.keys()].some(k => /pwa\.js|version-picker\.js|versions\.json\?build/.test(k)), 'the picker, pwa.js and list are never cached as builds');
github = false; store.delete('https://las.test/v/versions.json?cache'); calls = [];
r = await get(`/v/${OLD.slice(0, 8)}/`);
assert.equal(r.status, 200, 'a cached build needs no list'); assert.equal(await r.text(), first);
assert.equal(r.headers.get('cache-control'), 'public, max-age=3600', 'browsers re-ask after an hour, so a BUILD bump reaches them');
assert.equal(await (await get(`/v/${OLD.slice(0, 8)}/assets/lift-and-shift-logo.png`)).text(), 'PNG');
assert.equal(calls.length, 0, 'cached builds must not touch GitHub');
assert.notEqual((await get(`/v/${FORK.slice(0, 8)}/`)).status, 200, 'an uncached hash still needs the list');
assert.equal((await get(`/v/${OLD.slice(0, 8)}/pwa.js`)).status, 200, 'pwa.js needs no list either');
github = true; store.clear(); await get('/v/versions.json');

// GitHub down: a stale list keeps serving; with no list at all, a 503 page
github = false;
const now = Date.now; Date.now = () => now() + (LIST_TTL + 5) * 1000;
assert.equal((await get('/v/versions.json')).status, 200, 'a stale list should be served when GitHub refuses');
store.clear();
r = await get('/v/versions.json');
assert.equal(r.status, 200, 'no failed request in the console: the picker just hides');
assert.deepEqual((await r.json()).versions, []); assert.equal(r.headers.get('cache-control'), 'no-store');
r = await get(`/v/${OLD.slice(0, 8)}/`);
assert.equal(r.status, 503); assert.equal(r.headers.get('cache-control'), 'no-store');
Date.now = now;

// the game loads the picker; the picker never runs in test frames or from file://
const game = await readFile(new URL('../lift-and-shift.html', import.meta.url), 'utf8');
assert.match(game, /<script src=".\/version-picker.js" defer><\/script>/);
const picker = await readFile(new URL('../version-picker.js', import.meta.url), 'utf8');
new vm.Script(picker);
assert.match(picker, /window\.top !== window\.self/);
console.log('versions: PASS');
