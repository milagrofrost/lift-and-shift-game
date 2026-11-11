# Contributor and AI assistant guidance

## Purpose and design philosophy

Lift & Shift teaches cloud migration alongside BAU: email, tickets, maintenance, compliance, service recovery, security, and financial pressure. The player starts overwhelmed and progressively builds systems that make routine work manageable.

- Mature automation should be a net positive. Early tools can be unreliable; upgrades should visibly reduce toil and intervention.
- Keep meaningful tension without making recovery an uncontrollable cascade of failures.
- Preserve humor and IT satire, but make cause and effect understandable.
- Routine maintenance is not an emergency. Distinguish healthy, covered, maintenance-needed, and failed states visually.
- Do not invent mechanics based on a literal example number. Preserve existing tuning unless the requested change includes rebalancing.

## Repository and branch handling

- Inspect Git status, branch, and applicable instructions before editing. Preserve unrelated user changes.
- `lift-and-shift.html` contains the game. No build system is required. `functions/` holds dependency-free Cloudflare Pages Functions for shared report links.
- Gameplay revisions are merged into `main`. Cloudflare Pages deploys `main` to https://las.milagrofrost.com. Use feature branches for new work; pushing main publishes the site.
- The design direction below describes accepted behavior, including feature-branch work. Inspect the current branch before claiming it is implemented.
- Do not merge branches, rewrite history, publish releases, or change repository visibility without authorization.
- Keep local machine configuration, credentials, temporary scripts, and personal paths out of commits. `.claude/` is local configuration, not part of the published game.

## Where things live

`lift-and-shift.html` is one file: styles, markup, then one script wrapped in `(()=>{ ... })()`. The logo is `assets/lift-and-shift-logo.png`, loaded by path (the menu and the share card both use it). Sections start with a `==== Name ====` comment; list them with `grep -n "==== " lift-and-shift.html`. In order:

| Section | What's in it |
| --- | --- |
| Styles / Markup | CSS tokens and layout; the HUD, canvas, touch controls, overlay and terminal elements |
| Boot and world layout | live-update guard, room geometry (`WALLS`, `RACKS`) |
| Clients, careers and difficulty | `CLIENTS`, generated and break clients, `DIFFS`, `engagementCfg`, titles |
| Core rules | `TIER`, uptime budget, `applyPatch`, cost labels, email types, badge-reader data, `secHit`, `spend`, freezes |
| Upgrade catalog | `UPGRADES` |
| Helpers / Sound and music | `$`, `rand`, `dist`; synthesized SFX, heartbeat, the music sequencer and `SONG_SETS` |
| Retrospective, queue limits, DORA | `RETRO`, "Give me a break", `ticketLimit` / `inboxLimit`, `doraBlock` |
| Desk and running costs | on-prem and cloud rates, `cloudSpend`, `burnRate` |
| Hallway | users, chatbots, pickups, specials, temp worker |
| Manager and AI Agent | agent levels, foundations, `agentPick`, `tickAgent`; `tickManager` |
| Doors, badge readers, hallway users | `badgeIn`, `badgeTry`, `tickUsers`, `drawUser` |
| Floor effects | Observability and FinOps marks, celebration, slow-mo edges, red alert, energy feedback |
| Inbox, VPs, escalation launch, sprint capacity, desk | `INBOX`, `spawnHunter`, `unplanned`, `drawInbox`, `drawDesk` |
| Canvas setup and input | colors from CSS, keyboard, touch stick |
| Run state | `S` via `newRun`, `addApp`, waves, `startSprint`, `finishEngagement` |
| Feedback, movement, player actions | toasts, movement, cutover odds, blue-green, `migrate`, rollback, pipeline, `doFix`, FinOps approval, work counters |
| Simulation | `tickOnPrem`, discovery, `tickCloud`, breaches, `spawns`, `tickHazards`, `tickEscalation`, Patch Bot, Mover Bot, slow-mo, `update()` |
| Drawing | floor, readers, pipeline, racks, slots, bots, player, `draw()` |
| HUD | health bars, `hud()` |
| Screens | menu, tutorial, notes, how to play |
| Shop and between-client review | offers and pity weights, `review()`, brainstorm, `buy` |
| Sharing the end report | posts, report code, share card |
| End screens, resignation, credits | `showEnd`, "Not my problem", resignation letter, obsolete and outsourced credits |
| Dev console, backups, terminal, pause | cheats, restore points, `CLI` commands, `togglePause` |
| Main loop | `frame()` |

