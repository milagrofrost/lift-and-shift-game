// The browser jobs run in Playwright's Docker image, whose browsers only work with the matching @playwright/test.
// Every workflow's image tag must equal the version in package.json, and no workflow installs browsers itself.
// node tests/playwright-image.mjs
import {readFile, readdir} from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const want = pkg.devDependencies?.['@playwright/test'] || pkg.dependencies?.['@playwright/test'] || '';
if (!/^\d+\.\d+\.\d+$/.test(want)) {
  console.error(`@playwright/test should be pinned to an exact version (it picks the Docker image), not "${want}"`);
  process.exit(1);
}

const dir = new URL('../.github/workflows/', import.meta.url);
let bad = 0, seen = 0;
for (const f of (await readdir(dir)).filter(f => /\.ya?ml$/.test(f))) {
  const text = await readFile(new URL(f, dir), 'utf8');
  for (const [, tag] of text.matchAll(/mcr\.microsoft\.com\/playwright:v([\w.-]+)/g)) {
    seen++;
    const v = tag.replace(/-[a-z]+$/, '');
    if (v !== want) { bad++; console.error(`${f}: image v${v}, but package.json has @playwright/test ${want}`); }
  }
  if (/playwright install/.test(text)) { bad++; console.error(`${f}: installs browsers itself; run the job in the Playwright image instead`); }
}
if (bad) process.exit(1);
console.log(`${seen} Playwright image tag(s) match @playwright/test ${want}`);
