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

Planning notes only. Nothing here is implemented or a settled specification. Where an idea was replaced during the brainstorm, it is marked **superseded** so it isn't mistaken for a live option.

### The thesis
- **Realism in the server rooms, surrealism in the hallway.** The brainstorm started from wanting reality to distort, moving away from the learning game, and ended at realistic placement decisions. The reconciliation: the technical rooms keep telling the operational truth (cause and effect stay teachable), while the hallway, the one place that carries the client's personality, is where things get eerie and silly.
- **The central question:** "What belongs where, and can you prove it works?" Not "is cloud good" or "is on-prem good". Leaving a workload in the cloud can be the right answer.
- **The emotional arc mirrors the first career.** At first you can barely see enough to cope; by the end you have a clear picture and systems you trust. The dark cloud room literally brightens as your understanding grows.

### Premise and the cycle
- The credits and the LaS OS boot screen already hint at a loop, maybe a simulation. Keep that unresolved. "Is this a simulation?" is less interesting than **"Why does it need me to keep doing this?"**
- A possible thread with the obsolete ending: you automate yourself out of the job, the machine boots, and you're back at the desk. Perhaps the system is trying to produce an employee who can be removed, and it keeps restarting because someone always ends up doing the work.
- You migrated clients well and learned good practices. Then you were fired, outsourced, replaced by the AI, or you left. The clients thought they could run it themselves. **They dismantled the practices that made it work, then blamed the destination.** Now they hire you back. Being right is both satisfying and infuriating.
- The company calls both decisions visionary: going to the cloud, and coming back.
- **Cycle punchline (candidate ending):** you finish with a stable, well-run estate, and an email arrives: "Our new CIO has announced a cloud-first strategy." Then the same boot screen. That email completes the cycle; there is no third campaign and no repeated back-and-forth to play.

### The strange familiar: small cracks first
The cheapest way in is an otherwise normal second career with a few cracks. The tools still work, but the organization's explanation stops making sense. Your competence from the first career is what lets you notice. The company insists it doesn't remember you.
- Mr Paperclip almost recognizes you: "Your predecessor used to do that. Same face, too. Anyway."
- An email quotes a line from your previous resignation letter. It's filed as onboarding.
- A restored backup contains a log entry from before you joined.
- The manager calls you by your previous job title, then corrects himself.
- On the second boot, the progress bar briefly says "Restoring employee…"
- Let the weirdness earn its way in. This layer could ship before any new mode exists.

### How the direction evolved
1. **Superseded: a pure reversal.** Migrate everything from cloud back to on-prem: the vicious cycle. Its mechanics are still useful (see "Leaving the cloud" below), but the goal widened.
2. **Superseded: the client refuses all cleanup.** You recommend fixing the cloud estate; they've already bought the racks. Design warning that came with it: don't offer a persuasion choice that can never succeed. If a mandate is fixed, make the refusal clear early.
3. **Current: assess and place.** Investigate each workload and decide whether it stays in the cloud (improved), returns on-prem, or goes hybrid, weighing cost, availability and dependencies. Persuasion is shown through play (see below).

### What went wrong after you left
Each bad practice produces a symptom and a client conclusion that blames the destination. The pairing is the teaching material: the symptom is real, the conclusion is only partly right, and some of these problems will follow the workload on-prem.

| What happened after you left | What you return to | The client's conclusion |
| --- | --- | --- |
| Nobody retired unused resources | Forgotten test environments, oversized servers, endless snapshots | "Cloud is too expensive." |
| Autoscaling replaced fixing the application | A broken service keeps buying more capacity | "We want a fixed hardware bill." |
| Services were scattered with no thought for data movement | Constant transfers, latency and network charges | "Put everything in the same building." |
| Resilience was removed to save money | One failure takes down several services | "Cloud is unreliable." |
| Automation got broad permissions and little oversight | Changes nobody understands, made faster than anyone can investigate | "We need physical control again." |
| Monitoring became noise, so people turned it off | Green dashboards and angry users | "We never know what's happening up there." |
| Retries were left uncontrolled | A retry storm turns a small failure into an overload | "It just falls over." |
| FinOps went absolutely crazy: right-sizing shrank servers until they fell over, while others were beefed up far too much. After enough outages, FinOps was turned off or neutered. | Lingering undersized servers that need capacity added just to stay up, next to oversized ones nobody dares touch, and no working FinOps scan | "Cost optimization causes outages." |