`tests/regression.html` reaches internals through the `NAMES` list and the start-up `HOOK` line; update both when you rename a function it uses or change the last line of the script. Put big new systems, such as multiplayer, in their own `.js` files from the start rather than growing this file; don't rewrite or split the existing code.

## Accepted gameplay direction

### Patch cycles

- Normal servers have randomly assigned 42–65-second base cycles; discovered hidden servers originally use 40 seconds. Preserve these lengths unless explicitly asked otherwise.
- A successful patch at any point covers the **current cycle**. It does not reset the timer, add a second timer, bank extra cycles, or shorten future cycles.
- A covered cycle keeps counting down internally. Show a green draining bar and a checkmark / COVERED label, with no numeric countdown or green warning circle.
- When a covered cycle ends, reset to a fresh, uncovered cycle without an audit penalty. The normal countdown resumes.
- An uncovered cycle that expires fails its audit. Yellow and then red circles communicate approaching risk only while uncovered.
- Reject redundant patches on covered servers. Helpers must honor the same coverage state as the player.

### Completion and accounting

- Any outage or active breach blocks client completion. Developing leaks and warning states do not by themselves block completion.
- Check failure conditions before awarding completion.
- Failed cutovers must not award decommissioning savings or remove future license obligations. Successful migration rewards apply once per server.
- A license counts down only while its server runs on its rack. It pauses while carried or in the pipeline and resumes on return. A blue-green original stays on its rack, so it keeps counting and can still renew.
- Rollback counts as service restoration. Player, bot, and pipeline migrations must use consistent delivery statistics.

### Escalations, recovery, and freezes

- Ticket escalations **do cause server fires**. Do not replace this with random infrastructure fires or penalties alone.
- During any outage or active breach, slow escalation pressure considerably; the feature branch uses one-quarter normal escalation speed. Escalations still happen outside explicit freezes.
- The ticket queue and the inbox hold only what their bars show (5 slots, plus retrospective slots). A full queue takes nothing new, so there is never a hidden backlog; a full ticket queue still escalates and a full inbox still sends VPs until it is worked down. Vendor spam is not capped, and an AI agent mistake can push the inbox past the cap by its two angry replies.
- Each escalation needs 12 seconds of full queue, and a dip below full does not reset that wait. While any server is burning, escalation runs at half speed; an outage or active breach takes precedence at one-quarter speed.
- Escalations retain server identity through pickup, relocation, pipeline transit, failed cutover, and rollback. Wait at the last rack while the target is absent; reacquire its actual rack when it returns. Do not silently retarget a different server or discard the escalation on pickup.
- Successful migration may retire that server's escalation.
- Managers provide bounded automatic freezes for critical incidents; all tiers help, higher tiers provide more protection. Explicit freezes pause users, arrivals, queue pressure, fire growth/spread, and breach spread while recovery continues.
- Downtime and active breach damage still count during freezes. A freeze contains chaos; it does not fix the incident.
- Prevent repeated automatic retriggering within one continuous incident. Respect cooldowns.
- Emergency freeze is a single carried charge, repurchasable after use. Extend existing protection with a cap rather than wasting the charge or stacking indefinitely.
- No adrenaline system has been requested.
- Red-alert slow-mo: during a red alert, hunting VPs approach at 0.6× on Easy and 0.85× on Normal (none on Hard or Hardcore), easing in and out. Only VPs slow: other users, NPCs, timers, hazards and the player's repairs run at normal speed. A heartbeat fades in slow and quickens/fades out as it ends; the song drops its bass and kick under it, and the room's edges darken.
- Badge readers: each server-room door has one on the hallway side. Entering plays a faint ting and turns it green for 1 second; leaving turns it green silently; the player, the manager and VPs badge in normally. Temps badge in too (ting). Bots and the AI agent don't use it. One temp in ten is a dud, split evenly: 5% snack hoarders and 5% never onboarded (badge denied every 3 s at the on-prem door, no work, quit after 12 s). Badge Access Audit (upgrade) only delays hunting VPs: they stand beside the door, are denied 3 times 3 seconds apart, pause, call Bob (about 4.5 s), then have access and follow you as normal until they catch you or give up. A VP can piggyback through while the door is green, including when someone walks out past them. The manager keeps access.

### AI Agent foundations

