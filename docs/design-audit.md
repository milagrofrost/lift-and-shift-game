# Design consistency audit

Baseline: 2026-11-11, local branch `codex/design-standard`, based on the checked-out `main`. This pass adds the standard and audits source; it changes no game behavior. Findings are open unless explicitly marked otherwise.

## Evidence and limits

Inspected `lift-and-shift.html` styles, shared colours/fonts, rack and cloud rendering, overlay/focus handling, tooltips, and responsive controls against [DESIGN.md](../DESIGN.md). References below name functions/selectors so they remain useful as line numbers change.

The separate preview browser could not reach the local HTTP game (empty response on port 8766; timeout on a dedicated server on port 8778). No visual conformance, mobile playtest, contrast measurement, or keyboard navigation result is claimed. No active player run was restarted. The pending matrix below is part of this audit, not a completed test.

## Open findings

| ID / priority | Source evidence | Inconsistency and focused follow-up | Acceptance check |
| --- | --- | --- | --- |
| D03 / medium | `.btn:focus-visible`, `.diff:focus-visible`, `.retro-opt:focus-visible` use blue/2px offset; `.toolkit span[data-tip]:focus-visible` uses amber/1px; `.sbtn:focus-visible` uses ink/1px | Ordinary focus uses three treatments without an established contrast reason. Align tooltip and share focus with the common treatment, or document a measured contrast exception. | Keyboard traversal visibly identifies focus separately from selection on menu, pause, review, and share controls. |
| D04 / medium | `.avatar .avpick` is 34×34px; `.avatar input` is 44×34px; `.sndbtn`, `.btn.sm`, `.sbtn` have compact padding and no 44px minimum | Some controls are smaller than the standard's touch target. Measure actual hit areas; enlarge for coarse pointers while preserving landscape floor space. | Phone landscape menu, pause, review, and share controls have usable hit areas, no overlapping targets, and no clipped overlay content. |
| D05 / low | CSS defines `--f-display`, `--f-body`, `--f-mono`; canvas defines separate literal `MONO`, `DISP`, `BODY`; credits repeat font literals and near-palette colours | Type and colour roles can drift because some equivalents are duplicated. Derive canvas fonts from shared roles and reuse semantic tokens for ordinary credits text when touched. Preserve intentional boot/letter/room exceptions. | Change one type role in a test preview and verify corresponding DOM/canvas typography, fallback behavior, and fit. |
| D07 / low | `drawPlayer` immunity and ghost blinks, badge-reader denied blink, focus blink | These on/off blinks carry state, so they were not frozen with the decorative loops. Under reduced motion, show the same state with a steady treatment (for example a fixed lower opacity or outline) instead of flashing. | With reduced motion, immunity, ghost fade, badge denial and focus are each recognizable without flashing. |

## Resolved in source

Browser check (local, phone-landscape viewport, reduced motion forced through `matchMedia`): a floor with a fire, an outage, an automation error, a leak, a breach and a gold cloud outage was drawn at two times 0.37 s apart. With reduced motion, 0 canvas pixels differed; with normal motion, about 97,000 did. The same pass froze decorative loops outside D01/D02: drifting cloud-floor clouds, pipeline conveyor chevrons, the coffee-boost rings and sparks, and the in-flight escalation pulse. Blinks that carry state (player immunity, ghost fade, badge denied, focus) are unchanged and remain open as D07.

| ID | Change | Evidence |
| --- | --- | --- |
| D01 | Rack effects read `decoT()`, a clock that stands still under `RM`: offline smoke, fire glow and flame jitter, the automation-error border pulse, the license-due pulse, and (missed by the first pass) the `?` bounce while investigating. Each holds one steady frame; labels, bars and rings stay. | Source review, regressions pass, and the frozen-frame pixel comparison above. |
| D02 | Cloud effects use the same clock: breach pulse, glitch bars and data stream, leak heartbeat and drips, and (missed by the first pass) the pulsing dashed border on a gold app that is down. Growth and spread are untouched. | Source review, regressions pass, and the frozen-frame pixel comparison above. |
| D06 | Touch FIX/GRAB/freeze/pause usually sit over the light cloud floor, where the old translucent white fills gave about 1.2:1 (gray word) and 1.4:1 (lit word). Fills are now dark and see-through. Measured by alpha-blending against `--sky`, `--hall` and `--prem` (text shadow ignored): lit words ≥5:1, gray words ≥3.2:1, pressed ≥4.4:1, and the gray fill stands ≥4.4:1 off the cloud floor. | Contrast computed from the CSS values; checked in a phone-landscape browser view. Physical-device check pending. |

High = accessibility or comprehension issue to prioritize; medium = interaction consistency; low = maintenance drift. These priorities do not claim a measured severity or require a broad redesign.

## Patterns consistent in source

| Area | Evidence | Result |
| --- | --- | --- |
| Shared palette | `:root` and `C` colour bridge | Existing semantic roles form a coherent baseline; some hard-coded variants still need contextual review. |
| Patch coverage | `drawRack` uses green bar and `✓ COVERED`; risk ring requires `!a.covered` | Matches the covered/uncovered distinction. Timing behavior is outside this presentation audit. |
| Outages and failed cutovers | `drawRack` and `drawSlot` use `OFFLINE`, dark surfaces, and restoration/retry progress | Status has text and shape cues beyond colour. Readability at phone scale remains untested. |
| Hidden racks | `drawRack` returns after unknown/investigation drawing | Unknown presentation does not print identity or tier in this path. |
| Overlay entry | `show` focuses with `preventScroll` and resets scroll; `review` captures/restores scroll | Implements the intended entry/re-render distinction in source. Runtime check pending. |
| Toolkit explanations | `showTip`, pointer and focus listeners, viewport clamping | Mouse, touch, and keyboard paths exist. Runtime placement and focus checks pending. |
| Responsive baseline | Narrow card padding, menu wrapping, landscape touch layout, standalone safe-area rules | Existing responsive patterns can be reused. Actual fit remains untested. |

## Pending browser review matrix

Use a separate localhost tab or branch preview; never refresh a player's active career. Observe real reachable states; do not present fabricated states as gameplay screenshots.

| Surface / states | Desktop / keyboard | Phone landscape / touch | Reduced motion |
| --- | --- | --- | --- |
| Menu, avatar, difficulty, old school, help links | Pending | Pending | Pending |
| Quick tour and hands-on tutorial, work targets/progress | Pending | Pending | Pending |
| Covered/uncovered racks, warning rings, unknown investigation | Pending | Pending | Pending |
| Fire, outage, automation error, license urgency | Pending | Pending | Pending |
| Leak, breach, failed cutover, retry and rollback | Pending | Pending | Pending |
| HUD, toasts at queues/player, DEBUG panels | Pending | Pending | Pending |
| Pause, toolkit tips, review re-render, shop | Pending | Pending | Pending |
| End reports, sharing, letter, credits and both boot styles | Pending | Pending | Pending |

Measure contrast for essential text, focus, and controls on both dark and cloud surfaces. Include portrait rotation prompt and standalone safe areas in a physical-device pass. Close findings only after the corresponding acceptance check; source changes alone do not close visual findings.
