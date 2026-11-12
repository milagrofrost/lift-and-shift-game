// Desktop and phone tests for Lift & Shift. Run from the repo root: npx playwright test -c tests/e2e
// Screenshots land in tests/e2e/out/<project>/ (ignored by git; CI uploads them as artifacts).
import {defineConfig, devices} from '@playwright/test';

const PORT = 8808;
const dev = (name, browserName) => { const {defaultBrowserType, ...d} = devices[name]; return {...d, browserName: browserName || defaultBrowserType}; };
const desktop = (w, h, browserName, extra = {}) => ({browserName, viewport: {width: w, height: h}, hasTouch: false, isMobile: false, ...extra});

export default defineConfig({
  testDir: '.',
  outputDir: '../../test-results',
  timeout: 90_000,
  expect: {timeout: 10_000},
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', {outputFolder: '../../playwright-report', open: 'never'}], ['json', {outputFile: '../../test-results/results.json'}]]
    : [['list'], ['html', {outputFolder: '../../playwright-report', open: 'never'}]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    serviceWorkers: 'block', // the offline test turns them back on for itself
    trace: 'retain-on-failure',
  },
  webServer: {command: `node tests/e2e/serve.mjs ${PORT}`, cwd: '../..', url: `http://127.0.0.1:${PORT}/lift-and-shift.html`, reuseExistingServer: !process.env.CI},
  projects: [
    // the existing deterministic checks, in Chrome's and Safari's engines
    {name: 'regression-chromium', testMatch: /regression\.spec/, use: {browserName: 'chromium'}},
    {name: 'regression-webkit', testMatch: /regression\.spec/, use: {browserName: 'webkit'}},
    // the normal PC game: mouse and keyboard
    {name: 'desktop-chromium', testMatch: /desktop(-play)?.spec/, use: desktop(1440, 900, 'chromium')},
    {name: 'desktop-small-chromium', testMatch: /desktop(-play)?.spec/, use: desktop(1280, 720, 'chromium')},
    {name: 'desktop-reduced-chromium', testMatch: /desktop(-play)?.spec/, use: desktop(1440, 900, 'chromium', {reducedMotion: 'reduce'})},
    {name: 'desktop-webkit', testMatch: /desktop(-play)?.spec/, use: desktop(1440, 900, 'webkit')},
    {name: 'desktop-firefox', testMatch: /desktop(-play)?.spec/, use: desktop(1440, 900, 'firefox')},
    // phones and a tablet: touch screen, so (pointer:coarse) matches and the touch controls show
    {name: 'phone-iphone15-webkit', testMatch: /phone(-play)?.spec/, use: dev('iPhone 15 landscape')},
    {name: 'phone-iphone15-chromium', testMatch: /phone(-play)?.spec/, use: dev('iPhone 15 landscape', 'chromium')},
    {name: 'phone-iphone15-reduced-chromium', testMatch: /phone(-play)?.spec/, use: {...dev('iPhone 15 landscape', 'chromium'), reducedMotion: 'reduce'}},
    {name: 'phone-iphoneSE-webkit', testMatch: /phone(-play)?.spec/, use: dev('iPhone SE landscape')},
    {name: 'phone-pixel7-chromium', testMatch: /phone(-play)?.spec/, use: dev('Pixel 7 landscape')},
    {name: 'tablet-ipad-webkit', testMatch: /phone(-play)?.spec/, use: dev('iPad (gen 7) landscape')},
    {name: 'phone-portrait-webkit', testMatch: /portrait\.spec/, use: dev('iPhone 15')},
  ],
});