- The AI Agent amplifies existing practices. With no foundations for a job, it keeps its base level odds; each relevant upgrade improves that job only (patching: Patch Bot, Runbooks, Observability). Foundations shift results toward success; they do not add a penalty or stop tokens being billed.
- Patch Bot walks faster at each level (85/110/140) and the AI Agent moves faster at each level (300/340/380/420); level 1 keeps the original pace.
- Level 1 only touches bronze servers, level 2 adds silver, level 3 adds gold; tickets and email are open at every level. Baselines are 50%, 80% and 90% right, and never certain.
- A Patch Bot automation error draws the agent ahead of tickets and email, within its server tiers, using its normal patching odds.
- When the agent breaks something it stays, apologizes, and makes one billed repair attempt. A failed repair leaves the problem to the player and never causes further damage. Damage already charged stays charged.
- Priorities: at level 4, incidents first (breaches, outages, fires, failed cutovers). Then the email or ticket queue, whichever is fuller, once either is at least half full. Below that it looks for fixes: leaks, automation errors, at-risk patches, unknown racks (level 2+), routine patches. Then whatever is left in the queues.
- Level 2+ investigates unknown racks start to finish (any tier, billed once, always succeeds), unlike a temp. Level 3+ follows an escalation it caused to its target server (keeping server identity) and repairs there, including an outage that escalation caused.
- Level 4 incident response is hands-on work with no right/wrong roll; failed-cutover retries still roll the normal cutover odds. It never migrates.
- At AI level 4 the player can fire the manager between clients, once per career. The manager's freezes, uptime recovery bonus and email foundation stay (the agent runs them); the walker, chatting, guarding and inspections go, and the manager can't be bought again.
- Obsolete ending: finishing a client with zero human actions (any hold-E work, grab/drop, pipeline send, rollback, freeze, shoo) shows the normal client review, then you are fired instead of getting the shop and next client: the AI agent persuades your manager with a tapestry of convincing emails, or, if you fired your manager, fires you itself as your new manager (HR does it if no agent is owned). It is a win, scored like retiring. One action keeps the job. Its end screen offers only "Fade to black": fade to black, credits fade in and out, boot chime, a quick "LaS OS" screen with a white progress bar that fades quickly to black when full, then black fades into the main menu; any key or click skips. A level 4 agent with full foundations plus Mover Bot should sustain a client hands-off.
- Old school: a main-menu checkbox (any difficulty) for a career with no AI upskills. Upgrades flagged `ai` (AI Agent, AI Chatbots) are never offered, the AI announcement and rumor are skipped, and foundation tags are hidden.
- Outsourced ending (old school only): from the 10th finished client, if under 15% of that client's discrete human actions were skilled, the review ends with an HR meeting instead of the shop. Routine actions are tickets, email, FinOps approvals, patching and investigating; everything else (migrations, pipeline sends, rollbacks, fires, outages, leaks, breaches, cutover retries, freezes, shooing) is skilled. Obsolete takes precedence. It is a win, scored like retiring, with "Fade to black" plus normal Play again / Main menu buttons. Its credits read "Matt Frost and" then Mr Paperclip, with his image and "R.I.P. · N days in the game" (days he was on the team; "0 days… Never hired. Still bitter." if never bought), and the boot screen is the same "LaS OS" text and progress bar on a retro green phosphor terminal. A share of all work (including bots) can't work here: with every non-AI perk the player still does 55–75% of all actions; the routine/skilled split separates players who leave migrations to the bots (0–11% skilled) from those who don't (about 50%).
- Mouse Jiggler achievement: after 3+ finished clients, your discrete actions (a whole hold-E job counts once) are under 10% of all work (yours plus AI agent attempts plus Patch Bot and Mover Bot jobs), but above zero. Shown on retired, fired and outsourced end screens, not the obsolete one.
- Each client starts with 2 seconds of immunity from users, and a user who lets you go gives 1.2 seconds more. The player blinks while immune. The temp's one question per shift respects that immunity too.
- Anyone putting out a fire sprays an extinguisher: you and the temp spray foam, the AI agent sprays a purple "digital" one (level 4 firefighting, and level 3+ cleaning up a fire its own escalation caused). Each shows a labeled progress ring on the rack.
- FinOps $ marks bob and shed a faint rising $ so they read as something to collect (static under reduced motion).
- Avatar: the player is drawn on a soft disc in the emoji's average colour with a thin amber ring, as any single emoji chosen on the main menu (quick picks or typed/pasted; first grapheme only, must be an emoji, else the previous one stays). Saved in localStorage, local only: never in report links or share images.
- Learn more: a main-menu button lists every upgrade with one real-world link (`LEARN` in the screens section) and a one-line reason it matters; shop cards carry the same link. Every upgrade needs an entry. Run `node tests/check-links.mjs` when you add or change a link (it needs the internet, so it isn't part of `tests/regression.html`); it must report 0 broken. Point links at their final address rather than one that redirects.
- Let's connect (main-menu button; the screen is headed About the author) opens a humble-brag post styled like a generic professional networking feed (no real site's logo or branding), with links to the author's LinkedIn, milagrofrost.com and the GitHub repo.
- Logging level (pause menu button, saved in localStorage, cycles ERROR → WARN → INFO → DEBUG; WARN is the default) sets how much text the floor shows. `buildPrompt` gives each hint an INFO wording, a shorter WARN one and, only for incidents (fire, outage, breach, failed cutover, rollback), a bare ERROR one. `fl(p,text,color,lvl,short)` defaults the level from the colour (red error, amber/blue warning, else info); a refused action passes `1,"✖"` so ERROR still shows a ✖. ERROR also hides user shouts and the temp/agent/manager bubbles, and a user holding you shows "…" with the timer. Mr Paperclip is never hidden. DEBUG tags floats with their level and draws `drawDebug`: labels on racks, cloud apps (live $/s, FinOps approvals, a leak or breach once visible), people and bots; a Prometheus-style metrics panel of in-world numbers (queues, uptime, spend, burn, incidents, apps); and a log tail of real events (`DBG_LOG`, every float at its own level plus toasts, kept outside `S`) mixed with joke TRACE lines. The terminal is mirrored there too (`ttyLog` via `devLog`): session open/close, each command and the first line of its reply as DEBUG; the cheat command's echo is masked, and opening the cheat menu logs "CHEATER CHEATER PUMPKIN EATER" as an ERROR. During a red alert `dbgAlertTick` adds an ERROR every 0.45 s, alternating visible incidents with general panic. DEBUG hides toasts (they're in the log, wrapped rather than cut off; still read by screen readers). Both DEBUG panels (`drawPanel`) minimize to a tab when the player comes within 40px and return past 70px; the metrics also minimize over a cloud leak, breach or failed cutover. The log slides up to the top left while a known (not hidden) bottom-row server under it is offline, burning, or has a license renewal due within 45 s (`LOG_MOVE_LIC`), judged at its full 9-line height, and slides back when that clears. Exception: if a known server it would cover at the top is burning while a bottom one is burning too, it stays at the bottom whatever the licenses say (a bottom fire is easier to watch around it). Other top-row trouble, such as an outage, doesn't hold it down. At every level, toasts move to the top while the player is at the ticket queue (115px in, 150px out). No out-of-game numbers (FPS, frame time, memory): it stays in the fiction. It is draw-only, never uses randomness, and never names hidden servers, escalation targets, pre-rolled outcomes, or risk that Observability would reveal. The hands-on tutorial always shows at least INFO. Toasts are unaffected.
- Touch FIX and GRAB buttons show one word for what they'd do where the player stands (`fixWord`/`grabWord`: PROBE, REBOOT, RETRY, SEAL, DOUSE, PATCH, REPLY, APPROVE, SHOO; GRAB, SHIP, DEPLOY, DROP, TOSS, ROLLBACK) and turn gray when nothing would happen. Size and placement never change; long words get a smaller font. Gray buttons still take presses. Toasts also move to the top whenever the player is under them (`toastsCover`), which on a phone is most of the bottom row. On iOS, sound obeys the silent switch (`navigator.audioSession` "ambient") by default, as casual games do, and other apps' audio keeps playing. The pause menu's Silent mode button (shown only where `navigator.audioSession` exists, saved in localStorage) opts into "playback". A one-time tip at the first career start on a touch device says where the sound went.
- Toolkit chips (pause and improvement sprint) show the upgrade's description in a tip that follows the mouse while over the chip; a tap shows it at the finger (tap again or elsewhere to close), and keyboard focus shows it under the chip.
- Overlays open scrolled to the top; focusing the first button must not scroll the card. Re-rendering the same screen (buying, the retro pick or brainstorming in the review) keeps the scroll position.
- Mr Paperclip · Reverse Shadow (`clip`): a 2-point one-off perk, not AI, so old school careers can buy it. He floats at the player's top-left shoulder (the donut timer has the top-right) in every client, with all the tutorial paperclip's reactions, and comments in a speech bubble on many events (`clipEv` and `CLIP_LINES`), as a backseat driver: second-guessing, micromanaging while you hold E, credit-taking, hindsight and unsolicited advice. `tickClip` also fires lines for held work, a ticket queue at 4+, and quiet 20-second stretches. His advice is comedy and mostly wrong, never mean. His only effect is +1 energy per line. Ordinary lines wait 8–12 s; outages, red alerts, breaches, VPs, failed cutovers and escalations jump the queue, but the same alarm waits 12 s. Lines are dealt without repeats per event, using his own random generator so he never shifts game odds. No mute. If your avatar is a paperclip (📎 or 🖇️), his opening line at his first client is a "twin" line instead (once per career). In the shop he comments on purchases; outside the floor and the shop he appears only in the old school credits.
- Tutorials: the main menu's Tutorials button opens the quick illustrated tour; every page of it offers 📎 Hands on Tutorial beside Main menu (it is deliberately not on the main menu itself, so the menu links stay on one line at full width). The hands-on tutorial is a reverse shadow: you do the work while a senior paperclip points at the next target on the floor and explains in a panel above it, then annotates the client review (report, DORA, retro, upskill) and ends on a finish screen. It runs one fixed client, Paperclip Supply Co. (3 known + 1 hidden), on Easy settings. Nothing spawns by itself; each lesson stages its own tickets, email, fire, user, pickups and leak. Compliance and license clocks are paused and every cutover succeeds. The day clock and migration uptime burn run normally. Its staged fire and leak grow at 75% speed and never spread; the fire can still burn through to an outage and the leak can still become a breach (a red alert), and the lesson then has you restore or contain it. During a red alert the paperclip quivers and quakes with long squeezed-shut eyes and quick peeks (shut and still under reduced motion). You can only grab servers on steps that ask for it. Tutorial runs never write career records; the paperclip's face reactions are cosmetic and never use randomness.

