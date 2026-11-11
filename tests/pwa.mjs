// Dependency-free service worker policy and packaging checks: node tests/pwa.mjs
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const manifest = JSON.parse(await read('manifest.webmanifest'));
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.scope, '/');
assert.equal(manifest.start_url, '/lift-and-shift.html');
for (const icon of manifest.icons) {
  const png = await readFile(new URL(icon.src.slice(1), root));
  const size = Number(icon.sizes.split('x')[0]);
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
}
for (const file of ['index.html','lift-and-shift.html']) assert.match(await read(file), /rel="manifest"/);
assert.match(await read('lift-and-shift.html'), /<script src=".\/pwa.js" defer><\/script>/);
for (const file of ['pwa.js','sw.js']) new vm.Script(await read(file));
const handlers = {}, store = new Map(), removed = [];
let network = async () => new Response('network'), skipped = false;
const cache = {put: async (k,v) => store.set(k,v), match: async k => { const v = store.get(k); if (!v) return; const c = v.clone(); if (v.redirected) Object.defineProperty(c, 'redirected', {value: true}); return c; }};
const context = {URL, Set, Promise, Response, Error, caches:{open:async()=>cache, keys:async()=>['other-app','lift-shift-shell-old','lift-shift-shell-v4'],delete:async k=>removed.push(k)}, self:{location:{origin:'https://game.test'},addEventListener:(n,fn)=>handlers[n]=fn,skipWaiting:()=>{skipped=true;}}, fetch:r=>network(r)};
vm.runInNewContext(await read('sw.js'), context);
let pending;
handlers.install({waitUntil:p=>pending=p}); await pending;
for(const asset of store.keys()) await readFile(new URL(asset.slice(1),root));
assert.ok(store.has('/lift-and-shift.html') && store.size >= 5, 'install did not precache the shell');
// Cloudflare 308s /lift-and-shift.html: the precached copy must not carry the redirect, or Safari refuses it
const redirected = async body => { const r = new Response(body); Object.defineProperty(r, 'redirected', {value: true}); return r; };
network = () => redirected('network'); store.clear();
handlers.install({waitUntil:p=>pending=p}); await pending;
assert.equal(store.get('/lift-and-shift.html').redirected, false, 'install cached a redirected response');
assert.equal(await store.get('/lift-and-shift.html').clone().text(), 'network');
network = async () => new Response('network');
handlers.activate({waitUntil:p=>pending=p}); await pending;
assert.deepEqual(removed,['lift-shift-shell-old']);
assert.equal(skipped, true, 'a fixed worker must replace a broken one without waiting for every window to close');
async function request(path, mode='navigate', method='GET') {
  let response; const writes=[];
  handlers.fetch({request:{url:new URL(path,'https://game.test').href,mode,method},respondWith:p=>response=p,waitUntil:p=>writes.push(p)});
  const result=await response; await Promise.all(writes); return result;
}
assert.equal(await(await request('/lift-and-shift.html')).text(),'network');
// a navigation that the server redirects comes back opaque: pass it through, never swap in the cache
const hop = {type:'opaqueredirect', ok:false, status:0};
network=async()=>hop; assert.equal(await request('/lift-and-shift.html'), hop, 'server redirect was not passed through');
network=async()=>{throw Error('offline')};
for(const path of ['/','/index','/index.html','/lift-and-shift','/lift-and-shift.html?installed=1']) assert.equal(await(await request(path)).text(),'network');
for(const path of ['/r/report','/r/report.png','/tests/regression.html','/unknown','https://external.test/']) assert.equal(await request(path),undefined);
assert.equal(await request('/lift-and-shift.html','navigate','POST'),undefined);
network=async()=>new Response('unavailable',{status:503});
assert.equal(await(await request('/lift-and-shift.html')).text(),'network');
network=async()=>new Response('redirect shell');
await request('/');
assert.equal(await store.get('/lift-and-shift.html').clone().text(),'network','root redirect must not replace cached game');
// an old poisoned cache entry is cleaned on the way out too
network=async()=>{throw Error('offline')};
store.set('/lift-and-shift.html', await redirected('stale'));
const served = await request('/lift-and-shift.html');
assert.equal(served.redirected, false, 'served a redirected response from the cache'); assert.equal(await served.text(), 'stale');
console.log('PASS PWA packaging, offline routes, failures, exclusions and cache lifecycle');
