# [Play at las.milagrofrost.com](https://las.milagrofrost.com)

<p align="center"><img src="assets/lift-and-shift-logo.png" alt="Lift &amp; Shift logo" width="280"></p>

# Lift & Shift

A browser game about migrating applications to the cloud while keeping everyday IT operations running.

You are the newest consultant at Lift & Shift Consulting. The migration has a deadline. The business still needs its systems. Tickets, emails, patching, compliance, outages, security incidents, and people competing for your attention do not stop just because a migration project started.

![Lift & Shift career selection](docs/screenshots/title.png)

## Why this game exists

Lift & Shift is a playful teaching simulation of **cloud migrations and business as usual (BAU)** for people working in IT, engineering, and DevOps. It makes competing responsibilities visible: delivering change, maintaining service, controlling spending, and protecting reliability all draw on the same limited attention.

The lesson is not to become a faster superhero. It is to build a better operating environment. Early in a career, you do most work yourself. Over time, investment in automation, policies, security controls, and people should free you to manage migrations and exceptions instead of continually fighting fires.

The game uses satire and compressed time. Its probabilities, costs, DORA-style ratings, and incident behavior are teaching devices, not production forecasts or real-world benchmarks. Cloud costs in particular are tilted optimistic. The game lets you approve FinOps downsizing by holding E and walking past servers; in real life, check utilization and test before you shrink anything. Please don't use them to plan a real migration, don't put them in a slide deck for your executives, and don't quote us.

## Hands on Tutorial

Open **Tutorials** on the main menu. It starts with a quick illustrated tour, and every page has **📎 Hands on Tutorial** beside **Main menu** for a guided practice client. You are in a reverse shadow: you do the work while a senior paperclip points out where to go and what to look for. On the map, its eyes follow you and blink occasionally. Coffee widens its eyes, red alerts make it quiver and quake with its eyes squeezed shut, peeking now and then, firefighting closes its eyes, hallway interruptions get an eye roll, and the leak lesson gets a repeating teardrop. Reduced motion keeps these reactions still and disables blinking. Practice movement, carrying and cutover, patch coverage, tickets, email, firefighting, discovery, coffee and cloud leaks, then read your client report and buy an upskill.

In practice nothing arrives on its own (tickets, email, users, pickups and leaks are staged one lesson at a time), compliance and license clocks are paused, and every cutover succeeds. The day clock runs and moving a server still burns a little uptime. The staged fire and leak grow a little slower than usual and never spread, but left alone the fire still burns through to an outage and the leak still becomes a breach and a red alert, which you then fix. Tutorial purchases and results do not carry into career records. Pause or leave whenever you like; real careers keep their normal timing and risks.

## How it plays

1. Start a career and choose a difficulty.
2. Pick up applications in the on-premises room and carry them through the hallway to the cloud.
3. Choose migration order carefully: bronze applications build experience for silver and gold cutovers.
4. Keep BAU moving: answer email, close tickets, patch systems, contain leaks, and restore service.
5. Recover failed cutovers in the cloud or roll them back on-premises.
6. Complete a client, review the results, and spend improvement points on tools and support for future clients.

Later clients bring larger environments, hidden applications, and more operational pressure. Tools carry forward. You can continue your consulting career or retire between clients.

There is one more way to win: automate yourself out of a job. A level 4 AI Agent with every foundation in place (plus Mover Bot for the migrations) can run a whole client by itself. Finish a client without doing a single thing yourself, and after the client review the AI agent gets you fired as obsolete instead of handing you the next client. Do even one thing and you stay employed.

Prefer to do it without AI? Tick **Old school** on the main menu: the AI Agent and AI Chatbots never reach the shop. From the 10th client on, if the bots and your tooling do the engineering and under 15% of your own work is skilled (migrations, incidents, leaks), the job is down to a checklist, and after the review it gets outsourced. That's a win as well, with its own old-school credits.

Curious what a tool really does? **📚 Learn more** on the main menu lists every upgrade with a link to a good real-world explanation (Comfy Sneakers included), and each shop card links to the same page. **🤝 Let's connect** has a very humble post from the person who made it, with links to [LinkedIn](https://www.linkedin.com/in/milagrofrost/) and [milagrofrost.com](https://milagrofrost.com).

