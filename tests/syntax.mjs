// Parses every inline script in the HTML pages and every JS file, without running anything.
// Usage: node tests/syntax.mjs   (exits 1 if anything fails to parse)
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {execFileSync} from 'node:child_process';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const walk = d => readdirSync(join(ROOT, d)).flatMap(f => statSync(join(ROOT, d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);
let bad = 0, n = 0;
const fail = (where, msg) => { bad++; console.error(`✖ ${where}: ${msg}`); };

// inline classic scripts: vm.Script parses without running
for (const page of ['lift-and-shift.html', 'index.html']) {
  const html = readFileSync(join(ROOT, page), 'utf8');
  [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)].forEach((m, i) => {
    if (/type=["']?(module|application\/(ld\+)?json)/.test(m[1])) return;
    n++; try { new Script(m[2], {filename: `${page}#script${i + 1}`}); } catch (e) { fail(`${page} inline script ${i + 1}`, e.message); }
  });
}
// files: node --check handles both classic scripts and modules
const check = file => { n++; try { execFileSync(process.execPath, ['--check', join(ROOT, file)], {stdio: 'pipe'}); } catch (e) { fail(file, String(e.stderr).trim().split('\n').slice(0, 4).join(' | ')); } };
['sw.js', 'pwa.js'].forEach(check);
walk('functions').filter(f => /\.m?js$/.test(f)).forEach(check);
walk('tests').filter(f => /\.m?js$/.test(f)).forEach(check);

console.log(bad ? `${bad} of ${n} failed to parse` : `all ${n} scripts parse`);
process.exit(bad ? 1 : 0);
