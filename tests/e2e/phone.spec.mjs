// Phones and a tablet in landscape: touch screen, so the joystick and the FIX / GRAB / pause buttons show.
import {test, expect} from '@playwright/test';
import {runScenes, startCareer, shot, watchErrors, S} from './common.mjs';

test('touch is detected', async ({page}) => {
  await page.goto('/lift-and-shift');
  expect(await page.evaluate(() => matchMedia('(pointer:coarse)').matches), 'this browser did not report a touch screen, so the touch controls stay hidden').toBe(true);
});

test('phone scenes render and show the right state', async ({page}, testInfo) => {
  await runScenes(page, testInfo, true);
});

test.describe('offline', () => {
  test.use({serviceWorkers: 'allow'});
  test('the game opens offline after one visit, through the same redirects as production', async ({page, context}, testInfo) => {
    test.skip(testInfo.project.name !== 'phone-iphone15-chromium', 'checked once, in Chromium');
    const errors = watchErrors(page);
    await page.goto('/lift-and-shift');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // now the worker answers for the page
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await context.setOffline(true);
    for (const path of ['/lift-and-shift', '/lift-and-shift.html', '/']) {
      await page.goto(path);
      await expect(page.locator('[data-act=start]'), `${path} did not open offline`).toBeVisible();
    }
    await shot(page, testInfo.project.name, 'offline-menu');
    await context.setOffline(false);
    // offline, Google Fonts can't load; that's expected
    expect(errors.filter(e => !/net::ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e)), errors.join('\n')).toEqual([]);
  });
});