### Uptime recovery

- Outages burn the uptime budget by tier: gold 3/s, silver 1/s, bronze 0.25/s. Bronze and silver outages are survivable; gold is what gets you fired.
- A server shut down for migration (carried or in the pipeline) burns a quarter of its outage rate; each Redefine "Uptime" level removes 20% of that. Blue-green moves burn nothing. Moving servers are drawn as OFF. The uptime box pulses red slowly during migrations, faster when migration burn is heavy, and very fast during outages.
- The uptime budget recovers slowly unless a gold server is offline or something is breached: up to half the budget by default. Redefine "Uptime" raises the rate and cap; managers raise the rate. A manager's server visit is an inspection that takes the server offline half the time. A break sends the manager on a slow walk to the inbox and blocks visits for 45 seconds per career break, capped at 300. Holding E at that server during the inspection cancels it without counting as a break.

### Restore from backup

- The terminal's `journalctl` shows the current client's event log; 💾 rows are restore points, taken about every 30 seconds and only between update frames. Restores per career: Easy 3, Normal 2, Hard 1. Hardcore is a checkbox under Hard that means zero restores and changes nothing else.
- Charges and the log live outside `S`, so a restore cannot refund a charge. Reverted rows stay visible, greyed out. Dev tools used after a backup still mark the run.
- Restore works from play, pause, the between-client review and the fired screen; not after retiring or resigning, and not across clients. "Rollback" remains the failed-cutover mechanic.
- A restore shows a "Restoring to mm:ss state" progress bar, then waits for a key press. Randomness is not rewound.

