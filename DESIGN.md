# Lift & Shift design language

This is the shared reference for the game's presentation and interaction. Use it when adding or reviewing UI, canvas drawing, tutorials, reports, and controls. It documents the existing direction and sets rules for future changes; it is not a claim that every current screen conforms. Open findings live in [the design audit](docs/design-audit.md).

AGENTS.md owns gameplay rules and tuning. This standard must not change probabilities, timers, costs, priorities, or information available to the player. When a presentation conflicts with a mechanic, make the presentation accurately explain the mechanic.

## 1. Character and hierarchy

The game is an operations console in a server room after hours: dark, compact, readable, and lightly industrial. The warm on-prem room, neutral hallway, and light cloud room make location apparent. Keep the layout anchored by the HUD above the floor and contextual controls around it.

Priority is: active incident and recovery action; work target and progress; operational pressure; supporting explanation; comedy and decoration. Routine maintenance must not look like a service failure. Mature automation should feel helpful and visibly reduce intervention.

Use the existing logo asset. Keep controls in familiar positions as labels and state change. Do not obscure an actionable rack, cloud app, or queue with feedback panels.

## 2. Colour and state

Use the CSS variables in `:root`; canvas semantic colours come from the existing `C` bridge. Do not introduce a near-duplicate hex value for an existing role. Shading, transparency, and room-specific contrast variants are permitted when they preserve that role.

| Role | Existing token / value | Meaning |
| --- | --- | --- |
| Background | `--bg` / `#0e1a23` | Page background |
| Surface | `--panel` / `#152634` | Cards, HUD, tooltips |
| Raised surface | `--panel-2` / `#1c3243` | Nested information and options |
| Divider | `--line` / `#2a4558` | Neutral boundary |
| Main text | `--ink` / `#e7eef3` | Primary content on dark surfaces |
| Supporting text | `--muted` / `#8ea5b4` | Secondary detail, never invisible essential instructions |
| Action / attention | `--amber` / `#ffb547` | Primary action, selection, approaching risk |
| Failure / urgent risk | `--danger` / `#ff5d4d` | Incidents, failed actions, imminent loss |
| Success / protection | `--ok` / `#5fd38d` | Successful work, covered cycles, savings |
| Information / developing leak | `--leak` / `#45aefc` | Informational systems, early leak cues, keyboard focus |
| AI identity | `--ai` / `#b896ff` | AI tools and foundations, not success odds |
| Cloud text | `--sky-ink` / `#1d4058` | Readable text on the light cloud floor |

Always pair consequential colour with a word, symbol, shape, or progress treatment. Tier colour identifies bronze, silver, or gold; it must not replace incident status. Blue has multiple established uses: name the system or action so it is not mistaken for a leak.

| State | Required presentation | Avoid |
| --- | --- | --- |
| Healthy / available | Calm surface, identity and normal work cues | Alarm styling for routine work |
| Covered patch cycle | Green draining bar and `✓ COVERED` | Numeric countdown, warning circle, implying a new timer |
| Uncovered cycle | Countdown; amber then red risk ring at existing thresholds | Changing thresholds to fit the artwork |
| Maintenance needed / automation error | Named issue and appropriate work cue | Claiming the service is offline when it is running |
| Developing leak | Droplet, developing-risk bar and escalation cues | Calling it a breach before it becomes one |
| Fire / outage / active breach / failed cutover | Explicit incident label or recognizable incident symbol plus recovery cue | Colour alone, decoration hiding progress |
| Migration offline | `OFF` and movement/progress context | Making a planned move indistinguishable from failed cutover |
| Unknown rack | `?`, unknown/investigation state and progress | Hidden identity, tier, or future outcome |
| Unavailable action | Muted treatment; actual disabled controls use disabled semantics | Treating gray touch actions as disabled: they still accept presses |

Danger can mark imminent risk as well as active failure. The accompanying label must distinguish them. Green work progress means a recovery job is advancing, not that the incident has already cleared.

## 3. Typography, spacing, and shape

Reuse the three existing type roles: Chakra Petch (`--f-display`) for headings and action labels; IBM Plex Sans (`--f-body`) for prose; IBM Plex Mono (`--f-mono`) for numbers, clocks, logs, and compact floor labels. Preserve system fallbacks and tabular numerals for changing values. Canvas fonts should follow the same roles.

Use the component's existing size before adding a new size. Reference sizes are 28px overlay headings, 15px primary buttons, 13–15px supporting prose, and about 10.5–12px compact labels. These are existing CSS sizes, not a promise of readability at every canvas scale: inspect the actual displayed result. Essential instructions must remain readable without relying on tiny metadata.

Prefer the existing spacing family: 4/6px within dense groups, 8/10/12px within components, 14/16/18px between groups, and 24px desktop overlay padding (18px on narrow screens). Choose by hierarchy; do not normalize every historical measurement merely for numerical uniformity.

Use 6px radii for controls and chips, 8px for inner cards and the stage, and 10px for overlay cards. Pills and circles denote badges, avatars, and touch controls. On-prem racks and rounded cloud apps intentionally have different silhouettes.

## 4. Components and interaction