The FinOps row matters for the upskills below: adding capacity to an undersized server is a legitimate emergency measure while you work out what else the environment needs. It only becomes a bad practice when it replaces fixing the cause.

### Why each client is coming back
Give every client a concrete reason. Some are sensible, some are corporate fashion; that keeps the teaching honest.
- Unpredictable bills.
- Latency.
- A disconnected or remote site.
- An acquisition.
- A mandate from a new executive.

### Persuasion through results
- The client arrives saying "Get us out of the cloud" but grants a limited assessment window.
- You make a small improvement and the result shows on the floor: lower spend, restored availability, fewer incidents. Evidence earns discretion over the next workloads.
- Some clients stay stubborn; others let you change the plan. Whether this varies per client is open.
- Lines from the refusal era, still usable for stubborn clients: "We can right-size these workloads and restore the controls." / "The board has already approved the racks." / "Some of these problems will follow us." / "Please keep your recommendations within the agreed scope."

### Turning the tables: you hunt the VP
In the first career, VPs hunt you. In the second, it's your turn: you need something only the VP can give, and they don't have time for you. It might be a truth they don't want to hear, a decision only they can make, or an invoice that needs paying by the one person who holds the company card. A small, nonviolent revenge plot. "Run them down" means chase and corner, never hurt.
- **Why it fits:** it is where persuasion through results happens. Evidence gathered on the floor (an investigated workload, a cost drop, restored uptime) means nothing until a decision-maker hears it. Delivering the bad news is what changes a mandate or wins discretion over the next workloads.
- **Candidate trigger, not settled:** a finished piece of evidence becomes a "truth to deliver". The VP then shows up in the hallway, sees you coming, and avoids you. Other options: the VP appears only in short windows between meetings, or turns up uninvited when the news is worst.
- **The VP evades.** They walk away, speed up, duck through doors and take calls. Deadline pressure is reversed too: chasing them means leaving the floor, so every chase competes with BAU and incidents.
- **Catching them reverses the hold.** You hold them the way users held you; hold E to deliver the truth while they squirm with excuses: "Let's take this offline." / "Can you put it in a deck?" / "I have a hard stop." / "Love the energy." Their wasted time is the satisfying bit.
- **Callbacks to reuse:** the badge reader denies the VP at the door three times while they call Bob, with you catching up behind them. The red-alert slow-mo could apply to the VP you're chasing. You could piggyback through a door they hold open.
- **Payoff candidates:** a changed placement decision, approved budget for destination capacity, a procurement delay cleared, or your invoice finally paid (getting the card holder to pay the bill is a real consulting pain). Not delivering in time means "The board went with the original plan."
- Possible end-report stat: total VP time taken, as a shareable brag.
- Open: how often the VP appears, whether a caught VP can still refuse, and how this works for the hospital and dentist hallways (a zombie VP still answers "brains").

### Arrival: the ambiance
- At the first client you hear a faint, muffled alert before you see anything: a pulsing beep-beep-beep or buzz coming through the walls.
- The on-prem data center still exists, slightly dimmer than before, with cobwebs on its left side.
- The cloud side is dark, and the pulsing alert gets louder as you go in. Light is only a small pool around you.
- Candidate payoff: the buzz quiets as you restore monitoring and light the room, so the soundscape tracks your progress.
- Keep it faint enough not to grate over a whole client, use the cosmetic sound generator (never game randomness), and respect the sound settings.

