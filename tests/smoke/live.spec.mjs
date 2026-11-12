// Smoke test of the deployed site, run after each deploy of main. It only reads and plays; it never posts anything.
// Covers what only production has: Cloudflare's real redirects and headers, the service worker over HTTPS,
// and the Pages Functions behind share links.
import {test, expect} from '@playwright/test';

const REPORT = 'r_3_2_35_23_-412_0_0'; // retired as Principal Consultant, 2 clients, 3.5 stars

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)\.com|cloudflareinsights|ERR_INTERNET_DISCONNECTED/.test(m.text() + (m.location().url || ''))) errors.push(`console: ${m.text()}`); });
  return errors;
}

test('the game opens and a career starts', async ({page}) => {
  const errors = watchErrors(page);
  await page.goto('/');
  const start = page.locator('[data-act=start]');
  await expect(start).toBeVisible();
  if (test.info().project.use.hasTouch) await start.tap(); else await start.click();
  await expect(page.locator('#overlay')).toBeHidden();
  await expect(page.locator('#h-sprint')).toHaveText('#1');
  // the floor keeps drawing: two snapshots of the canvas a second apart differ
  const snap = () => page.evaluate(() => document.getElementById('c').toDataURL());
  const a = await snap(); await page.waitForTimeout(1200); const b = await snap();
  expect(a !== b, 'the game floor stopped drawing').toBe(true);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('the game opens offline after one visit', async ({page, context}) => {
  const errors = watchErrors(page);
  await page.goto('/lift-and-shift');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), {timeout: 15_000}).toBe(true);
  await context.setOffline(true);
  try {
    for (const path of ['/lift-and-shift', '/lift-and-shift.html', '/']) {
      await page.goto(path);
      await expect(page.locator('[data-act=start]'), `${path} did not open offline`).toBeVisible();
    }
  } finally { await context.setOffline(false); }
  expect(errors.filter(e => !/Failed to load resource/.test(e)), errors.join('\n')).toEqual([]);
});

test('share links and their preview images work', async ({request}) => {
  const page = await request.get(`/r/${REPORT}`);
  expect(page.status()).toBe(200);
  const html = await page.text();
  expect(html).toContain('<meta property="og:title" content="Retired as Principal Consultant | Lift &amp; Shift">');
  expect(html).toContain(`/card/${REPORT}.png`);
  const card = await request.get(`/card/${REPORT}.png`);
  expect(card.status()).toBe(200);
  expect(card.headers()['content-type']).toContain('image/png');
  expect((await card.body()).subarray(1, 4).toString()).toBe('PNG');
  // a code with free text in it is refused (sent home), never drawn
  const bad = await request.get('/r/hello_world', {maxRedirects: 0});
  expect([301, 302, 307, 308]).toContain(bad.status());
});

test('the files an install needs are served', async ({request}) => {
  for (const [path, type] of [['/sw.js', 'javascript'], ['/pwa.js', 'javascript'], ['/manifest.webmanifest', 'manifest+json'], ['/assets/lift-and-shift-logo.png', 'image/png']]) {
    const r = await request.get(path);
    expect(r.status(), path).toBe(200);
    expect(r.headers()['content-type'], path).toContain(type);
  }
  // Cloudflare's pretty URLs: the .html address redirects to the clean one
  const r = await request.get('/lift-and-shift.html', {maxRedirects: 0});
  expect([301, 308]).toContain(r.status());
});
