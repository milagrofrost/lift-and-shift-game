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

// DEBUG panels drag out of the game into the page's empty space and stay there, updating; dropped still touching the game,
// they snap back to their corner (DBGWIN). A wide window, so there's room beside the game.
test('DEBUG panels drag out beside the game and snap back when they still touch it', async ({page}) => {
  const errors = watchErrors(page);
  await page.setViewportSize({width: 1920, height: 1080});
  await openHooked(page, {live: true});
  // licenses far off, so the log stays in its corner (it slides up when a bottom server's renewal is due)
  await S(page, G => { G.newRun(); G.startSprint(1); G.play(); G.setLogLv(3); G.S.users = []; G.S.racks.forEach(a => { if (a) a.lic = 9999; }); });
  await page.waitForTimeout(500);
  const rectOf = key => S(page, `(G) => { const st = G.PANEL['${key}'], g = document.getElementById('c').getBoundingClientRect(), k = g.width / 960;
    return {x: g.left + st.rect.x * k, y: g.top + st.rect.y * k, w: st.rect.w * k, right: g.right}; }`);
  const out = key => S(page, `(G) => ({out: !!G.PANEL['${key}'].out, shown: !!G.PANEL['${key}'].el && !G.PANEL['${key}'].el.hidden})`);
  const dragFrom = async (x, y, tx, ty) => { await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(tx, ty, {steps: 8}); await page.mouse.up(); await page.waitForTimeout(250); };
  const m = await rectOf('metrics');
  await dragFrom(m.x + 20, m.y + 8, m.right + 30, m.y + 200);
  expect(await out('metrics'), 'the metrics panel dropped beside the game should stay out').toEqual({out: true, shown: true});
  const before = await S(page, G => G.PANEL.metrics.el.textContent);
  await S(page, G => { G.S.tk.push({age: 0}); }); await page.waitForTimeout(300);
  expect(await S(page, G => G.PANEL.metrics.el.textContent), 'the panel out in the page stopped updating').not.toBe(before);
  const l = await rectOf('logs');
  await dragFrom(l.x + 20, l.y + 6, l.x - 40, l.y + 6);
  expect(await out('logs'), 'a panel dropped still touching the game should snap back').toEqual({out: false, shown: false});
  // the log out on the left, right up against the game while it's short: as long lines arrive it grows away from the game
  // and stays out (it used to grow into the game and snap back)
  const l2 = await rectOf('logs'), g = await page.locator('#c').boundingBox();
  await dragFrom(l2.x + 10, l2.y + 6, g.x - 6 - l2.w + 10, l2.y + 6); // its right edge 6px clear of the game
  expect((await out('logs')).out, 'the log dropped just left of the game should be out').toBe(true);
  for (let k = 0; k < 12; k++) await S(page, `(G) => G.toast('A very long toast about a server fire that someone should really go and put out before it spreads ${k}')`);
  await page.waitForTimeout(1500);
  const lw = await page.locator('.dbgwin:not([hidden])').evaluateAll(els => els.map(e => e.getBoundingClientRect()).map(r => ({right: r.right, left: r.left})));
  expect((await out('logs')).out, 'the log snapped back into the game as it grew').toBe(true);
  expect(lw.every(r => r.right <= g.x + 0.5 || r.left >= g.x + g.width - 0.5), 'a panel out in the page grew into the game').toBe(true);
  await S(page, G => { G.PANEL.logs.out = false; G.PANEL.logs.el.hidden = true; });
  const w = await page.locator('.dbgwin:not([hidden])').boundingBox();
  await dragFrom(w.x + 20, w.y + 8, m.x - 100, m.y + 100);
  expect(await out('metrics'), 'dragging it back onto the game should put it back').toEqual({out: false, shown: false});
  await S(page, G => G.setLogLv(1));
  await dragFrom(m.x + 20, m.y + 8, m.right + 30, m.y + 200);
  expect(await out('metrics'), 'below DEBUG there is nothing to pick up').toEqual({out: false, shown: false});
  expect(errors, errors.join('\n')).toEqual([]);
});

// Floating windows resize from the grip in their bottom-right corner (makeResizable): they follow the mouse, stay on
// screen, and don't shrink below a minimum. Gitamp keeps its fixed size, like the player it's a parody of.
test('the floating windows resize from their corner grip and stay on screen', async ({page}) => {
  const errors = watchErrors(page);
  await openHooked(page);
  await S(page, G => { G.newRun(); G.startSprint(1); G.play(); });
  const vp = page.viewportSize();
  const opens = {'#wiresnark': G => G.devRun('wiresnark'), '#statuspage': G => G.devRun('curl status'), '#devterm': G => G.devShow(), '#packetdrop': G => G.GA.vis.open()};
  for (const [win, open] of Object.entries(opens)) {
    await S(page, open);
    const grip = page.locator(`${win} > .wgrip`), b0 = await page.locator(win).boundingBox();
    await expect(grip, `${win} has no resize grip`).toBeVisible();
    // targets stay inside the viewport: Firefox stops sending mouse moves once the pointer leaves it
    const dragTo = async (tx, ty) => { const c = await grip.boundingBox();
      await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2); await page.mouse.down(); await page.mouse.move(tx, ty, {steps: 6}); await page.mouse.up(); };
    const drag = async (dx, dy) => { const c = await grip.boundingBox(); await dragTo(c.x + c.width / 2 + dx, c.y + c.height / 2 + dy); };
    await drag(-60, -40);
    const b1 = await page.locator(win).boundingBox();
    expect(Math.round(b1.width - b0.width), `${win} didn't follow the grip sideways`).toBe(-60);
    expect(Math.round(b1.height - b0.height), `${win} didn't follow the grip down`).toBe(-40);
    await dragTo(vp.width - 1, vp.height - 1);
    const b2 = await page.locator(win).boundingBox();
    expect(b2.x + b2.width, `${win} grew off the right edge`).toBeLessThanOrEqual(vp.width + 0.5);
    expect(b2.y + b2.height, `${win} grew off the bottom`).toBeLessThanOrEqual(vp.height + 0.5);
    await dragTo(1, 1);
    const b3 = await page.locator(win).boundingBox();
    expect(b3.width, `${win} shrank below its minimum`).toBeGreaterThanOrEqual(250);
    expect(b3.height, `${win} shrank below its minimum`).toBeGreaterThanOrEqual(130);
    expect(b3.width, `${win} didn't shrink to its minimum`).toBeLessThan(b0.width);
    await page.locator(`${win} [aria-label^="Close"]`).click(); // so the next window can't end up underneath this one
  }
  await expect(page.locator('#gitamp > .wgrip'), 'Gitamp keeps its fixed size').toHaveCount(0);
  expect(errors, errors.join('\n')).toEqual([]);
});
