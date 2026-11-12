// A phone held upright: the game asks you to turn it sideways, and a running client pauses.
import {test, expect} from '@playwright/test';
import {shot, watchErrors} from './common.mjs';
import {openHooked} from './hook.mjs';
import {buildScene, SCENES} from './scenes.mjs';

test('upright phone shows the rotate prompt and pauses play', async ({page}, testInfo) => {
  const errors = watchErrors(page);
  await openHooked(page);
  await expect(page.locator('#rotate')).toBeVisible();
  await shot(page, testInfo.project.name, '01-menu-upright');
  const r = await buildScene(page, SCENES.find(s => s.name === '03-start'));
  expect(r.mode, 'play kept running with the phone upright').toBe('paused');
  await shot(page, testInfo.project.name, '03-start-upright');
  expect(errors, errors.join('\n')).toEqual([]);
});
