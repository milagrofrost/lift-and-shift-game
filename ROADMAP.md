# Lift & Shift roadmap

Ideas and loose ends. Nothing here is a commitment.

## To do

### Make the code cheaper to work on (do first, in a fresh session)
- [ ] Move the embedded logo out of `lift-and-shift.html` into its own file.
- [ ] Add clear section markers to the game code and a short "where things live" map to `AGENTS.md`.
- [ ] Put big new systems, such as multiplayer, in their own `.js` files from the start. Don't rewrite or split the existing code.

### Check by hand
- [ ] Play with the three songs and judge how the four music stages ramp.
- [ ] Try phone controls on more real phones: button size, see-through level, stick feel.
- [ ] Watch max-level chatbots and the pipeline-only Mover Bot in a live round.
- [ ] Play engagement 5+ with the AI Agent and judge its odds with and without supporting upgrades.
- [ ] Judge uptime recovery and the new bronze/silver/gold burn rates over a full career.

### Small fixes and housekeeping
- [ ] Republish the claude.ai artifact, or retire it now that las.milagrofrost.com is home (it's on version 45).
- [ ] Retake the README screenshots; they predate most gameplay changes.
- [ ] Delete old GitHub branches: `feature/blue-green-staging`, `feature/maintenance-and-migration-fixes`.
- [ ] Decide whether the small "Lift & Shift" header text should become the logo.
- [ ] Add a doctype to `lift-and-shift.html`; the deployed page currently runs in quirks mode.
- [ ] Decide whether the donut shop music should ramp with trouble like the other songs.
- [ ] Decide whether the Mover Bot should leave a lane free when you only have one.

### Balance and testing
- [ ] Build a better playtest bot. The current one rarely gets past client 2, so later clients, freezes and managers are unmeasured.
- [ ] Tune the AI Agent foundation values, uptime recovery rates, and escalation spacing from real play.

### Possible, from the November 2026 balance review
None of these are decided. They came out of simulated careers, which play worse than a seasoned person.
- [ ] Hard: winnable past client 3 with seasoned play (confirmed by hand), so it is doing its job. Simulated careers never got that far. Only revisit if Hard should also be reachable for players who are good but not seasoned.
- [ ] Normal for first-timers: get someone new to play it. Seasoned play clears client 3 most times; simulated play mostly did not, and breaches were the usual cause.
- [ ] VPs during red alerts: with a full inbox they still grab you mid-breach, and email can't be answered during an alert to stop them. Consider having them wait until the alert is over.
- [ ] Leak pressure at client 3: a 30% lower leak rate was the strongest single lever in testing. Hold unless new players turn out to need it.
- [ ] "Best retirement" record: least total spend means a one-client career always wins it. Consider spend per client, or a record per career length.
- [ ] "Give me a break" replaces the next client, so taking it before client 3 skips the hospital. Decide whether it should delay it instead.
- [ ] Late game: a fully kitted career clears a 22-server client in about 90 seconds with no incidents. Decide whether that needs a new source of tension.
- [ ] Remove dead code: `expireEmail`, `TICKET_LIFE`, `aiOn`/`errRate`, `S.rival`.

## AI Agent rework (ideas from the first Living Legend run)

Late-game AI was a disaster on a 10-client career with no Patch Bot: patching sat around 55–60% and broke things. None of this is settled; balance it by playing.

**Agent tiers** (built; needs playtesting)
- Level 1 only touches bronze servers, on-prem and in the cloud, and still does tickets. It keeps today's starting odds.
- Level 2 starts at 80% on everything, plus whatever the foundation upgrades add.
- Level 3 starts at 90%, plus foundations. It should never reach 100%; some failures stay.
- Level 2 adds silver and level 3 adds gold. Level 4 stays as the guardrails capstone.

**It cleans up its own mess** (built; needs playtesting)
- Today it breaks something and walks away. Instead it stays and tries to fix it, with its own chance of succeeding.
- If the repair fails, the problem falls to the player as it does now.

**Shop luck**
- Guarantee key tools show up. Patch Bot has about a 1-in-6 chance per sprint and can be missed for a whole career, even with Brainstorm. Consider always offering Patch Bot, and possibly Chatbots, until owned.

**Ending: replaced by the AI, then rehired**
- If the AI does about 90% or more of the actions, you're let go because you're no longer needed.
- Game over, fade to black, then: "You've been rehired." The agent went rogue and everything is on fire.
- You fix it all with no penalty for the damage already done, finish the migration, collect a $1 million bonus, quit on your own terms and retire to a perpetual vacation.

## Next up
0. **Share your results.** A snapshot of the end report to post on social media, including where your time and money went and which upgrades you bought.
1. **Saved sessions.** Autosave between clients only, with a "Resume career" button. Today a refresh wipes the career.
2. **Chaos Monkey.** Opt-in modifier for bigger rewards. A monkey randomly kills servers, lanes or the inbox; enough resilience makes it barely matter. Covers the "game day" idea.
3. **Résumé lies and permanent unlocks.** Earn "LinkedIn endorsements" across careers to unlock starting lies, such as "Claimed Kubernetes experience": start with Terraform, but gold servers are harder.
4. **Achievements as bad performance reviews.** "Took down prod on a Friday." "Retired after one client."
5. **Daily client.** Same seeded client for everyone, one attempt, lowest-IT-spend leaderboard.

## Nice to have
- More odd clients: insolvent crypto startup, slow government agency, the server in Grandpa's closet.
- Shareable end card: "Fired after 3 clients. Cause: Linda's DB."
- Vendor swag loot crates: stress ball (+5 energy), conference lanyard (users hold you 10% less), "Cloud Ninja" T-shirt (does nothing), expired cloud credit (-$4k to process).
- "Days since last incident" streak as the only streak mechanic.
- A CAB gate on client 3.
- Zombie users, fought off with a fire extinguisher on a new key.

## Multiplayer (two-player co-op)

**Design ideas**
- Split the map: one player starts on-prem, the other in the cloud; the hallway is the danger zone.
- Two-person gold cutovers that need a live handoff.
- Change approvals: risky moves need the other player to hold E.
- Rescue a partner pinned by a VP.
- One on-call pager, passed between players.
- "Blameless" postmortem that assigns blame; credit stealing in the review; shared story points.
- Scale difficulty for two players. A disconnected player becomes "a temp."

**Tech plan**
- Start with a couch co-op prototype to prove it's fun.
- Online: one browser hosts and runs the game; the other sends inputs and draws state.
- Plain JavaScript and canvas; WebRTC for data and voice; a small TypeScript Cloudflare Worker with one Durable Object per room for join codes; Cloudflare TURN for strict networks.
- Send inputs about 30 times a second and state about 15 times a second, with smoothing on the guest.
- Desktop first.

**Rough cost at 1,000 concurrent players (estimate; check current pricing)**
- About $70/month if 1,000 is only the peak.
- About $250–$300/month if sustained around the clock.
- Mostly TURN relay traffic. Small audiences should fit in the free tiers or the $5 Workers plan.

## Probably not
- Daily login rewards or streak guilt, except as a joke.
- Paid loot boxes, unless the joke is that it contains an invoice.
- Dedicated game servers for two-player games.
