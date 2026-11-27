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

// Floating windows (DESIGN.md): the terminal and PacketDrop drag by their title bars, follow the mouse exactly, stay on
// screen, and the game keeps running under the terminal.
test('the terminal and PacketDrop drag by their title bars and stay on screen', async ({page}) => {
  const errors = watchErrors(page);
  await openHooked(page);
  // a long session with the cheat menu open: the terminal stays a bounded window and its input line stays in view
  await S(page, G => { G.newRun(); G.startSprint(1); G.play(); G.DEV.unlocked = true; G.devShow(); for (let k = 0; k < 80; k++) G.devRun('ping linda'); });
  expect(await S(page, G => G.mode), 'opening the terminal paused the game').toBe('play');
  const drag = async (win, bar, dx, dy) => {
    const b = await page.locator(bar).boundingBox(), before = await page.locator(win).boundingBox();
    await page.mouse.move(b.x + 40, b.y + b.height / 2); await page.mouse.down();
    await page.mouse.move(b.x + 40 + dx, b.y + b.height / 2 + dy, {steps: 6}); await page.mouse.up();
    return {before, after: await page.locator(win).boundingBox()};
  };
  const vp = page.viewportSize(), inView = async sel => { const b = await page.locator(sel).boundingBox(); return b.y >= -0.5 && b.y + b.height <= vp.height + 0.5; };
  expect(await inView('#devterm'), 'a long terminal ran off the screen').toBe(true);
  expect(await inView('#devinput'), "the terminal's input line scrolled out of view").toBe(true);
  for (const [win, bar] of [['#devterm', '#devterm .devbar'], ['#packetdrop', '#packetdrop .pd-bar']]) {
    if (win === '#packetdrop') await S(page, G => G.GA.vis.open());
    const {before, after} = await drag(win, bar, -150, 120);
    expect(Math.round(after.x - before.x), `${win} didn't follow the mouse sideways`).toBe(-150);
    expect(Math.round(after.y - before.y), `${win} didn't follow the mouse down`).toBe(120);
    const far = await drag(win, bar, 4000, 4000);
    if (win === '#devterm') { expect(await inView('#devterm'), 'the terminal went off the bottom when dragged down').toBe(true);
      await S(page, G => { for (let k = 0; k < 20; k++) G.devRun('ping linda'); }); expect(await inView('#devterm'), 'the dragged terminal grew off the bottom').toBe(true); }
    expect(far.after.x + far.after.width, `${win} went off the right edge`).toBeLessThanOrEqual(vp.width + 0.5);
    expect(far.after.y, `${win}'s title bar went off the bottom`).toBeLessThanOrEqual(vp.height - 30 + 0.5);
    await page.locator(`${win} [aria-label^="Close"]`).click();
    await expect(page.locator(win), `${win}'s × didn't close it after dragging`).toBeHidden();
  }
  expect(errors, errors.join('\n')).toEqual([]);
});
