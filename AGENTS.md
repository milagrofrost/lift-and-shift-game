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
- Each escalation needs 12 seconds of full queue, and a dip below full does not reset that wait. While any server is burning, escalation runs at half speed; an outage or active breach takes precedence at one-quarter speed.
- Escalations retain server identity through pickup, relocation, pipeline transit, failed cutover, and rollback. Wait at the last rack while the target is absent; reacquire its actual rack when it returns. Do not silently retarget a different server or discard the escalation on pickup.
- Successful migration may retire that server's escalation.
- Managers provide bounded automatic freezes for critical incidents; all tiers help, higher tiers provide more protection. Explicit freezes pause users, arrivals, queue pressure, fire growth/spread, and breach spread while recovery continues.
- Downtime and active breach damage still count during freezes. A freeze contains chaos; it does not fix the incident.
- Prevent repeated automatic retriggering within one continuous incident. Respect cooldowns.
- Emergency freeze is a single carried charge, repurchasable after use. Extend existing protection with a cap rather than wasting the charge or stacking indefinitely.
- No adrenaline system has been requested.

### AI Agent foundations

- The AI Agent amplifies existing practices. With no foundations for a job, it keeps its base level odds; each relevant upgrade improves that job only (patching: Patch Bot, Runbooks, Observability). Foundations shift results toward success; they do not add a penalty or stop tokens being billed.
- Level 1 only touches bronze servers, level 2 adds silver, level 3 adds gold; tickets and email are open at every level. Baselines are 50%, 80% and 90% right, and never certain.
- A Patch Bot automation error draws the agent ahead of tickets and email, within its server tiers, using its normal patching odds.
- When the agent breaks something it stays, apologizes, and makes one billed repair attempt. A failed repair leaves the problem to the player and never causes further damage. Damage already charged stays charged.

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

- Every end screen offers LinkedIn, Facebook, X and Instagram. Posts spin the outcome for laughs, but the stats on them are real.
- Sharing only reads the run. It must never change `S`, and it never posts for the player.
- Report links (`/r/<code>`) carry only numbers and fixed choices, never free text, so nobody can put their own words on an image served from this domain. `functions/_lib/report.js` mirrors the game's titles and verdicts.

### Terminal commands

- Commands only read or joke. They must never change `S`, or reveal hidden servers, escalation targets or outcomes, because the terminal pauses the game.
- `?` help follows Cisco conventions (`?`, `ping ?`, `p?`) and is driven by the `CLI` table. The cheat command stays out of it.

### Career and balance

- After two rough clients in a row (5–6 sprint points or at most 2 stars), the retrospective offers "Give me a break": one small client, sized and paced like the first, in place of that retrospective's action item. The shop after that client always stocks Patch Bot and every upgrade with a base cost of 5 or more that is not owned yet, including the AI Agent once unlocked.
- Until the player owns a Patch Bot, the shop always stocks it whenever they have the points to buy it (4). Below that, and for later levels, it uses the normal draw.
- Stackable tools still at level 0 get likelier the longer they go unshown: each missed improvement sprint adds 1 to their draw weight (normal items weigh 1), capped at +5. This is never a guarantee. Showing one, including after a brainstorm, resets its count.
- Short successful careers and early retirement fit the job-jumping satire. Do not automatically redesign scoring to punish them.
- Lower-tier-first migration advice must be feasible with wave ordering. Avoid requiring future-wave work to unlock progress in the current wave.
- Distinguish client completion from inter-wave consolidation; do not silently change risk ownership between them.

## Implementation and validation

- Make focused changes. Avoid framework migrations, broad rewrites, and dependencies unrelated to the request.
- Trace every path affecting shared state: player, bots, manager, temporary worker, AI agent, pipeline, rollback, and client transitions.
- Update tutorial text, controls, descriptions, and README whenever behavior changes. Do not leave contradictory instructions.
- Preserve pause, sound controls, keyboard/touch interaction, and reduced-motion behavior.
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

