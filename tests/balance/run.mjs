// Plays the same seeded careers on two versions of the game and prints a Markdown comparison.
// Usage (from the repo root, after npm ci and npx playwright install chromium):
//   node tests/balance/run.mjs --base base.html --head lift-and-shift.html [--seeds 30] [--diff normal]
//        [--skill average] [--clients 5] [--workers 4] [--out test-results/balance.md]
// --base is the version to compare against (CI passes main's copy). With the same file twice the two columns match
// exactly: careers are seeded and stepped at a fixed rate, so only a change in the game moves the numbers.
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname} from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const opts = {base: arg('base'), head: arg('head', 'lift-and-shift.html'), seeds: +arg('seeds', 100), diff: arg('diff', 'normal'),
  skill: arg('skill', 'average'), clients: +arg('clients', 5), workers: +arg('workers', 4), out: arg('out'), port: +arg('port', 8809)};
if (!opts.base) { console.error('Pass --base <file> (the version to compare against).'); process.exit(2); }
const SRC = {base: readFileSync(opts.base, 'utf8'), head: readFileSync(opts.head, 'utf8')};
const SEEDS = Array.from({length: opts.seeds}, (_, i) => i + 1);

const server = spawn(process.execPath, ['tests/e2e/serve.mjs', String(opts.port)], {stdio: ['ignore', 'pipe', 'inherit']});
await new Promise((res, rej) => { server.stdout.once('data', res); server.once('exit', c => rej(new Error(`server exited ${c}`))); });
const browser = await chromium.launch();
const t0 = Date.now();
try {
  // every (version, seed) pair is one job; a few pages work through the list
  const jobs = [];
  for (const v of ['base', 'head']) for (const seed of SEEDS) jobs.push({v, seed});
  const results = {base: [], head: []};
  const errors = [];
  await Promise.all(Array.from({length: opts.workers}, async () => {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${opts.port}/tests/balance/runner.html`);
    await page.waitForFunction(() => window.simCareer);
    for (let job; (job = jobs.shift());) {
      // a career saves records and settings (best career, clients, tips) that the next one on this page would read;
      // which career follows which depends on timing, so every career starts from empty storage
      const r = await page.evaluate(([o, src]) => { localStorage.clear(); sessionStorage.clear(); return window.simCareer({...o, src}); },
        [{diff: opts.diff, skill: opts.skill, seed: job.seed, maxClients: opts.clients}, SRC[job.v]]);
      results[job.v].push(r);
    }
    await page.close();
  }));
  for (const v of ['base', 'head']) results[v].sort((a, b) => a.seed - b.seed);
  const md = report(results, errors, (Date.now() - t0) / 1000);
  console.log(md);
  if (opts.out) { mkdirSync(dirname(opts.out), {recursive: true}); writeFileSync(opts.out, md); writeFileSync(opts.out.replace(/\.md$/, '.json'), JSON.stringify(results)); }
} finally { await browser.close(); server.kill(); }

function report(R, errors, secs) {
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
  const pct = x => `${Math.round(x * 100)}%`;
  const reached = (res, n) => res.filter(r => r.clients.filter(c => !c.brk).length >= n || (r.end.client || 0) > n).length / res.length;
  const finished = res => avg(res.map(r => r.clients.filter(c => !c.brk).length));
  const fired = res => res.filter(r => r.end.fired).length / res.length;
  const stalls = res => res.filter(r => r.end.stall).length;
  const per = (res, f) => { const all = res.flatMap(r => r.clients.filter(c => !c.brk)); return avg(all.map(f)); };
  const rows = [
    ['Careers fired before client ' + (opts.clients + 1), r => fired(r), pct, 0.15],
    ['Finished client 1', r => reached(r, 1), pct, 0.15],
    ['Finished client 2', r => reached(r, 2), pct, 0.15],
    ['Finished client 3', r => reached(r, 3), pct, 0.15],
    ['Clients finished (average)', finished, x => x.toFixed(2), 0.5],
    ['Escalations per client', r => per(r, c => c.esc), x => x.toFixed(1), null],
    ['Audit failures per client', r => per(r, c => c.audits), x => x.toFixed(1), null],
    ['Outages per client', r => per(r, c => c.lost), x => x.toFixed(1), null],
    ['Breaches per client', r => per(r, c => c.breaches), x => x.toFixed(2), null],
    ['Failed cutovers per client', r => per(r, c => c.fails), x => x.toFixed(1), null],
    ['Lowest uptime in a client', r => per(r, c => c.minUp), pct, null],
    ['Lowest security in a client', r => per(r, c => c.minSec), x => x.toFixed(0), null],
    ['Seconds per client', r => per(r, c => c.dur), x => x.toFixed(0), null],
    ['Stars per client', r => per(r, c => c.stars), x => x.toFixed(2), null],
    ['IT spend per client ($k)', r => per(r, c => c.spend), x => x.toFixed(0), null],
  ];
  const same = JSON.stringify(R.base) === JSON.stringify(R.head);
  let flagged = 0;
  const table = rows.map(([name, f, fmt, big]) => {
    const b = f(R.base), h = f(R.head), d = h - b;
    // a relative swing counts as big when it's 35% or more of main's value, or past the row's absolute threshold
    const swing = big != null ? Math.abs(d) >= big : Math.abs(b) > 0.05 && Math.abs(d / b) >= 0.35;
    if (swing) flagged++;
    const delta = Math.abs(d) < 1e-9 ? '·' : `${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}`;
    return `| ${swing ? '⚠️ ' : ''}${name} | ${fmt(b)} | ${fmt(h)} | ${delta} |`;
  });
  const ends = res => { const e = {}; for (const r of res) { const k = r.end.fired || (r.end.stall ? 'stuck' : 'kept going'); e[k] = (e[k] || 0) + 1; } return Object.entries(e).map(([k, n]) => `${k} ${n}`).join(', '); };
  const stuck = stalls(R.head) - stalls(R.base);
  return [
    `### Balance: ${opts.seeds} ${opts.diff} careers per version (${opts.skill} bot, up to ${opts.clients} clients)`,
    '',
    same ? '✅ Same results as main: this change doesn\'t move the bot\'s careers at all.'
      : flagged ? `⚠️ ${flagged} number${flagged > 1 ? 's' : ''} moved a lot. Worth a look if you didn't mean to change balance.`
      : 'Numbers moved, but within the noise.',
    ...(stuck > 0 ? [`❌ ${stuck} more career${stuck > 1 ? 's' : ''} got stuck (no progress for 30 minutes of game time). That usually means a softlock.`] : []),
    ...(errors.length ? [`❌ ${errors.length} page error${errors.length > 1 ? 's' : ''}: ${[...new Set(errors)].slice(0, 3).join(' · ')}`] : []),
    '',
    '| | main | this PR | change |', '| --- | --- | --- | --- |', ...table,
    '',
    `How careers ended. main: ${ends(R.base)}. This PR: ${ends(R.head)}.`,
    '',
    `<sub>Same seeds on both sides, so any difference comes from the change. The bot plays worse than a good human and single numbers are noisy: ⚠️ marks a survival change of 15 points or more, or another number moving 35% or more. It flags big swings; it doesn't judge whether the balance is right. Took ${Math.round(secs)} s.</sub>`,
  ].join('\n');
}