![The on-premises room, operational hallway, and cloud migration floor](docs/screenshots/gameplay.png)

## What you learn by playing

| Game system | Operational lesson |
| --- | --- |
| Migration tiers and failed cutovers | Sequence changes, understand risk, and keep a recovery path. |
| Hidden servers | Discovery and asset inventory matter before a migration. |
| Email, tickets, and interruptions | BAU competes with project delivery for real capacity. |
| Uptime and security | Shipping is not the only measure of success. |
| Licenses, running costs, and lease targets | Migration timing has financial consequences. |
| Cloud running costs | A plain lift-and-shift costs a little more than on-prem; Terraform, Observability, auto-patching, and approving FinOps rightsizing recommendations are what make the cloud cheaper. |
| Automation and upgrades | Tools need investment and iteration; mature automation should reduce toil. |
| Improvement points and retrospectives | Incidents consume capacity that could have prevented future incidents. |
| Delivery and recovery statistics | Review outcomes and improve the process, not just the speed of individual actions. |

## Play locally

Clone this repository, then open `lift-and-shift.html` in a modern browser. No build step or backend is required.

Alternatively, serve the folder locally with Python:

```sh
git clone https://github.com/milagrofrost/lift-and-shift-game.git
cd lift-and-shift-game
python -m http.server 8766 --bind 127.0.0.1
```

Open <http://127.0.0.1:8766/lift-and-shift.html>. On some systems, use `python3` instead of `python`.

Google Fonts supplies optional fonts; system font fallbacks are included. Sound and music are synthesized in the browser. The game uses browser local storage for preferences and records, not a resumable career save. Refreshing starts over.

## Controls

