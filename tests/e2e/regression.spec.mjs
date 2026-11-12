// Runs tests/regression.html and fails unless its title reads PASS, printing each failing check.
import {test, expect} from '@playwright/test';

test('tests/regression.html reads PASS', async ({page}) => {
  test.setTimeout(180_000);
  await page.goto('/tests/regression.html');
  await page.waitForFunction(() => /^(PASS|FAIL)/.test(document.title), null, {timeout: 170_000});
  const title = await page.title();
  const failed = await page.evaluate(() => (window.__RESULTS || []).filter(r => !r.ok).map(r => `✖ ${r.name}: ${r.detail}`));
  if (failed.length) console.log(failed.join('\n'));
  expect(title, failed.join('\n') || title).toMatch(/^PASS/);
});
