// The normal PC game: mouse and keyboard, no touch controls.
import {test, expect} from '@playwright/test';
import {runScenes, startCareer, shot, watchErrors, S} from './common.mjs';
import {openHooked} from './hook.mjs';

test('desktop scenes render and show the right state', async ({page}, testInfo) => {
  await runScenes(page, testInfo, false);
});

// The version picker (version-picker.js): the test server answers /v/versions.json like functions/v/ does in production.
test('the main menu offers older versions at the top right', async ({page}, testInfo) => {
  const errors = watchErrors(page);
  await openHooked(page);
  await S(page, G => G.titleScreen());
  const pick = page.getByRole('combobox', {name: 'Game version'});
  await expect(pick).toBeVisible();
  await expect(pick.locator('option:checked')).toHaveText('Latest (2421d2f1)');
  const labels = await pick.locator('option').allTextContents();
  expect(labels.length).toBe(3);
  expect(labels[1]).toMatch(/^[A-Z][a-z]{2} \d{1,2}, 2026 \(ae5fe76a\)$/);
  expect(labels[2]).toMatch(/\(2e810f3c\)$/);
  // level with the eyebrow, at the right edge of the card
  const [eb, sel, card] = await Promise.all(['.vpick-row .eyebrow', '.vpick', '#overlay .card'].map(s => page.locator(s).first().boundingBox()));
  expect(Math.abs((eb.y + eb.height / 2) - (sel.y + sel.height / 2)), 'picker not level with the eyebrow').toBeLessThan(4);
  expect(card.x + card.width - (sel.x + sel.width), 'picker not at the right of the card').toBeLessThan(40);
  await shot(page, testInfo.project.name, 'menu-version-picker');
  // re-rendering the menu keeps exactly one picker
  await S(page, G => { G.titleScreen(); G.titleScreen(); });
  await expect(page.locator('.vpick')).toHaveCount(1);
  // picking a date opens that commit's build
  await page.route('**/v/ae5fe76a/', r => r.fulfill({body: '<!doctype html><title>old</title>', contentType: 'text/html'}));
  await pick.selectOption({index: 1});
  await page.waitForURL('**/v/ae5fe76a/');
  expect(errors, errors.join('\n')).toEqual([]);
});

test('an older build shows which version is open and can go back', async ({page}) => {
  await page.addInitScript(() => { window.LAS_VERSION = {sha: '2e810f3ccccccccccccccccccccccccccccccccc', date: '2026-11-08T12:00:00Z'}; });
  await openHooked(page);
  await S(page, G => G.titleScreen());
  const pick = page.getByRole('combobox', {name: 'Game version'});
  await expect(pick.locator('option:checked')).toHaveText(/\(2e810f3c\)$/);
  await expect(pick).toHaveClass(/old/);
  await page.route(/\/$/, r => r.fulfill({body: '<!doctype html><title>latest</title>', contentType: 'text/html'}));
  await pick.selectOption({index: 0});
  await page.waitForURL(u => u.pathname === '/');
});