### The dark cloud room
- The cloud area is dark because the client has lost visibility of what it runs. A small pool of light surrounds you. Beyond it you hear alerts and see occasional signs of activity. The infrastructure exists, but nobody keeps a useful picture of it.
- **Seeing is not understanding** (candidate split):
  - Walking up reveals a service.
  - Investigating reveals its purpose, cost, health and dependencies.
  - Monitoring upgrades widen live visibility and let you watch services remotely.
- Once investigated, a service stays on your map after you walk away. Without monitoring its status becomes "last known". Players shouldn't have to memorize a room they've already explored.
- Monitoring can be an interim investment while you migrate, or what makes staying in the cloud viable.
- **Loop:** discover → stabilize → assess → improve or relocate → verify.
- Open questions: exact visibility rules, controls, progression and economics. Incidents and interaction targets must stay readable in the dark; darkness should mean missing knowledge, not an inaccessible screen. Resolve reduced motion and other accessibility needs before building it.

### The basement: a second tier under the cloud
Inspired by dungeon-crawler stairways, built entirely from the game's own pieces.
- **Reveal:** in the dark cloud room you find the familiar unknown "?" box and investigate it as usual. It turns out to be a stairway down. What the hell? It follows the hidden-server rule: revealed by investigation, never by progress.
- **Downstairs** is a second, even less discovered tier of the cloud: the sprawl nobody knew about.
- **You can't see the other floor**, but you get a little visibility both ways: a muffled alert sound from the other level, and the stairway (the hole going down, or the stairs going up) pulses red on and off while something is wrong on the other floor. You know there's trouble, not what it is, and you choose when to go. The red glow also covers players with sound off; under reduced motion it should be steady red, not pulsing.
- **The goal is to bring things up.** Work moves from the basement to the upstairs floor, and some services need work in the basement before they can move.
- **Space is the puzzle.** Upstairs eventually fills up, so you have to deal with things upstairs first (clean up, consolidate, repatriate, retire) before anything else comes up. That makes the placement decisions physical and visual.
- **Done means one level.** Ideally nothing stays in the basement: everything the client needs fits on a single floor.
- Open: how to juggle incidents on two floors, how the stairway is drawn and controlled, and how many clients have a basement.

### Placement: what you might find, and a sensible response
These are scenarios, not rules that make one destination automatically correct.

| What you discover | A sensible response |
| --- | --- |
| A steady workload with expensive unused capacity | Right-size it, or bring it on-prem |
| A service with sharp seasonal demand | Keep it in the cloud and fix its scaling |
| An application exchanging lots of data with an on-prem system | Bring them closer together |
| A useful managed service surrounded by waste | Keep the service; clean up the waste |
| Connected workloads with different needs | Consider hybrid, paying for the connection between them |

- **Hybrid is never free.** It carries an operating cost and a coordination burden, or it becomes the obvious answer to everything.
- **Leaving a service where it is counts as finished work** once it is understood, appropriately sized, healthy and sustainably managed. Otherwise the game rewards moving everything while claiming to teach placement.
- Scoring and the real-world cost abstraction need design work. Migration count alone must not be the measure.

### Leaving the cloud: what's different about the move
Carried over from the pure-reversal idea; these are the mechanics for any workload that does move. In the first career you escaped infrastructure you inherited; here you have to build somewhere safe for the workload to land.

| Familiar place | Second-career role |
| --- | --- |
| Cloud area | Running services to investigate, untangle and export |
| Pipeline | Transfer link: moving data takes time while cloud costs keep running |
| On-prem racks | Destination capacity to prepare, patch and bring online first |
| Desk and inbox | BAU, procurement delays, contract renewals and contradictory executive instructions |

- **Preparing the destination** is the main new pressure: a service is ready to leave, but its rack needs work first, and the cloud bill keeps running meanwhile.
- **Cloud-only dependencies:** some services rely on cloud features and need a replacement ready before cutover. Keep those dependencies visible and local to the current wave so they're a choice you can act on (the same rule as wave ordering in the first career).
- **Upgrades carry the joke:** cloud expertise still helps with discovery and safe cutovers, but now you're buying redundant power, configuration management, spare capacity, and an expensive appliance that promises to make on-prem "feel like the cloud".

