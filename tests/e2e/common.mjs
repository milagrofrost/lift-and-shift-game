// Checks shared by the desktop and phone specs.
import {expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {openHooked, fontsReady} from './hook.mjs';
import {SCENES, buildScene} from './scenes.mjs';

export const OUT = fileURLToPath(new URL('./out/', import.meta.url));
export const shot = async (page, project, name) => {
  mkdirSync(`${OUT}${project}`, {recursive: true});
  await page.screenshot({path: `${OUT}${project}/${name}.png`, caret: 'hide'});
};

// Errors on the page fail the test. Google Fonts is the only outside request; a blip there isn't the game's fault.
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)\.com/.test(m.text() + (m.location().url || ''))) errors.push(`console: ${m.text()}`); });
  return errors;
}

/** Build every scene, screenshot it, and check what it should show. `touch` says whether the touch layer should be on. */
export async function runScenes(page, testInfo, touch) {
  const errors = watchErrors(page);
  await openHooked(page);
  const project = testInfo.project.name, boxes = {fix: null, grab: null}, problems = [];
  for (const scene of SCENES) {
    const r = await buildScene(page, scene);
    await fontsReady(page);
    await shot(page, project, scene.name);
    const say = msg => problems.push(`${scene.name}: ${msg}`);
    if (scene.mode && r.mode !== scene.mode) say(`mode is ${r.mode}, expected ${scene.mode}`);
    if (r.scrollW > r.innerW + 1) say(`page scrolls sideways (${r.scrollW} > ${r.innerW})`);
    if (r.overlayOpen && r.overlayScroll !== 0) say(`overlay opened scrolled down by ${r.overlayScroll}px`);
    if (scene.alert && !r.alert) say('no red alert');
    if (scene.toastsTop && !r.toastsTop) say("toasts didn't move to the top");
    const inPlay = r.mode === 'play';
    for (const k of ['fix', 'grab']) {
      const b = r[k];
      if (!touch || !inPlay) { if (b.visible) say(`touch ${k.toUpperCase()} button is showing`); continue; }
      if (!b.visible) { say(`touch ${k.toUpperCase()} button is hidden`); continue; }
      // the buttons never move or change size when their word changes
      if (!boxes[k]) boxes[k] = b.box; else if (boxes[k].join() !== b.box.join()) say(`${k.toUpperCase()} moved or resized: ${b.box} vs ${boxes[k]}`);
      const want = scene.touch && scene.touch[k];
      if (!want) continue;
      const [word, lit] = want;
      if (word !== null && b.text !== word) say(`${k.toUpperCase()} reads ${b.text}, expected ${word}`);
      if (b.ready !== lit || b.off === lit) say(`${k.toUpperCase()} is ${b.ready ? 'lit' : 'gray'}, expected ${lit ? 'lit' : 'gray'}`);
    }
  }
  expect(problems, problems.join('\n')).toEqual([]);
  expect(errors, errors.join('\n')).toEqual([]);
}

/** Start a real, running career on Easy from the main menu, the way a player would. */
export async function startCareer(page, {tap = false} = {}) {
  await openHooked(page, {live: true});
  const click = async sel => { const el = page.locator(sel); if (tap) await el.tap(); else await el.click(); };
  await click('[data-diff=easy]');
  await click('[data-act=start]');
  await expect.poll(() => page.evaluate(() => window.__G.mode)).toBe('play');
  // a quiet floor for the first seconds, so a hallway user can't hold the player mid-check
  await page.evaluate(() => { const S = window.__G.S; S.users = []; S.p.userImm = 30; });
}

export const S = (page, fn) => page.evaluate(`(() => { const G = window.__G, S = G.S; return (${fn})(G, S); })()`);
