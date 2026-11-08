# Lift & Shift

A browser game about migrating applications to the cloud while keeping everyday IT operations running.

You are the newest consultant at Lift & Shift Consulting. The migration has a deadline. The business still needs its systems. Tickets, emails, patching, compliance, outages, security incidents, and people competing for your attention do not stop just because a migration project started.

![Lift & Shift career selection](docs/screenshots/title.png)

## Why this game exists

Lift & Shift is a playful teaching simulation of **cloud migrations and business as usual (BAU)** for people working in IT, engineering, and DevOps. It makes competing responsibilities visible: delivering change, maintaining service, controlling spending, and protecting reliability all draw on the same limited attention.

The lesson is not to become a faster superhero. It is to build a better operating environment. Early in a career, you do most work yourself. Over time, investment in automation, policies, security controls, and people should free you to manage migrations and exceptions instead of continually fighting fires.

The game uses satire and compressed time. Its probabilities, costs, DORA-style ratings, and incident behavior are teaching devices, not production forecasts or real-world benchmarks.

## How it plays

1. Start a career and choose a difficulty.
2. Pick up applications in the on-premises room and carry them through the hallway to the cloud.
3. Choose migration order carefully: bronze applications build experience for silver and gold cutovers.
4. Keep BAU moving: answer email, close tickets, patch systems, contain leaks, and restore service.
5. Recover failed cutovers in the cloud or roll them back on-premises.
6. Complete a client, review the results, and spend improvement points on tools and support for future clients.

Later clients bring larger environments, hidden applications, and more operational pressure. Tools carry forward. You can continue your consulting career or retire between clients.

![The on-premises room, operational hallway, and cloud migration floor](docs/screenshots/gameplay.png)

## What you learn by playing

| Game system | Operational lesson |
| --- | --- |
| Migration tiers and failed cutovers | Sequence changes, understand risk, and keep a recovery path. |
| Hidden servers | Discovery and asset inventory matter before a migration. |
| Email, tickets, and interruptions | BAU competes with project delivery for real capacity. |
| Uptime and security | Shipping is not the only measure of success. |
| Licenses, running costs, and lease targets | Migration timing has financial consequences. |
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
| Space / J | Grab or drop; hold near a failed cloud cutover to roll back |
| Hold E / K | Contextual work: patch, firefight, restore, contain, investigate, answer, or close |
| P / Escape | Pause or resume |
| M | Toggle sound effects |
| Music button | Toggle music |

Touch controls are available on supported layouts. Tutorial, How to play, and Why it works this way explain the mechanics in-game. The pipeline upgrade adds a hold-Space action at a rack.

## Development status

This is an evolving prototype implemented in one HTML file containing the interface, canvas rendering, simulation, and audio. Screenshots above show `main`.

The gameplay revisions are merged into `main`, including current-cycle patch coverage, incident completion rules, rollback accounting, manager change freezes, and persistent escalation targeting.

Play at **https://las.milagrofrost.com**. Cloudflare Pages automatically deploys pushes to `main`. The screenshots above were captured before these gameplay revisions.

## Contributing, including AI assistants

Read [AGENTS.md](AGENTS.md) before making changes. It records the teaching goals, agreed gameplay direction, branch expectations, and validation guidelines. Preserve the relationship between mechanics and the operational lesson they are intended to teach. Explain balance changes and test their interactions instead of treating isolated functions as the whole game.