### Sharing the end report

- Every end screen (retired, fired, obsolete, resigned) offers LinkedIn, Facebook, X and Instagram. Posts spin the outcome for laughs, but the stats on them are real.
- Sharing only reads the run. It must never change `S`, and it never posts for the player.
- Report links (`/r/<code>`) carry only numbers and fixed choices, never free text, so nobody can put their own words on an image served from this domain. `functions/_lib/report.js` mirrors the game's titles and verdicts.

### Terminal commands

- Commands only read or joke. They must never change `S`, or reveal hidden servers, escalation targets or outcomes, because the terminal pauses the game.
- `?` help follows Cisco conventions (`?`, `ping ?`, `p?`) and is driven by the `CLI` table. The cheat command stays out of it.

### Career and balance

- After two rough clients in a row (5–6 sprint points or at most 2 stars), the retrospective offers "Give me a break": one small client, sized and paced like the first, in place of that retrospective's action item. It is inserted before the next client, which waits its turn; no client or stage is skipped, and later clients keep the size and pace of their stage. The shop after that client always stocks Patch Bot and every upgrade with a base cost of 5 or more that is not owned yet, including the AI Agent once unlocked.
- Until the player owns a Patch Bot, the shop always stocks it whenever they have the points to buy it (4). Below that, and for later levels, it uses the normal draw.
- Every tool the player doesn't own yet (stackables at level 0 included) gets likelier the longer it goes unshown, so no category crowds out another: each missed improvement sprint adds 1 to their draw weight (normal items weigh 1), capped at +5. This is never a guarantee. Showing one, including after a brainstorm, resets its count.
- Cloud running costs: on-prem 0.12/s per app; cloud 0.13/s after a plain lift-and-shift. Terraform, Observability and Cloud Auto-Patching cut it 10% each, multiplied. FinOps is not a passive cut: a blue scan runs a few seconds after the first cloud app lands, then every 20–25 s (paused in explicit freezes), and flags about a third of live cloud apps with a plain green $. Approving one (tap E, or hold E and walk past several; each approval is a human action) clears the $ and cuts that app 19%; it can be flagged and approved once more for another 11% (about 28% off in all). Consolidated apps keep their savings. Flags never expire. The AI agent approves at any level and tier, after routine patches, billing tokens. Fully kitted and approved is about 45% cheaper than on-prem. Realistic but optimistic. The report shows running costs saved or added against staying on-prem, unscored. Keep the in-game disclaimer that these aren't real-world numbers.
- Short successful careers and early retirement fit the job-jumping satire. Do not automatically redesign scoring to punish them. A one-client career winning "Best retirement" is the joke, not a bug: the menu record says how many clients it took, and retiring after 1–2 clients averaging 4+ stars earns the Job Hopper achievement.
- Lower-tier-first migration advice must be feasible with wave ordering. Avoid requiring future-wave work to unlock progress in the current wave.
- Distinguish client completion from inter-wave consolidation; do not silently change risk ownership between them.