| Input | Action |
| --- | --- |
| WASD or arrow keys | Move |
| Space / J | Grab, or drop while standing on an empty cloud slot or rack; hold near a failed cloud cutover to roll back |
| Hold E / K | Contextual work: patch, firefight, restore, contain, investigate, answer, or close |
| F | Use your Emergency Freeze charge (bought between clients) |
| P / Escape | Pause or resume. The pause menu's **Logging level** button sets how much text the floor shows: ERROR (incidents only), WARN (the default: short hints and problems), INFO (every hint, result and odds) or DEBUG (all of that, plus labels on everything, a metrics scrape of the floor, and a tail of the real event log, terminal included, in place of the pop-up messages; both panels tuck themselves away when you walk up to them). The hands-on tutorial always shows at least INFO. |
| M | Toggle sound effects |
| ` (backtick) or the >_ button | Open the terminal: `journalctl` shows the event log, `restore mm:ss` goes back to a restore point |
| Music button | Toggle music |

On phones the game plays in landscape: drag anywhere on the left half of the screen to move, and use the see-through FIX (hold), GRAB, freeze and pause buttons on the right. FIX and GRAB name what they'd do where you stand (DOUSE, PATCH, SEAL, REPLY, REBOOT, RETRY, PROBE, APPROVE, SHOO; GRAB, SHIP, DEPLOY, DROP, TOSS, ROLLBACK) and go gray when there's nothing to do. On iPhone and iPad, sound obeys the ring/silent switch like most casual games, and music from other apps keeps playing; the pause menu's Silent mode button (Safari 17+) can play sound anyway, which pauses other apps' audio. A one-time tip mentions it at your first career start. Tutorial, How to play, and Why it works this way explain the mechanics in-game. With the pipeline upgrade, Space at a rack sends it down a free lane (or you carry it if every lane is busy).

## Development status

The game is one HTML file containing the interface, canvas rendering, simulation, and audio; the logo and install icons live in `assets/`. PWA registration and offline caching live in `pwa.js` and `sw.js`.

The gameplay revisions are merged into `main`, including current-cycle patch coverage, incident completion rules, rollback accounting, manager change freezes, and persistent escalation targeting.

Play at **https://las.milagrofrost.com**. Cloudflare Pages automatically deploys pushes to `main`.

## Regression tests

`tests/regression.html` loads the game in a hidden frame and runs deterministic checks with a seeded random number generator: script syntax, patch coverage, completion and cutover accounting, carrying and escalations, blue-green copies, freezes, and hidden servers. Serve the repository root (see *Play locally*) and open <http://127.0.0.1:8766/tests/regression.html>. The page title reads `PASS n/n` or `FAIL k/n`, and `window.__RESULTS` holds the details for scripted runs.

`node tests/check-links.mjs` checks every outside link the game shows (the Learn more readings and the author links) and exits with an error if any is broken. It needs the internet, so it's separate from the regression page. Sites that block scripts, like LinkedIn, are listed as unverified rather than broken.

Run it before every push to `main`, and add a check whenever you change a rule it covers.

## Contributing, including AI assistants

Read [AGENTS.md](AGENTS.md) before making changes. It records the teaching goals, agreed gameplay direction, branch expectations, and validation guidelines. Preserve the relationship between mechanics and the operational lesson they are intended to teach. Explain balance changes and test their interactions instead of treating isolated functions as the whole game.

### Blue-green staging
With Blue-Green Cutovers, you carry (or pipeline) a see-through copy while the original stays online in its rack until a successful cutover retires it. The original can still catch fire and take escalations while the copy is in flight; if it goes offline, the copy is canceled and you restore it and migrate again. Failed cloud deployments stay gray; hold E there to retry. Migrating a currently patched server reduces new-leak risk by 50% for the first 30 seconds after cutover.

### The AI Agent
The AI Agent unlocks after the third client and amplifies the practices you already have. It works the email and ticket queues whenever either is at least half full; otherwise it goes looking for fixes on-prem and in the cloud (leaks, Patch Bot automation errors, overdue patches) before clearing whatever is left. Level 2 also investigates unknown racks start to finish, unlike a temp. Level 3 chases an escalation it caused to the server and cleans it up there. Level 4 adds guardrails and answers incidents too: fires, outages, breaches and failed cutovers. At level 4 you can also fire your manager between clients: the automatic change freezes, the faster uptime recovery and the agent's email know-how stay, and the wandering, chatting, guarding and server "inspections" go.

### Mr Paperclip
Graduated from the tutorial, the senior paperclip is for sale: **Mr Paperclip · Reverse Shadow**, a 2-point one-off in the improvement sprint (not an AI upskill, so old school careers get him too). He floats at your shoulder in every client with all his tutorial faces (eyes that follow you, wide on coffee, shut and shaking in red alerts, closed while extinguishers spray, an eye roll for hallway users, tears for leaks) and comments in a speech bubble on a good chunk of what happens, backseat-driver style (second-guessing your choices, micromanaging while you hold E, claiming credit, hindsight, unsolicited advice like "Have you considered Kubernetes?"): migrations, failed cutovers, escalations ("Thar she blows!"), outages, email, VPs, pizza and more. His advice is comedy and mostly wrong. His one real effect: every line is worth +1 energy. Ordinary lines wait 8–12 seconds; alarms jump the queue. There is no mute. In the shop he has opinions about what you buy, and the old school credits hold a memorial for him with his days on the team.

### Red-alert slow-mo
On Easy, and a little on Normal, VPs coming to find you slow down during a red alert (60% speed on Easy, 85% on Normal), so you get more time to fix the incident before one grabs you. Everyone else, and your repairs, run at normal speed. A slow heartbeat fades in, the music loses its bass and kick and goes muffled, and the edges of the room darken. When the alert clears it eases back out and the heartbeat quickens and fades away. Hard has none.

Each server-room door has a badge reader on the hallway side. Walking in plays a faint ting and the light goes green for a second; walking out turns it green too, silently, like a real exit sensor. You, your manager and VPs all badge in normally. The Badge Access Audit upgrade only delays VPs: one hunting you stands beside the door, gets denied three times (3 seconds apart), calls Bob in Facilities, and then walks in and keeps following you until they catch you or give up as usual. While the light is green, a VP can piggyback through, including when you step out past one waiting at the door. Your manager keeps their badge.

### Restore from backup
The terminal keeps a play-by-play event log for the current client and a restore point (💾) roughly every 30 seconds. Selecting one plays a "Restoring to mm:ss state" progress bar and returns the game to that moment. You get three restores per career on Easy, two on Normal, one on Hard, and none with the Hardcore checkbox (Hard otherwise unchanged). They also work from the screen where you get fired. Restore points don't cross client boundaries, and the future can play out differently after a restore.

### Humble brag
If you get fired or resign mid-client, the report also counts what you're leaving behind as "Not my problem": everything flashing red as you walk out — visible racks that are uncovered and showing the red circle (the last quarter of their compliance cycle), and cloud leaks with a red border, about to be breached. You migrated what you could; those are for whoever gets hired next. On the resignation exit interview's carnage report each one adds a carnage point.

Every end screen (retired, fired, obsolete, outsourced, or resigned) has a share panel with a post written for LinkedIn, Facebook, X, or Instagram. Getting fired is reported as "Open to work"; the numbers are real. Each post links to a personal `/r/...` page whose 1200×630 preview image shows that report, so it appears as the picture on LinkedIn, Facebook, and X. No network lets a website attach an image directly: LinkedIn and X open with the post filled in and the square card on the clipboard to paste instead, Facebook takes only the link with the post on the clipboard, and Instagram uses the phone share sheet or a manual upload. Nothing is published until you do it yourself.

The report page and image are Cloudflare Pages Functions in `functions/`, with no dependencies or build step. Report links hold only numbers and fixed choices. To try them locally, run `npx wrangler pages dev .`; a plain static server doesn't run them.

### Terminal help
Type `?` in the terminal to list its commands, a command and `?` for its options (`ping ?`), or part of a word and `?` to match by prefix (`p?`). Help answers as soon as you press `?` and keeps your line.

### Hidden-server discovery
Unknown racks require investigation (hold E for 6 seconds; 3 with Asset Inventory). The three handmade clients keep their designed hidden-server tiers; from client 4 on, hidden servers can be any tier. Discovery can expose an already-expired license with renewal liability, or a license close to expiry. Investigate quickly and you can beat the renewal; leave it, or let an outage find it, and the license has probably already renewed. Escalations can attack hidden racks; a resulting outage reveals the server. Migration progress never reveals them automatically.


## Install and play offline

After deployment, open https://las.milagrofrost.com once while online and allow the initial game download to finish.

- **Android (Chrome):** open the browser menu and choose **Add to Home screen → Install** (wording may vary). Launch Lift & Shift from its new icon.
- **iPhone (Safari):** tap **Share → Add to Home Screen**, leave **Open as Web App** enabled if shown, then tap **Add**. Launch from the home screen.
- **Desktop (Chrome/Edge):** use the address-bar install icon or the browser menu's install option.

Rotate phones to landscape to play; portrait keeps the existing rotation prompt. Standalone windows respect notch and home-indicator safe areas. Sound, pause, keyboard/touch controls and reduced motion work as in the browser.

The game and logo/icons work offline after the first successful download. External fonts fall back to system fonts; Learn more, social links and shared report pages/images require the internet. Installation does not add career save/resume: reloading or closing still ends the current run. Browser records and preferences remain local; an installed app may have separate storage, especially on iPhone. The operating system can clear offline storage.

Updates never reload an active game. Online launches fetch the current deployment. An updated worker takes over right away but never reloads or messages an open game; it only answers the next request. Bump the cache version in sw.js whenever any precached file changes. Cache cleanup only deletes this game's old shell caches; report Functions and unknown routes are never intercepted. No Cloudflare build step or dependencies are added; _headers ensures worker/manifest revalidation. Cloudflare Pages redirects the .html launch URL to its extensionless equivalent (308). The worker passes that redirect through and stores only plain, unredirected copies, because Safari refuses to show a redirected response from a service worker ("Response served by service worker has redirections"). Both URLs work offline.

### PWA validation

Run node tests/pwa.mjs for dependency-free packaging and service-worker policy checks, and run tests/regression.html over HTTP for gameplay regressions. Service workers require HTTPS or localhost; opening files directly still plays the game without offline installation.

On a localhost server or an HTTPS branch preview, open the game, wait for the service worker to finish installing (DevTools → Application → Service Workers), and reload once so it controls the page. Check the manifest and icons in Application → Manifest. Switch DevTools Network to Offline and reload both / and /lift-and-shift.html: the game and logo must load and a new run must work. /r/... must remain network-only. Restore the network, test touch controls in landscape, rotate to portrait, and check standalone safe areas on a physical phone. Test an update with two windows open: neither should reload, and the next navigation should be answered by the new worker. Test behind a redirect too (or on the Pages preview): open /, then /lift-and-shift.html, online and offline. Use a separate preview/localhost origin for tests to preserve active production runs.
