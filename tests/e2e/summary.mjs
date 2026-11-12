// Turns Playwright's JSON results into a short Markdown table per project, for the job summary and the PR comment.
// Usage: node tests/e2e/summary.mjs "<label>"  (prints Markdown and writes test-results/summary.md)
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';

const label = process.argv[2] || 'Browser tests';
let report;
try { report = JSON.parse(readFileSync('test-results/results.json', 'utf8')); }
catch { const md = `### ${label}\n❌ No results: the run stopped before tests finished.\n`; console.log(md); mkdirSync('test-results', {recursive: true}); writeFileSync('test-results/summary.md', md); process.exit(0); }

const rows = new Map(), failures = [], notes = [];
const visit = (suite, file) => {
  for (const spec of suite.specs || []) for (const t of spec.tests) {
    const p = t.projectName, r = rows.get(p) || {pass: 0, fail: 0, skip: 0, flaky: 0};
    const last = t.results[t.results.length - 1] || {};
    if (t.status === 'skipped') r.skip++;
    else if (t.status === 'flaky') { r.pass++; r.flaky++; }
    else if (t.status === 'expected') r.pass++;
    else { r.fail++; failures.push(`- **${p}** · ${spec.title}: ${(last.error && last.error.message || 'failed').split('\n')[0].replace(/\x1b\[[0-9;]*m/g, '').slice(0, 300)}`); }
    for (const a of t.annotations || []) if (a.type !== 'skip') notes.push(`- ${p}: ${a.type} = ${a.description}`);
    rows.set(p, r);
  }
  for (const s of suite.suites || []) visit(s, file || suite.file);
};
report.suites.forEach(s => visit(s));

const md = [`### ${label}`, '', '| Project | Passed | Failed | Skipped |', '| --- | --- | --- | --- |',
  ...[...rows].sort().map(([p, r]) => `| ${r.fail ? '❌' : '✅'} ${p} | ${r.pass}${r.flaky ? ` (${r.flaky} flaky)` : ''} | ${r.fail} | ${r.skip} |`),
  '', ...(failures.length ? ['**Failures**', ...failures, ''] : []), ...(notes.length ? ['<details><summary>Notes</summary>', '', ...notes, '', '</details>', ''] : [])].join('\n');
console.log(md);
mkdirSync('test-results', {recursive: true});
writeFileSync('test-results/summary.md', md);
