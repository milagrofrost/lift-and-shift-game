// A short real-time play session, recorded as video.
import {test, expect} from '@playwright/test';
import {runScenes, startCareer, shot, watchErrors, S} from './common.mjs';

test.use({video: 'on'});

// press and hold at the middle of an element with pointer events, as a thumb does (the game reads pointer events)
const hold = async (page, sel, ms) => {
  const b = await page.locator(sel).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  await page.waitForTimeout(ms); await page.mouse.up();
};

test('a short career played with the touch controls', async ({page}, testInfo) => {
  test.skip(!/iphone15-(webkit|chromium)$/.test(testInfo.project.name), 'played on the iPhone 15 profiles only');
  const errors = watchErrors(page), project = testInfo.project.name;
  await startCareer(page, {tap: true});
  await page.waitForTimeout(2000);
  await shot(page, project, 'play-02s');

  // drag on the left half: the joystick appears under the thumb and the player walks
  const p0 = await S(page, (G, S) => ({x: S.p.x, y: S.p.y}));
  const vw = page.viewportSize();
  await page.mouse.move(vw.width * 0.2, vw.height * 0.6); await page.mouse.down();
  await page.mouse.move(vw.width * 0.2 + 60, vw.height * 0.6, {steps: 5});
  await page.waitForTimeout(900);
  await shot(page, project, 'play-joystick');
  await page.mouse.up();
  const p1 = await S(page, (G, S) => ({x: S.p.x, y: S.p.y}));
  expect(p1.x, 'dragging right on the joystick did not move the player right').toBeGreaterThan(p0.x + 20);

  // hold FIX at a rack to patch it; the button reads PATCH while you're there
  const rack = await S(page, (G, S) => { const i = S.racks.findIndex(a => a && !a.hidden && !a.covered); S.users = [];
    S.p.x = G.RACKS[i].x; S.p.y = G.RACKS[i].y; S.energy = 100; return i; });
  await expect(page.locator('#t-fix')).toHaveText('PATCH');
  await hold(page, '#t-fix', 4000);
  expect(await S(page, `(G, S) => !!(S.racks[${rack}] && S.racks[${rack}].covered)`), 'holding FIX did not patch the rack').toBe(true);

  // tap GRAB to pick the app up, then DEPLOY on an empty cloud slot
  await page.locator('#t-grab').tap();
  await expect.poll(() => S(page, (G, S) => !!S.carry), {message: 'tapping GRAB did not pick up the app'}).toBe(true);
  await S(page, (G, S) => { const j = S.cloud.findIndex(c => !c); S.users = []; S.p.x = G.SLOTS[j].x; S.p.y = G.SLOTS[j].y; });
  await expect(page.locator('#t-grab')).toHaveText('DEPLOY');
  await page.locator('#t-grab').tap();
  await expect.poll(() => S(page, (G, S) => !S.carry && S.cloud.some(Boolean)), {message: 'tapping DEPLOY did not deploy'}).toBe(true);

  // the pause button pauses and the clock stops
  await page.locator('#t-pause').tap();
  expect(await S(page, G => G.mode)).toBe('paused');
  const t0 = await S(page, (G, S) => S.time);
  await page.waitForTimeout(800);
  await shot(page, project, 'play-paused');
  expect(await S(page, (G, S) => S.time), 'the clock ran while paused').toBe(t0);
  await page.locator('[data-act=resume]').tap();
  expect(await S(page, G => G.mode)).toBe('play');

  await page.waitForTimeout(6000);
  await shot(page, project, 'play-10s');
  await page.waitForTimeout(10000);
  await shot(page, project, 'play-20s');
  // game time runs slower than wall time when a headless browser draws under 20 frames a second (each frame's
  // step is capped), so this only checks the clock kept moving and reports the rate
  const t1 = await S(page, (G, S) => S.time);
  testInfo.annotations.push({type: 'game seconds per wall second', description: ((t1 - t0) / 16).toFixed(2)});
  expect(t1, 'the game clock stopped after resuming').toBeGreaterThan(t0 + 1);
  expect(errors, errors.join('\n')).toEqual([]);
});