| Component | Reuse and behavior |
| --- | --- |
| Primary action | `.btn`: amber fill, dark text, short action verb. Give the next step clear prominence. |
| Secondary action | `.btn.ghost`: neutral outline. `.btn.sm` for compact variants. |
| System controls | `.sndbtn` and existing touch controls; keep their placement stable. |
| Choice cards | `.diff`, `.retro-opt`: readable title, consequence, visible selected state, keyboard focus. |
| Upgrade card | `.up`: identity, description, price/action, ownership/level, Learn more; AI/foundation styling only where relevant. |
| HUD / results | `.chip`, `.hb`, `.stat`, `.dm`: stable labels, aligned numbers, explicit units and status. |
| Overlay | `.overlay` / `.card`: one scrollable content surface, clear heading, obvious next/back/exit action. |
| Toolkit tip | Existing `.toolkit` / `.tip`: mouse, tap, and keyboard access to the same description. |
| Share controls | `.sbtn`: match ordinary compact action typography and focus behavior; sharing is player initiated. |

Keyboard focus uses a visible 2px blue outline with 2px offset on ordinary controls. On backgrounds where blue is unclear, use a documented high-contrast equivalent. Amber selection must remain distinguishable from focus. Hover must never be the only way to obtain an explanation or operate a control.

For new or revised touch targets, aim for at least 44×44 CSS pixels, including the effective clickable area. Audit compact existing controls before changing their layout. Keep FIX and GRAB positions and sizes stable; change the contextual word and reduce its font size for long words. Maintain keyboard equivalents and pause behavior.

New screens open at the top. Focusing a button must not scroll past introductory content. Re-rendering the same review preserves scroll. Tooltips stay within the viewport. Check keyboard navigation through dialogs, including the visible focus location and return to play; do not assume a dialog role alone supplies keyboard behavior.

## 5. Feedback and language

Persistent state belongs on the affected object or HUD. A progress bar shows amount or time; a labeled work ring shows who is doing which job. A toast explains a discrete event or consequence. A floor prompt explains the action available here. Sound reinforces the visual cue; it must not be the only cue.

Keep toast placement clear of the player's work and respect the existing ticket-queue and player-overlap rules. DEBUG moves event text into the log. ERROR/WARN/INFO verbosity changes wording, not access to essential state; hands-on practice shows at least INFO. Mr Paperclip retains his established exception.

Use clear verbs: PATCH, DOUSE, REBOOT, RETRY, SEAL, PROBE, REPLY, APPROVE, SHOO; GRAB, SHIP, DEPLOY, DROP, TOSS, ROLLBACK. Compact touch vocabulary may differ from explanatory prose, but the same action must mean the same thing everywhere. A restore point restores a past state; rollback restores a failed cutover on-prem. Do not interchange them.

Put the fact and consequence before the joke. IT satire may exaggerate office culture, but must not misstate actual cost, risk, completion, or recovery. Tutorials, shop descriptions, README, and floor instructions must agree. Keep real-world cost and benchmark disclaimers.

## 6. Motion, sound, and accessibility

Respect `prefers-reduced-motion` in CSS and the existing `RM` flag in canvas. Remove decorative travel, shaking, pulsing, streaming particles, and repeated flashing under reduced motion; retain a steady label, border, symbol, or progress indicator. Normal simulation movement and meaningful progress remain. Never suppress the incident itself.

Keep sound and music controls, iOS silent-mode behavior, and other-app audio behavior. Cosmetic effects must not consume gameplay randomness: drawing uses none; sound/music use `sndRand`; Mr Paperclip uses `clipRand`.

Check text contrast on its actual surface, especially light cloud backgrounds and translucent controls. For changed text, target 4.5:1 for normal text and 3:1 for large text; focus and meaningful control boundaries should reach 3:1 against adjacent colours. Record measurements rather than assuming the palette guarantees contrast. These are review targets, not a certification of current accessibility.

## 7. Intentional exceptions

The resignation letter may use paper colours and serif type; the terminal and old-school boot may use phosphor green; credits may use cinematic scale; the author post may resemble a generic professional feed. Share images can adapt layout and contrast to export dimensions. These exceptions preserve action clarity, real statistics, readable text, and motion preferences. Do not apply their styling to ordinary gameplay controls without a reason.

## 8. Consistency review

For every UI change:

- Identify the affected state, component, and rule above; reuse its implementation where possible.
- Check the same meaning across on-prem, cloud, HUD, tutorial, review, pause, and reports where affected.
- Inspect desktop and phone landscape, narrow overlays, keyboard focus, touch, and reduced motion. Check long labels and changing numbers for clipping or layout jumps.
- Verify relevant healthy, warning, covered, working, failed, and unavailable states. Do not expose hidden information to make a display easier to inspect.
- Record evidence and unresolved gaps in the audit. Separate source checks, actual browser observations, measured checks, and untested cases.
- Run full script syntax and relevant deterministic regressions when implementation changes. Follow AGENTS.md for gameplay, link, PWA, and pre-publication checks.

Documentation-only edits need link/diff review; they do not require new gameplay tests. A source audit does not establish visual or input conformance. Resolve findings in focused changes and update this standard when an intentional new pattern is accepted. No framework migration or separate component library is required.
