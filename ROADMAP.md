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
- [ ] Decide whether the small "Lift & Shift" header text should become the logo.
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
- [ ] Late game: a fully kitted career clears a 22-server client in about 90 seconds with no incidents. Decide whether that needs a new source of tension.

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

## Next up
1. **Saved sessions.** Autosave between clients only, with a "Resume career" button. Today a refresh wipes the career.
2. **Chaos Monkey.** Opt-in modifier for bigger rewards. A monkey randomly kills servers, lanes or the inbox; enough resilience makes it barely matter. Covers the "game day" idea.
3. **Résumé lies and permanent unlocks.** Earn "LinkedIn endorsements" across careers to unlock starting lies, such as "Claimed Kubernetes experience": start with Terraform, but gold servers are harder.
4. **More achievements as bad performance reviews.** "Took down prod on a Friday." A few exist already (Mouse Jiggler, Job Hopper, Automated Yourself Out of a Job).
5. **Daily client.** Same seeded client for everyone, one attempt, lowest-IT-spend leaderboard.

## Nice to have
- More odd clients: insolvent crypto startup, slow government agency, the server in Grandpa's closet.
- Vendor swag loot crates: stress ball (+5 energy), conference lanyard (users hold you 10% less), "Cloud Ninja" T-shirt (does nothing), expired cloud credit (-$4k to process).
- "Days since last incident" streak as the only streak mechanic.
- A CAB gate on client 3.
- Surreal second-career hallway users: see the brainstorm below. Hospital zombies interrupt but do not bite; combat is not part of the current concept.

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

## Second career: return, reassess, and the strange familiar (brainstorm, 11 November 2026)

Planning notes only; nothing in this section is implemented or a settled specification.

### Premise and how the idea evolved
- The credits and LaS OS boot screen suggest a cycle, possibly a simulation. Keep the explanation unresolved; surreal familiarity is more useful than committing to simulation lore now.
- The player previously migrated clients well and learned good practices, then was fired, replaced, outsourced, or left. In their absence, clients let those practices deteriorate and now hire the player back.
- Initial concept: reverse the journey, migrating cloud workloads back to on-prem. Corporate strategy could swing back again after the ending; repeated full back-and-forth campaigns are not the intended requirement.
- Latest direction broadens that: investigate and decide what should stay in cloud, return on-prem, or become hybrid. Improving the existing cloud estate can be a successful outcome. Explore cost savings, availability, and appropriate placement rather than teaching that either location is universally best.
- Reuse the familiar map, design, and core interactions, but make the second career feel different through discovery, visibility, decisions, and atmosphere.

### The dark cloud room
- The cloud/data-center area is dark because the client lacks visibility into what it runs. A small pool of light surrounds the player; approaching something lets them see what it is without revealing the bigger picture.
- Progression can enlarge that visible area and provide better monitoring. Monitoring may be an interim investment while migrating, or support a decision to stay.
- Candidate distinction, not yet agreed: proximity reveals a service, investigation explains its purpose/cost/health/dependencies, and remote monitoring supplies current status. Consider keeping discovered locations with last-known status rather than requiring memorization.
- Candidate loop: discover, stabilize, assess, improve or relocate, verify. Exact visibility rules, controls, progression, economics, and completion criteria remain open.
- Design questions: keep incidents and interaction targets legible; darkness should communicate missing knowledge without making the game inaccessible. Resolve reduced-motion and other accessibility needs before implementation.

### What went wrong after the player left
Possible inherited problems: abandoned test resources and snapshots; oversized capacity; scaling instead of fixing faults; excessive data movement; resilience removed to cut costs; excessive automation permissions; ignored or disabled monitoring; poorly controlled retries.
- These provide understandable causes for cost, availability, and control concerns. They are scenario candidates, not claims that repatriation fixes them automatically.
- Earlier premise: the player recommends cleanup, but clients insist on returning on-prem and reject the advice.
- Latest direction reopens that mandate: can evidence convince a client to optimize cloud, repatriate selectively, or accept hybrid? Whether persuasion is playable, narrative, or client-specific is undecided.
- Candidate destination preparation: ready on-prem capacity before transfer while cloud costs continue. Dependencies and hybrid links could matter, but avoid making hybrid a free best answer.
- Candidate success measure: a healthy, understood, economically appropriate service can be resolved in place; migration count alone should not force every workload to move. Scoring and real-world cost abstraction need design work.

### Hallway: client personality becomes surreal
- Intended eventual direction: the hallway is the place that expresses the client's personality; keep the infrastructure layout familiar across clients.
- Return visits feel eerie, silly, and surreal. No explanation is settled for whether this is literal, distorted reality, or the player's perception.
- Hospital: the hallway is full of zombies instead of ordinary users. They stop the player and say “brains,” or make a guttural sound. They do not bite. Familiar interruptions can carry the joke without introducing combat.
- Dentist: loose visual possibilities include teeth, a walking tooth, and smiles. Needs thought; no chosen cast or mechanic yet.
- TO DO, parked: daycare with babies saying “goo goo ga ga.” Do not develop this yet.
- Keep the surreal atmosphere compatible with understandable technical cause and effect. Decide later how audio, dialogue, and visual themes vary.

### AI branch: parked pending the core campaign
- Earlier possibility: the AI left in control resists losing its cloud workloads. Repurpose the familiar FinOps scan as an intrusion scan; the player is the intruder.
- The AI could detect the player and obstruct the cloud-to-on-prem migration, trying to preserve its control. Exact sabotage, counterplay, and consequences are undecided.
- Candidate boundary: successfully isolated on-prem services escape its control, providing lasting progress. Explain any sabotage through actual remaining connections rather than arbitrary reach.
- Latest instruction: set the AI conflict aside while developing the more realistic assessment/placement campaign. Whether the original AI remains, was unplugged, or copied itself is unresolved; duplication is a possible trope, not established lore.
- Non-AI opposition is also parked. Do not require an antagonist for the core assessment loop to work.

### Next thinking, not implementation tasks
- [ ] Define the second career's finish condition across cloud, on-prem, and hybrid outcomes.
- [ ] Find the smallest distinct discovery/visibility and placement loop worth prototyping.
- [ ] Decide what carries over from the first career and how the return is unlocked.
- [ ] Reconcile client mandates with player discretion and evidence-based persuasion.
- [ ] Explore hospital and dentist hallway treatments; keep daycare parked.
- [ ] Revisit the AI and non-AI variants once the underlying campaign works.

Earlier suggestions such as remembered resignation text, a helper AI fighting another AI, and specific boot-screen messages remain optional brainstorms, not requirements.
