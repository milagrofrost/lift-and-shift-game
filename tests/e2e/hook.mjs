// Loads the real game with the same start-up hook tests/regression.html uses, so a scene can be built from the
// game's own functions instead of by playing up to it. HOOK and NAMES are read from tests/regression.html, so the two
// never drift: rename a function there and these tests follow.
import {readFileSync} from 'node:fs';

const REG = readFileSync(new URL('../regression.html', import.meta.url), 'utf8');
const block = REG.match(/const HOOK = [\s\S]*?\nconst EXPOSE = [\s\S]*?\n(?=\s*\n|let )/);
if (!block) throw new Error('Could not find HOOK / NAMES / EXPOSE in tests/regression.html');
export const {HOOK, NAMES, EXPOSE} = new Function(`${block[0]};return {HOOK, NAMES, EXPOSE};`)();

// a few more internals the screenshot scenes need beyond what the regression checks use
const EXTRA = ['play', 'toast', 'tutorial', 'critList'];
const EXPOSE_E2E = `${EXPOSE}Object.assign(window.__G,{${EXTRA.map(n => `${n}:(typeof ${n}!=="undefined"?${n}:undefined)`).join(',')}});`;

// mulberry32, the same generator tests/regression.html seeds with
export const SEED_SRC = 'window.__seed=function(n){let t=n>>>0;Math.random=()=>{t+=0x6D2B79F5;let r=Math.imul(t^t>>>15,1|t);r^=r+Math.imul(r^r>>>7,61|r);return((r^r>>>14)>>>0)/4294967296;};}';

// fonts must be in before any screenshot, or text renders in a fallback font
export async function fontsReady(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(['700 16px "Chakra Petch"', '400 16px "IBM Plex Sans"', '400 16px "IBM Plex Mono"'].map(f => document.fonts.load(f).catch(() => {})));
  });
}

/** Open the game with its internals on window.__G and Math.random seeded. The frame loop stays stopped, so a scene
 *  holds still for its screenshot, unless `live` is set: then the real game runs as a player would see it. */
export async function openHooked(page, {seed = 1, live = false} = {}) {
  await page.addInitScript(`${SEED_SRC};__seed(${seed});`);
  await page.route(/\/lift-and-shift(\.html)?$/, async route => {
    const res = await route.fetch();
    const src = await res.text();
    if (!src.includes(HOOK)) throw new Error("The game's start-up line changed; update HOOK in tests/regression.html.");
    route.fulfill({response: res, body: src.replace(HOOK, EXPOSE_E2E + (live ? 'requestAnimationFrame(frame);' : ''))});
  });
  await page.goto('/lift-and-shift');
  await page.waitForFunction(() => window.__G && window.__G.S);
  // a still scene shows CSS at rest: toasts fully in, nothing mid-transition, so the picture is the same every run
  if (!live) await page.addStyleTag({content: '*,*::before,*::after{animation:none!important;transition:none!important}'});
  await fontsReady(page);
}