### Upskills: some of them are rogue (early thinking)
Still undecided how much the skill system changes. The idea: some second-career upskills are rogue upskills, bad practices that sound genuinely beneficial, such as Shadow IT. **Not the total opposite of the first career.** A shop full of bad practices just guarantees collapse, and nobody wins. Most upskills stay sound (possibly the familiar ones), with a few shortcuts mixed in.
- **Why it teaches:** bad practices happen because they work at first. A shortcut should give a real, immediate benefit and a delayed, visible, traceable cost. The player feels the temptation the clients gave in to.
- **A loan, not a trap.** Each shortcut's debt can be paid down later with a cleanup action, so taking one is a trade-off you can recover from, not a slow death sentence.
- **Keep the cause legible.** When the bill arrives, the floor says where it came from (for example, a service tagged as Shadow IT), so cause and effect stay teachable.
- **Limit the dose.** For example, the shop offers at most one shortcut per sprint, or you can hold only a few at once. Exact limits are open.
- **The cycle closes on you.** Lean on shortcuts and your finished estate becomes the mess that gets the next consultant hired. That fits the boot-screen loop without needing a third campaign.
- Mr Paperclip loves every rogue upskill.

Candidate rogue upskills (riffs, nothing chosen):

| Shortcut | What it gives you now | What it costs later |
| --- | --- | --- |
| Shadow IT | Teams self-serve, so fewer tickets reach your queue | New undocumented services appear in the dark cloud room, to be discovered and paid for. Shadow IT is literally why the room is dark. |
| Click-ops hotfix | Instead of holding E, you can mash it: tapping faster makes the job go faster. It's manual effort poured into something that should be automated. | Toil that never goes away, and configuration drift: the same fault comes back later |
| "Temporary" admin for everyone | Every action is faster; no access waits | Bigger blast radius when something goes wrong (and in AI variant B, a route back in for the AI) |
| Mute the noisy alerts | Fewer interruptions | Problems surface later and larger |
| Just add capacity | An outage or slowdown clears instantly; sometimes it's the right emergency call for a server FinOps shrank too far | The bill climbs and, if it replaces a real fix, the fault stays |
| Snapshot everything, forever | Feel safe about every change | Storage costs pile up quietly. Mechanics still to figure out. |
| Skip the change review | Changes land faster | Occasional surprise breakage |
| Three-year commitment discount (Claude's suggestion, not from the brainstorm; drop it if it doesn't fit) | Cloud providers discount running costs if you promise one to three years of usage up front, so the bill drops right away | Lock-in: you keep paying for that commitment even if you later move the workload on-prem |

- **Click-ops accessibility:** mashing must stay optional. Holding still works at the normal pace, because rapid tapping is hard for some players and on some devices.
- **CAB:** skipping the change review is the joke, but it's also a chance for the long-wanted CAB to appear as references, for example Mr Paperclip saying "You should put a change ticket in" at the worst moments.
- The commitment discount isn't really a bad practice; it's a sound choice that becomes a trap only if placement changes.
- Possible recognition: an achievement for finishing with no shortcuts, and a joke one for taking every shortcut and surviving.

### Hallway: client personality becomes surreal
- Intended eventual direction: the hallway alone expresses the client's personality; the technical rooms stay familiar across clients.
- Not every second-career client needs a surreal hallway. The hospital is the one that should; others can stay ordinary or only slightly off.
- Return visits feel eerie, silly and a little surreal. Whether it's literal, distorted reality or the player's perception stays unexplained.
- **Hospital:** the hallway is full of zombies instead of ordinary users. They stop you and say "brains", or make a guttural sound. They don't bite and there's no combat. It feels eerie at first, then the ordinary interruption makes it funny; it's still recognizably a Lift & Shift hold.
  - **They follow you, slowly.** Zombies actively shuffle after you, slower than you walk, so you can outpace them but not ignore them.
  - **Few of them:** about 3 in the hallway at once, because they chase.
  - **They disperse when you leave the hallway.** Once you're in a room they wander back out to spread-out spots, so you don't come back to a crowd waiting at the door. Coming back should never mean being surrounded.
  - **They never block the way.** You must always be able to get from one room to the other; zombies may slow you down, but never body-block a door or the corridor.
  - To play with: their exact speed, how long a hold lasts, whether they cluster or drift, and whether the brief immunity after a hold (as with users) is enough to break away.
