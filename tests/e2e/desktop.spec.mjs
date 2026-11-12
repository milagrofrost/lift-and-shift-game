// The normal PC game: mouse and keyboard, no touch controls.
import {test, expect} from '@playwright/test';
import {runScenes, startCareer, shot, watchErrors, S} from './common.mjs';

test('desktop scenes render and show the right state', async ({page}, testInfo) => {
  await runScenes(page, testInfo, false);
});
