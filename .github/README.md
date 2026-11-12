# GitHub automation

What runs on GitHub for Lift & Shift, when, and what it protects. **If you change anything in `workflows/`, update
this file in the same pull request.** CI fails the pull request otherwise (`tests/workflow-docs.mjs`).

## How a change reaches players

1. Work on a branch and open a pull request into `main`.
2. **CI** runs on the pull request: four required checks, plus a summary comment with screenshots and video.
3. If the pull request changes the game, **Balance** comments how the bot's careers changed against `main`.
4. Merge when the required checks are green. `main` is protected, so it only changes through a pull request.
5. Cloudflare Pages deploys `main` to <https://las.milagrofrost.com> (Cloudflare does this, not GitHub Actions).
6. **Live site** waits for that deploy and smoke-tests production.

## Workflows

| Workflow | File | Runs on | Blocks merging? | What it does |
| --- | --- | --- | --- | --- |
| CI | [`ci.yml`](workflows/ci.yml) | pull requests, pushes to `main`, by hand | Yes (4 checks) | Syntax, service worker, regression, desktop and phone browser tests |
| Balance | [`balance.yml`](workflows/balance.yml) | pull requests that touch the game or the bot, by hand | No | Bot plays 100 seeded careers on `main` and on the pull request; comments the comparison |
| Live site | [`smoke.yml`](workflows/smoke.yml) | pushes to `main`, daily at 13:23 UTC, by hand | No (runs after merge) | Waits for the deploy, then checks production |
| Learn more links | [`links.yml`](workflows/links.yml) | Mondays 06:17 UTC, by hand | No | Every outside link the game shows still works |

"By hand" means the **Run workflow** button on the workflow's page in the Actions tab.

### CI

Four jobs run side by side, about 2½ minutes in all. Each is a required status check on `main`:

| Check | What it runs |
| --- | --- |
| **Syntax, PWA and docs** | `node tests/syntax.mjs` (every script parses), `node tests/pwa.mjs` (service worker rules), and on pull requests `tests/workflow-docs.mjs` (this file changes when the workflows do) |
| **Regression (Chromium, WebKit)** | `tests/regression.html` in Chrome's and Safari's engines; must read `PASS` |
| **Desktop (Chromium, WebKit, Firefox)** | `tests/e2e`: 1440×900, 1280×720 and reduced motion. Fourteen set-up scenes with checks on what each shows, and a recorded 20-second keyboard play session |
| **Phone and tablet (Chromium, WebKit)** | `tests/e2e`: iPhone 15, iPhone SE, Pixel 7, iPad, an upright iPhone and reduced motion. The same scenes, checking the touch words, gray-out, that the buttons never move and that no text names a key; a recorded touch play session; an offline reload through Cloudflare-style redirects |

The **PR comment** job then posts (or updates) one comment on the pull request with a pass/fail table per device and
links to the screenshots, videos and Playwright report. Those are also attached to every run as artifacts for 14
days. CI runs once per pull request; pushing a branch without opening a pull request doesn't run it (use **Run
workflow** if you want a run anyway).

### Balance

`tests/balance/run.mjs` loads `tests/balance/bot.js` in headless Chrome and plays 100 Normal careers (average-skill
bot, up to 5 clients) on `main`'s `lift-and-shift.html` and on the pull request's, with the same seeds. Careers are
seeded and stepped at a fixed rate, so if the game didn't change the two columns match exactly. The comment shows
survival, clients finished, escalations, audits, outages, breaches, failed cutovers, uptime and security low points,
time, stars and spend per client. ⚠️ marks a survival change of 15 points or more, or another number moving 35% or
more; a stuck career (no progress for 30 minutes of game time) is called out as a likely softlock.

It's informational. The bot plays worse than a good human and never uses restores, so its absolute numbers are
pessimistic: use it to see what a change did, not to decide whether a difficulty is winnable. Calibrated on 30 seeds:
making tickets arrive 33% faster drops "finished client 3" by about 20 points and gets flagged; a change that only
reshuffles the dice gets none.

### Live site

On every push to `main`, it polls the live game until it is byte-for-byte this commit's `lift-and-shift.html` (up
to 10 minutes; failing that means the Cloudflare deploy didn't happen). Then `tests/smoke` checks production, on
desktop Chrome and on an iPhone in Safari's engine:

- the game opens at `/` and a career starts and keeps drawing, with no page errors;
- after one visit it opens offline at `/lift-and-shift`, `/lift-and-shift.html` and `/`, through Cloudflare's real
  redirects and the real service worker;
- a share link (`/r/<code>`) has the right preview tags and its card image (`/card/<code>.png`) is a PNG, and a
  made-up code is refused;
- the service worker, manifest and logo are served with the right types, and `.html` addresses redirect.

It only reads and plays; it never posts. The daily run catches problems that come from outside a commit. A failed
run emails the repository owner, like any failed workflow.

### Learn more links

`node tests/check-links.mjs` checks the reading links in Learn more and the author links. It needs the internet and
sites change on their own schedule, so it runs weekly instead of on every pull request.

## Protecting main

A repository ruleset on `main` ("main protection", under Settings → Rules → Rulesets):

- requires a pull request; direct pushes to `main` are refused;
- requires the four CI checks to pass on the pull request's latest commit;
- lets repository admins bypass it, but only through a pull request: in an emergency an admin can merge a pull
  request before its checks finish. There is no way to push straight to `main`.

If you rename a CI job, update the ruleset's required checks to the new names, or every pull request will wait
forever for a check that no longer exists.

## Running the same things locally

Needs Node 22. From the repository root:

```bash
npm ci
```

```bash
npx playwright install chromium webkit firefox
```

```bash
npx playwright test -c tests/e2e
```

```bash
git show origin/main:lift-and-shift.html > base.html && node tests/balance/run.mjs --base base.html --head lift-and-shift.html
```

```bash
npx playwright test -c tests/smoke
```

Add `--project=desktop-*` or `--project=phone-*` to the first test command to run one group. Screenshots land in
`tests/e2e/out/`. `SMOKE_URL` points the smoke test at another address (a Cloudflare preview, for example).

## Limits

Emulated phones aren't real iPhones: the silent switch, `navigator.audioSession`, Home Screen mode, safe areas and
real touch feel still need a device. Screenshots are evidence to look at; nothing compares them pixel by pixel yet.
