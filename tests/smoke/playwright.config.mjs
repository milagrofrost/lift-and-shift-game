// Smoke test of the deployed site. Run from the repo root: npx playwright test -c tests/smoke
// SMOKE_URL picks the site (default: production).
import {defineConfig, devices} from '@playwright/test';

const {defaultBrowserType, ...iphone} = devices['iPhone 15 landscape'];

export default defineConfig({
  testDir: '.',
  outputDir: '../../test-results/smoke',
  timeout: 60_000,
  retries: 2, // the network is part of what's tested; one blip shouldn't page anyone
  reporter: process.env.CI ? [['list'], ['json', {outputFile: '../../test-results/smoke/results.json'}]] : [['list']],
  use: {baseURL: process.env.SMOKE_URL || 'https://las.milagrofrost.com', serviceWorkers: 'allow', trace: 'retain-on-failure'},
  projects: [
    {name: 'live-desktop-chromium', use: {browserName: 'chromium', viewport: {width: 1440, height: 900}}},
    {name: 'live-iphone-webkit', use: {...iphone, browserName: 'webkit'}},
  ],
});
