// Fails when a pull request changes the GitHub workflows without updating .github/README.md, which explains them.
// Usage: node tests/workflow-docs.mjs <base-ref>   (CI passes the pull request's base, e.g. origin/main)
import {execFileSync} from 'node:child_process';

const base = process.argv[2];
if (!base) { console.log('No base ref given (not a pull request): nothing to compare.'); process.exit(0); }
const changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], {encoding: 'utf8'}).split('\n').filter(Boolean);
const workflows = changed.filter(f => f.startsWith('.github/workflows/'));
if (!workflows.length) { console.log('No workflow changes.'); process.exit(0); }
if (changed.includes('.github/README.md')) { console.log(`Workflows changed (${workflows.join(', ')}) and .github/README.md was updated.`); process.exit(0); }
console.error(`✖ ${workflows.join(', ')} changed, but .github/README.md didn't.\n  Update it to describe what the workflows now do (AGENTS.md: "Workflows").`);
process.exit(1);
