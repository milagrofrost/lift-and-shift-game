# Lift & Shift roadmap

Ideas and loose ends. Nothing here is a commitment.

## To do

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

## Next up
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
