// A short real-time play session, recorded as video.
import {test, expect} from '@playwright/test';
import {runScenes, startCareer, shot, watchErrors, S} from './common.mjs';

test.use({video: 'on'});

test('a short career played with the keyboard', async ({page}, testInfo) => {
  const errors = watchErrors(page), project = testInfo.project.name;
  await startCareer(page);
  await page.waitForTimeout(2000);
  await shot(page, project, 'play-02s');

  // WASD and the arrow keys move the player
  const p0 = await S(page, (G, S) => ({x: S.p.x, y: S.p.y}));
  await page.keyboard.down('KeyD'); await page.waitForTimeout(700); await page.keyboard.up('KeyD');
  await page.keyboard.down('ArrowDown'); await page.waitForTimeout(500); await page.keyboard.up('ArrowDown');
  const p1 = await S(page, (G, S) => ({x: S.p.x, y: S.p.y}));
  expect(p1.x, 'D did not move the player right').toBeGreaterThan(p0.x + 20);
  expect(p1.y, 'the down arrow did not move the player down').toBeGreaterThan(p0.y + 10);

  // hold E at a rack to patch it
  const rack = await S(page, (G, S) => { const i = S.racks.findIndex(a => a && !a.hidden && !a.covered); S.users = [];
    S.p.x = G.RACKS[i].x; S.p.y = G.RACKS[i].y; S.energy = 100; return i; });
  await page.keyboard.down('KeyE');
  await expect.poll(() => S(page, `(G, S) => !!(S.racks[${rack}] && S.racks[${rack}].covered)`), {message: 'holding E did not patch the rack', timeout: 8000}).toBe(true);
  await page.keyboard.up('KeyE');

  // Space picks the app up, and Space on an empty cloud slot puts it down
  await page.keyboard.press('Space');
  await expect.poll(() => S(page, (G, S) => !!S.carry), {message: 'Space did not pick up the app'}).toBe(true);
  await S(page, (G, S) => { const j = S.cloud.findIndex(c => !c); S.users = []; S.p.x = G.SLOTS[j].x; S.p.y = G.SLOTS[j].y; });
  await page.waitForTimeout(150);
  await page.keyboard.press('Space');
  await expect.poll(() => S(page, (G, S) => !S.carry && S.cloud.some(Boolean)), {message: 'Space on a cloud slot did not deploy'}).toBe(true);

  // Escape pauses: the game clock stops, and Escape again resumes
  await page.keyboard.press('Escape');
  expect(await S(page, G => G.mode)).toBe('paused');
  const t0 = await S(page, (G, S) => S.time);
  await page.waitForTimeout(800);
  await shot(page, project, 'play-paused');
  expect(await S(page, (G, S) => S.time), 'the clock ran while paused').toBe(t0);
  await page.keyboard.press('Escape');
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
