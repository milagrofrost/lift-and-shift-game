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
- `lift-and-shift.html` contains the game. No build system is required.
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
- Rollback counts as service restoration. Player, bot, and pipeline migrations must use consistent delivery statistics.

### Escalations, recovery, and freezes

- Ticket escalations **do cause server fires**. Do not replace this with random infrastructure fires or penalties alone.
- During any outage or active breach, slow escalation pressure considerably; the feature branch uses one-quarter normal escalation speed. Escalations still happen outside explicit freezes.
- Escalations retain server identity through pickup, relocation, pipeline transit, failed cutover, and rollback. Wait at the last rack while the target is absent; reacquire its actual rack when it returns. Do not silently retarget a different server or discard the escalation on pickup.
- Successful migration may retire that server's escalation.
- Managers provide bounded automatic freezes for critical incidents; all tiers help, higher tiers provide more protection. Explicit freezes pause users, arrivals, queue pressure, fire growth/spread, and breach spread while recovery continues.
- Downtime and active breach damage still count during freezes. A freeze contains chaos; it does not fix the incident.
- Prevent repeated automatic retriggering within one continuous incident. Respect cooldowns.
- Emergency freeze is a single carried charge, repurchasable after use. Extend existing protection with a cap rather than wasting the charge or stacking indefinitely.
- No adrenaline system has been requested.

### Career and balance

- Short successful careers and early retirement fit the job-jumping satire. Do not automatically redesign scoring to punish them.
- Lower-tier-first migration advice must be feasible with wave ordering. Avoid requiring future-wave work to unlock progress in the current wave.
- Distinguish client completion from inter-wave consolidation; do not silently change risk ownership between them.

## Implementation and validation

- Make focused changes. Avoid framework migrations, broad rewrites, and dependencies unrelated to the request.
- Trace every path affecting shared state: player, bots, manager, temporary worker, AI agent, pipeline, rollback, and client transitions.
- Update tutorial text, controls, descriptions, and README whenever behavior changes. Do not leave contradictory instructions.
- Preserve pause, sound controls, keyboard/touch interaction, and reduced-motion behavior.
- Use meaningful deterministic regression checks for accounting and state transitions. Validate full JavaScript syntax.
- Test patching early/mid/late in a cycle; covered/uncovered expiry; incident completion; failed/successful cutover accounting; freeze duration/cooldown/charge use; and escalation pickup/return/relocation when relevant.
- Browser-playtest visual and input changes. Source inspection or syntax checks alone do not establish that a UI looks or plays correctly.
- Do not refresh or restart a user's active test run unnecessarily. Use a separate tab for your checks.
- Capture real screenshots from the branch being documented; do not fabricate gameplay states or describe unmerged features as main behavior.
- Report what changed, checks performed, and outstanding limitations. Clearly distinguish local commits, pushed commits, and merges.

## Communication

Infer intent from the game's teaching purpose and the user's latest corrections. If a clarification changes the model, correct it directly. Do not keep obsolete implementations merely because they were previously proposed. Ask only when a consequential ambiguity remains; otherwise implement the smallest coherent change and show how it matches the requested behavior.