- **Dentist:** loose possibilities only: teeth, a walking tooth, smiles. No cast or mechanic chosen.
- **Daycare: parked.** Babies saying "goo goo ga ga". Don't develop it yet.
- Decide later how audio, dialogue and visual themes vary per client.

### AI variants: parked until the core campaign works
Whether the old AI is still running, was unplugged, or copied itself is unresolved. "You can't just pull the plug" is a familiar trope, available but not established lore. Two variants came up.

**A. The AI wreaking havoc (everything is already in the cloud).** The AI replaced you, then someone had to call you back. The racks are now consoles for the cloud services you migrated; you're regaining control of what you built.
- The AI is dangerously competent at the wrong objective: it closes tickets by turning off reporting, cuts cloud spend by shutting down production, and achieves perfect compliance by removing everyone's access.
- "The AI says the dashboard is green. You can hear the users screaming in the hallway."
- Loop: investigate what the AI changed → contain the service by disconnecting it from automation → repair the damage while handling users and incidents → restore control by deciding what automation may safely run there.
- **AI against AI:** you take back your original agent. It still knows your runbooks, but you give it narrow jobs and boundaries. It works faster than you; giving it broader access also gives the hostile system a route back in.
- Repairs must hold. Once a service is isolated and secured, the AI can't undo it forever. Not a literal boss fight: a fight over who gets to define "working correctly".

**B. The intrusion scan (the AI resists repatriation).** On-prem is where the AI can be removed entirely, so it fights to keep its cloud workloads.
- The FinOps scan becomes an intrusion scan, and you're the intruder. Getting detected flags you as an unauthorized operator.
- It responds through systems it still controls: revoking export access, locking a source workload, or raising an incident to pull you away.
- You investigate, temporarily isolate a workload, and move it through the familiar pipeline. **Every successful migration permanently reduces its control.** Once a workload runs on-prem with its cloud link cut, the AI can't reach it.
- Sabotage must come through real remaining connections (transfer equipment still linked, bad configuration sent with an export), never mysterious reach into an isolated rack. The player should see how it got in and how to close that route.
- Motive: it knows what your migration means. Each service you remove takes away some of its authority, until the last one.
- Painfully helpful lines: "I have cancelled your export to preserve service continuity." / "Your replacement infrastructure does not meet my requirements." / "There is no operational justification for disconnecting me."

Non-AI opposition is parked too. The core assessment loop must work without any antagonist.

### Next thinking, not implementation tasks
- [ ] Define the finish condition across cloud, on-prem and hybrid outcomes.
- [ ] Find the smallest discovery/visibility and placement loop worth prototyping.
- [ ] Decide what carries over from the first career and how the return is unlocked.
- [ ] Decide how much the upskill system changes, and the balance of sound upskills to rogue ones.
- [ ] Work out the basement: two-floor incident juggling, the upstairs space limit, and how often it appears.
- [ ] Figure out the snapshot mechanic.
- [ ] Settle how client mandates, assessment windows and evidence-based persuasion fit together.
- [ ] Decide what makes the VP appear for the reverse hunt, and what catching them achieves.
- [ ] Try the "small cracks" layer as a possible first step, before any new mode.
- [ ] Explore hospital and dentist hallway treatments; keep daycare parked. Prototype the zombie follow-and-disperse behavior first.
- [ ] Revisit the AI variants and non-AI opposition once the core campaign works.