## Implementation and validation

- For presentation and interaction changes, follow `DESIGN.md` and review the affected entries in `docs/design-audit.md`. Record source evidence separately from browser observations; keep untested checks explicit.
- Make focused changes. Avoid framework migrations, broad rewrites, and dependencies unrelated to the request.
- Trace every path affecting shared state: player, bots, manager, temporary worker, AI agent, pipeline, rollback, and client transitions.
- Update tutorial text, controls, descriptions, and README whenever behavior changes. Do not leave contradictory instructions.
- Preserve pause, sound controls, keyboard/touch interaction, and reduced-motion behavior.
- Cosmetic code never draws on `Math.random`: sound and music use `sndRand`, Mr Paperclip uses `clipRand`, and drawing uses none. Otherwise sounds (throttled by wall-clock time) and music (on its own timer) shift the game's rolls and seeded runs stop matching.
- Use meaningful deterministic regression checks for accounting and state transitions. Validate full JavaScript syntax.
- Run `tests/regression.html` (served over HTTP) before pushing `main`; it must read `PASS`. Add or update checks there when you change a rule it covers, instead of writing throwaway scripts.
- Test patching early/mid/late in a cycle; covered/uncovered expiry; incident completion; failed/successful cutover accounting; freeze duration/cooldown/charge use; and escalation pickup/return/relocation when relevant.
- Browser-playtest visual and input changes. Source inspection or syntax checks alone do not establish that a UI looks or plays correctly.
- Do not refresh or restart a user's active test run unnecessarily. Use a separate tab for your checks.
- Capture real screenshots from the branch being documented; do not fabricate gameplay states or describe unmerged features as main behavior.
- Report what changed, checks performed, and outstanding limitations. Clearly distinguish local commits, pushed commits, and merges.

## Communication

Infer intent from the game's teaching purpose and the user's latest corrections. If a clarification changes the model, correct it directly. Do not keep obsolete implementations merely because they were previously proposed. Ask only when a consequential ambiguity remains; otherwise implement the smallest coherent change and show how it matches the requested behavior.

### Hidden-server discovery
Hidden servers require investigation or an outage to reveal them; never reveal based on migration progress. The three handmade clients keep their designed hidden tiers; generated clients (4+) can roll any of the three tiers. Tier totals must match the actual servers. Asset Inventory speeds investigation instead of bypassing it. Temp workers advance an unknown rack's investigation by 10–75% once, and never complete it. Escalations can target hidden racks and their fires continue growing while hidden. Reveal on burnout before applying normal outage handling. License conditions on discovery can already be expired or near expiry; charge expired liability once and preserve the normal countdown for upcoming renewals.

