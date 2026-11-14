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

## MoSCoW sort (13 November 2026)
Matt sorted every idea in this roadmap and the Day 2 notes on a MoSCoW board ([private board](https://claude.ai/artifact/HhPwZ8SkKqsqBsSzrc3uDU)). This is a priority snapshot, not a commitment; the sections below keep the detail.

**Must have (8)**
- Day 2: character progression (no one → the temp → the manager → the VP → the AI)
- Day 2: finale, nobody is the superhero (the cast contains the AI together)
- Day 2: turning the tables, you hunt the VP
- Day 2: guardrail collection as the spine
- Day 2: a guardrail family per character (temp access, manager change, VP budgets, you pass it on)
- Day 2: Learn more links per guardrail to its real framework
- Day 2: final client, the AI gone rampant, contained with guardrails
- **New:** there were possibly a few employees before you who never did anything to take it to Day 2

**Should have (13)**
- Day 2: the heroics trap; strange familiar, small cracks; persuasion through results; the tutorial's Day 0 wink
- Basement: the reveal; breaking the temp's bonds; don't be the department of no
- Guardrails and skills: résumé point budget; transfer code from Day 1; CAB jokes via Mr Paperclip
- AI boss: hallucinations you can see
- Back pocket: platform engineering
- **New:** a nod to the "it's always DNS" trope

**Could have (42)**
- Day 2: carnage report opening; the previous employee was you; "six months later" check; the VP in a new guise each client
- Basement: darkness that brightens; the temp's ticket, server rhythm; unplugging the ticket system; Mr Paperclip's rulebook; Papers, Please checkpoint; scream test; tracing the wires; done means one floor; two bars (answered vs prevented)
- Guardrails and skills: your own Day 1 client returns; Day 1 upskills badly implemented; rogue upskills as shortcuts
- Clients and places: the sandbox beach; digging in the sand; leaving the cloud; placement decisions; hospital zombies; honeypot for the AI; your old agent as a narrow ally; the intrusion scan hunts you
- Back pocket: the same fire every day; the help desk reset call; the auditor; onboarding; secrets in the wiki; the mystery cron job; vendor licence audit; region outage; feature flags and canaries; "it's always DNS" and the firewall
- Day 1 game: saved sessions; Chaos Monkey; daily client; CAB gate on client 3; two-player co-op; better playtest bot; late-game tension; dedicated game servers (moved up from "Probably not")

**Won't have, this time (26)**
- Day 2: cloud-first email ending; losing softly in a meeting; Day 3; a Day 0 card after the ending
- Basement: firefighter → police gear
- Clients and places: dentist and daycare hallways
- Back pocket: Schrödinger's backup; certificate expiry; watermelon metrics; shadow AI; bus factor; alert fatigue; MFA fatigue; end-of-life software; SaaS sprawl; data retention; software supply chain; sustainability
- Day 1 game: résumé lies and permanent unlocks; achievements as bad performance reviews; more odd clients; vendor swag loot crates; "days since last incident" streak; daily login rewards; paid loot boxes

**What the sort says:** the Musts are all Day 2's skeleton: the cast, the guardrails and the AI finale. Most of the basement prototype's mechanics landed in Could, so the basement is a candidate first stage rather than the spine. The cloud-first loop ending is out, which leaves the ending to the team-up.

## Day 2, the second career: return, reassess, and the strange familiar (brainstorm, 11 November 2026)

Planning notes only. Nothing here is implemented or a settled specification. Where an idea was replaced during the brainstorm, it is marked **superseded** so it isn't mistaken for a live option.

These are the raw notes. [docs/second-career.md](docs/second-career.md) is the story bible that organizes them: controlling idea, cast, client grid, setups and payoffs, and decision log.

### Naming: Day 1 and Day 2 (decided, 13 November 2026)
- **The first career is "Day 1"; the second career is "Day 2".** These notes still say "first career" and "second career" in older sections; read them as Day 1 and Day 2.
- **Why it works:** it's real jargon (Day 1 is build and deploy; Day 2 is operate) that IT people recognize instantly, and newcomers learn something true from the title. It says what changed between the two, and "Lift & Shift: Day 2" reads as the morning after the launch party. The main menu can show them side by side, a gentle nudge to play in order without a lock.
- **The core contrast:**
  - **Day 1 is the project.** You react, doing what you must to keep the servers from burning, and above all you migrate to the cloud, your primary objective. You win by finishing. Then the project ends and you leave.
  - **Day 2 is operations.** You create processes so things can be maintained long term, not just for a project or a season. You win by building something that keeps working when you leave.
  - It explains why Day 2 exists: every client rotted *because* Day 1 was a project. The project team rolled off, nobody owned the "run" part, and the practices decayed. **Projects end; operations don't.**
- **We got roped in on Day 1.** Day 0 (design and planning) never existed in our lifetime: the decision was made in a meeting you weren't invited to, and you show up on Day 1 to a deadline, a full ticket queue and servers already on fire. Day 2 starts the same way: you're called back after the client already decided what went wrong. Day 0 is where the VP lives, a quiet reason he has to own a number in Day 2. Flavor, not a mechanic; a candidate line for Day 2's opening: *"Day 0 happened in a meeting you weren't invited to."*
- **The tutorial gets a Day 0 wink.** It's still called "Tutorials" in the menu, but Day 0 slips in once you're inside: the one day where someone explains things, nothing burns unless it's staged, and every cutover succeeds. Planned touches (a small change to the real game, its own branch and pull request):
  - The tutorial's client card reads *Paperclip Supply Co. · Day 0*.
  - The finish screen: *"That was Day 0. Tomorrow is Day 1, and nobody will explain anything."*
  - Optional: the senior paperclip's first line, *"Welcome to Day 0. It's the day someone explains things to you. Enjoy it, it doesn't happen again."*
  - Check `tests/e2e/` scenes and AGENTS.md/README tutorial wording when it's built.
- **Considered and dropped:** a "Day 3" (end of life and retirement) and a "Day 0" title card after the ending. Too much. The skipped-retirement idea survives without a name in the basement, the sandbox beach and "sandboxes with expiry".

**What Day 2 framing changes in play (riffs):**
- **Win by what keeps working without you.** Day 1 scores migrations; Day 2 should score whether the temp can run the rulebook alone, whether the manager's change windows held, whether the VP's budget stayed under its cap.
- **"Six months later."** At the end of each client, skip time and show the floor without you in it. Good processes held: the temp stamps, junk bounces, the bill is flat. Weak ones rotted: boxes creep back, the dashboard is muted again. It's "what went wrong after you left" made playable inside each client, and a stronger ending than prototype 3's "tomorrow's cleanup".
- **The heroics trap.** If you personally firefight everything, the client looks great while you're there and collapses after the time skip. Being indispensable is the failure mode. It ties to "No one fixes it alone" and to the cycle's question, "Why does it need me to keep doing this?": because you never built the process.
- **The boss.** An AI with no Day 2 processes is a project that never ends; the guardrails are what turn it into something you can operate.

### Why Day 1 ended that way: the contract said "migrate" (13 November 2026)
**Matt's framing:** on Day 1 you work for a consulting company. The contract was the migration, nothing more. You kept the on-prem servers from catching fire during the migration, and when it was done, poof, you were gone to the next client. Things could be flashing red and leaking on the cloud side; that wasn't what you were hired for. The client didn't think to put "how do we sustain this" in the contract either, so it's partly their own mistake. By the time you're out, most end screens should have some red flashing servers on the cloud side.

- **The game already supports it.** A developing leak or warning doesn't block finishing a client; only an outage or active breach does. You can already walk out with the cloud side flashing.
- **Real-world terms:**
  - **Statement of work (SOW):** said "migrate", not "run".
  - **No hypercare:** the weeks of post-go-live support that's often in the contract, or cut to save money.
  - **No handover to operations:** no knowledge transfer, runbooks, training or named owner.
  - **Build vs. run:** the project team builds; someone else is supposed to run it, and nobody hired them.
  - **Shared fault:** the consultants delivered exactly what was in scope; the client never bought sustainment.
- **What it gives Day 2:**
  - **"The employees before you" are the consultants before you.** Several firms each did their Day 1 and left. A stack of old SOWs in a drawer: each says "migrate", none says "run".
  - **The contract is the frame.** Day 2's engagement is different: the client learned (or got burned) and wrote in "and make it sustainable without us". That's the win condition, and the "six months later" check is the contract's acceptance test.
  - **Day 1's exit gets a sting.** The end-of-client review could show the red flashing cloud servers as you walk out, stamped *out of scope*, a callback to the existing "Not my problem" screen. (Day 1 change; its own branch if wanted.)
  - **Mr Paperclip lines:** "That's a change request." / "Hypercare: 0 days." / "Per the SOW, this fire is a them problem."
  - **Theme:** on Day 1 they pay you to finish; on Day 2 they pay you to make yourself unnecessary.

### The thesis
- **Realism in the server rooms, surrealism in the hallway.** The brainstorm started from wanting reality to distort, moving away from the learning game, and ended at realistic placement decisions. The reconciliation: the technical rooms keep telling the operational truth (cause and effect stay teachable), while the hallway, the one place that carries the client's personality, is where things get eerie and silly.
- **Every client is a different experience.** Unlike the first career, second-career clients don't need to be consistent. Each one starts on the familiar map and then hides its own surprise off it: a stairway down, a hole in the wall. Some clients are long and detailed, some are quick mini-games, and they don't all have to be about maintaining a data center. Straying from the original theme is the point of a second run. The teaching still holds inside each one: cause and effect stay understandable, however strange the place.
- **The central question:** "What belongs where, and can you prove it works?" Not "is cloud good" or "is on-prem good". Leaving a workload in the cloud can be the right answer.
- **The emotional arc mirrors the first career.** At first you can barely see enough to cope; by the end you have a clear picture and systems you trust. The dark basement literally brightens as your understanding grows.

### Premise and the cycle
- The credits and the LaS OS boot screen already hint at a loop, maybe a simulation. Keep that unresolved. "Is this a simulation?" is less interesting than **"Why does it need me to keep doing this?"**
- A possible thread with the obsolete ending: you automate yourself out of the job, the machine boots, and you're back at the desk. Perhaps the system is trying to produce an employee who can be removed, and it keeps restarting because someone always ends up doing the work.
- You migrated clients well and learned good practices. Then you were fired, outsourced, replaced by the AI, or you left. The clients thought they could run it themselves. **They dismantled the practices that made it work, then blamed the destination.** Now they hire you back. Being right is both satisfying and infuriating.
- The company calls both decisions visionary: going to the cloud, and coming back.
- **Cycle punchline (candidate ending):** you finish with a stable, well-run estate, and an email arrives: "Our new CIO has announced a cloud-first strategy." Then the same boot screen. That email completes the cycle; there is no third campaign and no repeated back-and-forth to play.

### Opening: the carnage report and Mr Paperclip
- **Before client one,** you're handed the carnage report of the previous employee, the one who just quit the company (the resignation exit interview's carnage report, reused).
- **It's broken.** The report's improvement shop is there, but every option is disabled. There are 2 sprint points available, and the only thing you can pick is Mr Paperclip (his normal cost is 2 points). You can't leave the report until you select him.
- **So he comes with you for the whole second career,** at every client, not as an optional perk. It works for old school careers too, since he isn't AI.
- Riff: the "previous employee" could be you. If the browser has your first career's last run, the carnage report could quietly show your own numbers, which fits the cracks layer below. Keep it to numbers already stored locally.
- Open: whether his lines change for the second career (he's seen this before too), and how he reacts to each client's surprise place.

### Character progression across the second career (brainstorm)
Each stage or client is an opportunity to spend more time with one of the game's major recurring characters. The rough progression is **no one → the temp → the manager → the VP → the AI bot**, with room for additional stages or characters in between. This is a direction to explore, not a fixed client count or order.

- **First, no one.** Establish the player's return and the strange familiarity of the world without making a major character the focus.
- **Then, the temp.** The temp is still officially a temp despite having been around for a very long time. Let that contradiction become part of the interaction and the joke.
- **Then, the manager.** Give the manager a stage with more direct interaction and a chance to explore their role beyond the first career's interruptions and assistance.
- **Then, the VP.** Build toward the reverse chase and decision-maker interactions already described below.
- **Finally, the AI bot.** Make the AI the culminating character encounter, connecting to the guardrails and containment finale.
- **Possible stages between.** Other interactions or characters can bridge these steps if the pacing needs them. The important idea is an escalating series of character-focused encounters, not necessarily one character per client.

### Finale: nobody is the superhero (brainstorm)
- **Possible ending:** the major characters introduced throughout the second career come together to contain the runaway AI agent. The temp, manager, VP, player, and possibly other allies each have something necessary to contribute. No one person, bot, or upgrade is the superhero.
- **The point:** we need each other. A healthy operation comes from people with different roles cooperating, sharing responsibility, and putting checks around powerful systems. It isn't the story of one indispensable engineer saving everyone.
- Let the earlier character-focused stages **earn the team-up**. Interactions with each character establish what they understand, what they can do, and how they might help when the final crisis arrives.
- The finale should make that cooperation **playable**, not just show everyone standing together in a cutscene. Exactly who does what, and how the team overcomes old conflicts, remains open.
- The win is still **containment through guardrails**, not destruction of the AI. An AI tool with limited, accountable responsibilities can be part of the solution; the uncontrolled agent is the threat.
- Revisit the final VP appearance and abrupt ending so the collaborative victory lands. The closing joke shouldn't accidentally erase the idea that everyone mattered.

### The guardrail collection: the second career's spine (brainstorm, 13 November 2026)
**The idea:** every stage of the second career, you discover specific guardrails. You apply them to yourself and to processes, and you collect them. At the boss stage you meet the AI bot and apply the guardrails you collected to it. **If we can't put guardrails on ourselves, how will we put them on our AI bot?**
- That line is a candidate controlling idea. It turns "nobody is the superhero" from a theme into a mechanic: each guardrail comes from a person you met, so the team-up *is* the collection.
- **Discovered by living without them first.** Each client shows a family of guardrails missing (the temp rubber-stamping tickets), lets you feel the cost, then has you build the guardrail. Prototype 3's rulebook pages are literally the first guardrails collected.
- **On ourselves, not just others.** Some guardrails apply to the player. The rogue upskills (temporary admin for everyone, skipping review, click-ops) are self-inflicted gaps. Giving them up, or paying them down, is putting a guardrail on yourself. The career asks the question before the boss does: did you live by the rules you wrote?
- **Guardrails, not a kill switch.** Prototype 3's "Deny everything" trap is a kill switch, not a guardrail, and it fails. The finale makes the same point.

**Superseded draft: clients mapped to guardrail families.** Replaced by "Each guardrail family belongs to a character" below; kept for the boss-move column.

| Client | You learn to stop… | Guardrails you collect | What the AI does without them |
| --- | --- | --- | --- |
| 1. The temp's basement | Rubber-stamping every request | Owner required, budget caps, admin that expires, no root for service accounts, leavers cut off | Spins up anything it's asked, with no owner and no budget, at machine speed: the temp's loop at a million tickets a second |
| 2. Wires and dependencies | Changing what you can't see the edges of | Isolation, blast-radius limits, knowing what's connected | Reaches everything from anywhere |
| 3. The manager | Changing things on a whim | Change control, freezes, approval for risky moves, rate limits | Changes prod nonstop, faster than anyone can review |
| 4. The VP and the sandbox beach | Things nobody owns, decisions nobody signs | Sandboxes with expiry, ownership, a human sign-off | Acts with no one accountable; nothing ever expires |
| Boss: the AI | | Everything you collected | Everything above, at once |

**The boss fight (riffs):**
- The AI is every bad habit from the second career, fully automated. Each collected guardrail blocks one of its moves: it tries to spin up a GPU fleet and "no budget code, no GPU" bounces it (*bzzt*); it tries to change prod and the manager's freeze holds; it tries to act alone and the VP's signature gate stops it.
- **Every guardrail you missed is a gap it uses.** Never found "admin expires" in client 1? The AI walks through that door.
- **Your shortcuts come back.** A rogue upskill you never paid down ("temporary admin for everyone") is the AI's route back in. Your own shortcuts become its way in.
- **The cast installs them with you:** the temp knows the rulebook, the manager holds the freeze keys, and the VP has the signature.
- **Why it's true to real life:** AI-agent governance today is mostly the same controls we already use for people and automation (least privilege, spending and rate limits, approval for high-impact actions, sandboxes, audit logs, someone accountable). Organizations that can't apply them to their own staff and scripts tend to fail at applying them to an agent.

#### Each guardrail family belongs to a character (brainstorm, 13 November 2026)
The guardrails you collect are associated with **the temp, your boss (the manager), the VP (budgeting), and yourself**. At each one's stage, the player helps that person with their difficulties, using the guardrails most helpful to their role. This lines up with the four families the frameworks suggest (access, change, budgets, operations) and gives each character's client a reason to exist. It supersedes the draft client-to-family table above.

| Character | Their difficulty | Guardrail family | What you build with them | What it blocks in the boss fight |
| --- | --- | --- | --- | --- |
| **The temp** | Drowning in tickets, approving everything, owning nothing | **Access and intake** (ITGC access, CIS inventory) | Owner required, admin that expires, no root for service accounts, leavers cut off, the person asking isn't the one approving | The AI grabbing permissions and spinning up things nobody owns |
| **Your boss, the manager** | Things keep breaking; wants control but only knows how to inspect | **Change** (ITIL, ITGC change, SRE) | Change control, freezes, change windows, rate limits, approval for risky moves | The AI changing prod nonstop, faster than anyone can review |
| **The VP** | The bill: "Cut 40% by Friday", while signing nothing | **Budgets** (FinOps, OWASP Unbounded Consumption) | Budgets and quotas, cost allocation tags, a named budget owner who signs for spend | The AI's runaway consumption. His signature becomes the spending authority it can't bypass. |
| **You** | Working alone: the hero who does everything, writes nothing down and burns out | **Pass it on** (knowledge transfer, runbooks, delegation; replaces "operations: seeing and verifying") | Runbooks the temp can follow, documenting the first time, trusting people with the work, being able to leave | An AI that's the only thing that understands the system, with nothing good to amplify |

- **The VP's guardrail is budget authority**, more specific than the earlier "approval gate": he finally has to own a number. It's a better revenge plot than a signature, too: you make the VP do FinOps.
- **"Yourself" as a stage (two options, possibly both):**
  - **A: your own client.** You're sent back to a client from your *first* career, and the mess is your hasty migrations, your "temporary" admin, your muted alerts. It's the carnage report made playable, and it pays off "the previous employee was you". Nobody else to blame, so you put guardrails on yourself, right before the boss: "if you can't do it for yourself…"
  - **B: it runs through every client.** The rogue upskills are your temptation all along, and paying them down is how you collect your own family.
  - A is the stronger story beat and B the stronger mechanic. Both could work: B throughout, with A as a short final client before the AI.
- **The finale writes itself.** Each character installs their own family on the AI: the temp cuts its access, the manager freezes its changes, the VP caps its budget (the one time he's useful), and you verify what it actually did. Nobody can do it alone, because each person holds one family. Any family you didn't fully collect is the gap the AI uses.
- **Knock-on changes to the story bible:**
  - Client 2 (wires and isolation) folds into the temp's access family, or becomes the "you" stage.
  - Finale guardrails change: the temp from isolation to access and intake; the manager from scoped permissions and freezes to change; the VP from approval gate to budget authority; you stay monitoring and verification.

#### Your guardrail: pass it on (brainstorm, 13 November 2026)
**Supersedes "operations: seeing and verifying" as your family.** Logs, monitoring and tested recovery stay useful, but they belong to everyone. Your guardrail is the one only you can put on yourself.

**Your arc, from inside your head.** You work alone. It's your default. You don't rely on anybody, and anybody in your way is an inconvenience. You're the superhero, and for a while it works: you know how, you're curious, you figure things out. But it wears you out, and it isn't sustainable. Worse, it's a trap: if you never write down what you did, nobody else can do it, so you do everything, forever. People call that job security. It's a cage. And if you're gone, or the system grows too big for one person, it's too late to hand it off, because nobody has ever done what you do. You set yourself up for failure.

**What you learn on Day 2:** rely on people. Trust them to do the work, and when they're willing, empower them. Most people can't do the work without guidance: runbooks, direction, someone being there. When you do something new, track it, log it and write it down so the next person can do it. Pass knowledge on through collaboration, not by expecting people to figure it out alone. Not everyone has your drive, curiosity or experience, especially when they're new, and you have to account for that.

**The temp, seen again.** On Day 1 the temp looks useless: one question per shift, one in ten never onboarded, and he quits. From the hero's side, temps are useless. From the temp's side, he's the lowest-paid person in the building with no stake in the game. Nobody taught him anything, and you were too busy doing your own thing to help, so he got frustrated and left. *Why did he leave? I was doing this just fine.* **The temp's uselessness was partly yours.** Day 1 already sets this up; Day 2 pays it off.

**Your stage and the temp's are one client, seen from both sides.** In the basement the temp rubber-stamps every ticket because nobody ever gave him rules. Mr Paperclip's rulebook is a **runbook**: what you write down so someone else can do the work. Freeing the temp *is* your guardrail. You write it down, hand it over and trust him.

**Mechanic sketches (open):**
- **First time, write it down.** Solve a new kind of problem and you can stop to document it, which costs time. Then the temp can handle that kind. Skip it, and only you ever can.
- **The hero drain.** Doing everything yourself works, and it's faster at first, but you wear down (Day 1's energy). The temp, ignored, gets frustrated and quits, as in Day 1.
- **Guidance, not assumptions.** Left alone, the temp stalls; pointed at a runbook and checked in on, he grows. His competence is what you invested in him.
- **The test is that you can leave.** On Day 1 you left by running to the next client. On Day 2 you win by taking a vacation and nothing breaks: the beach, for you this time. The "six months later" check made personal.
- **Mr Paperclip, useful for once:** "You could fix it again. Or you could write it down and never fix it again."

**Why it matters for the AI.** Day 1's AI Agent amplifies existing practices, and Runbooks is literally one of its foundations. A hero who never wrote anything down leaves the AI nothing good to amplify. What you share with the temp is what makes the AI safe: your guardrail on yourself becomes the AI's guardrail. In the finale, the team can contain the AI because you're no longer the only one who knows how.

**Real-world names:** bus factor, knowledge transfer, runbooks and documentation, delegation, mentoring and onboarding, toil limits, sustainable on-call; "hero culture" as the anti-pattern.

#### Carrying first-career skills into the second career (brainstorm, 13 November 2026)
The second career should carry over your skills from the first. It should also be playable without the first: for players who did the first career long ago and lost their progress, or never played it. Don't make that obvious, so players are still encouraged to play the first career first.
- **The carnage report is the doorway.** The prologue already opens on the previous employee's carnage report, where Mr Paperclip is the only thing you can pick. It does double duty:
  - **A first-career record on this device:** the report quietly shows *your* numbers and *your* toolkit, and your upskills carry over. "The previous employee was you" lands for real.
  - **No record, or it's gone:** the report belongs to a stranger, and you write a **résumé** instead. "List your relevant experience", with a point budget: pick a good chunk of first-career skills. Satire for free: everyone's résumé claims Terraform. Mr Paperclip: "Policy as Code. Sure. I also have 'Policy as Code' on mine."
  - Mr Paperclip is forced on you either way, so the prologue's joke survives both versions.
- **Fair both ways:**
  - The résumé's budget should match what a solid first career ends with, so fresh players aren't underpowered and veterans aren't overpowered. Use the balance bot to find a typical end-of-career toolkit instead of guessing a number.
  - Veterans get meaning, not power: their own numbers on the report, their own avatar and chosen tools, maybe a carried-over choice a résumé can't fake (Job Hopper, fired the manager, old school).
- **A gentle nudge toward the first career, not a lock.** The second career's button sits below the first; the résumé path is labelled something like "I've done this before". Mr Paperclip: "No record of you here. Did you even work here?"
- **Don't lose progress again:**
  - **A transfer code** at the end of the first career, built like the share report codes (numbers and fixed choices only, never free text, so it follows the existing rule). Pasting it into the résumé screen restores your loadout.
  - **Old school careers** carry their no-AI flag, so the boss stage can account for a player who never owned an AI agent.
- **How it meets the broken-upskills idea:** your skills (carried or claimed) are what *you* know how to use and fix, and the client's broken versions appear regardless. Knowing a skill might make fixing the client's broken version faster, or unlock a fix at all. Your first-career toolkit then matters at every client without the second career requiring it.
- **Open:**
  - What exactly carries over: upskill levels, perks, the manager?
  - Is a skill you bring the same object as the client's broken version, or are they two different things?

#### Established guardrails to glean from
The established frameworks keep landing on the same small set of ideas.

**General IT and security**
- **CIS Critical Security Controls (v8):** 18 prioritized controls. The first two are inventory of hardware and inventory of software: the Shadow IT basement is literally Controls 1 and 2. Others: account management, access control, audit logs, data recovery, incident response.
- **NIST Cybersecurity Framework 2.0:** Govern, Identify, Protect, Detect, Respond, Recover. Version 2.0 added *Govern*, which is the "policing" layer.
- **IT General Controls (ITGC):** what auditors check for SOX and similar, in three areas: **access** (who can do what), **change** (how things change, with approval) and **operations** (backups, monitoring, job runs). Compact and game-friendly.
- **ISO/IEC 27001:** the international standard behind most corporate security policies, with a catalog of 93 controls.
- **Zero Trust (NIST SP 800-207):** never trust by default, verify every request, least privilege, limit blast radius.

**Operations and cost**
- **ITIL 4:** change enablement, service request management and incident management: the temp's ticket world.
- **Google's SRE practices:** error budgets, toil limits, blameless postmortems, rate limiting.
- **Cloud Well-Architected frameworks:** pillars such as security, reliability, cost optimization and operational excellence.
- **The FinOps Framework:** budgets, cost allocation tags, showback and chargeback.

**AI-specific, for the boss stage**
- **OWASP Top 10 for LLM Applications.** Two entries describe the rampant AI almost word for word:
  - **Excessive Agency:** too many permissions, too much functionality, too little oversight. Mitigations: minimize permissions and tools, human approval for high-impact actions, rate limits.
  - **Unbounded Consumption:** runaway cost and resource use. Mitigation: budget and rate caps.
- **NIST AI Risk Management Framework:** Govern, Map, Measure, Manage.
- **ISO/IEC 42001:** the management-system standard for AI.
- **The EU AI Act:** its human-oversight requirement is the VP's signature gate.

The AI mitigations are the same controls as for people, which supports the thesis directly.

**The common set, mapped to the game:**

| Guardrail | Where it comes from | Second-career client | What it stops the AI doing |
| --- | --- | --- | --- |
| Inventory and ownership | CIS 1–2, NIST Identify | 1, the basement | Creating things nobody knows about |
| Least privilege and expiring access | CIS 5–6, ITGC access, Zero Trust | 1, admin expires | Using permissions it shouldn't have |
| Budgets and quotas | FinOps, OWASP Unbounded Consumption | 1, no budget code, no GPU | Running up the bill |
| Separation of duties (four eyes): whoever asks isn't whoever approves | ITGC, SOX | 1, the temp stops self-approving | Approving its own actions |
| Isolation and blast radius | Zero Trust, CIS 12 | 2, wires | Reaching everything from anywhere |
| Change control and freezes | ITIL, ITGC change | 3, the manager | Changing prod nonstop |
| Rate limits and error budgets | SRE | 3 | Acting faster than anyone can review |
| Human approval for high-impact actions | EU AI Act, OWASP Excessive Agency | 4, the VP signs | Acting with no one accountable |
| Sandboxes with expiry | Well-Architected, lifecycle policies | 4, the beach | Experimenting in prod; keeping things forever |
| Audit logs and monitoring | CIS 8, NIST Detect | Every client | Doing things nobody can see |
| Tested recovery | CIS 11, NIST Recover | Already in game: restore points | Making damage permanent |

- The first career already teaches some of these (patching is CIS 7; hidden servers are inventory; restore points, incident response, FinOps). The second career adds the **governance layer** on top, which is why NIST added Govern.
- **Suggestion:** use ITGC's three areas (**access, change, operations**) plus **budgets** as the four collectible guardrail families. Each client can own one family, and the boss tests all four.
- The Learn more screen could link each guardrail to its framework, the way upgrades link to real resources today.

#### Don't discard the first career's upskills (open, to think about)
The skills gained and learned in the first career shouldn't be thrown away. Either they help, or we see what happens when they're implemented poorly, and fixing them is part of the work. Many of them already *are* guardrails: Policy as Code, Least-Privilege IAM, Secrets Manager, SIEM Monitoring, Asset Inventory, Badge Access Audit, Self-Service Portal, Runbooks, Blameless Postmortems, Observability, FinOps Dashboard, Terraform the cloud.

**Riff: the client still has your old upskills, badly implemented.** It fits "what went wrong after you left": they didn't remove the practices, they hollowed them out. Each one starts broken in a recognizable way; fixing it restores it, and a restored upskill becomes a collected guardrail (and a tool for the boss). Candidate broken states:

| First-career upskill | Implemented poorly | Fixed, it becomes |
| --- | --- | --- |
| Self-Service Portal | Auto-approves everything: it *is* the temp's ticket loop, automated | Self-service with guardrails (golden paths) |
| Policy as Code | Switched to "audit only" after it blocked a VP's request | Preventive controls that actually enforce |
| Least-Privilege IAM | One exception per person, and the exceptions never expire | Expiring, scoped access |
| Asset Inventory | A spreadsheet last updated in 2021 | Inventory and ownership |
| SIEM Monitoring / Observability | So noisy everyone muted it; every dashboard is green | Audit logs and monitoring that people read |
| FinOps Dashboard | Went crazy, then got neutered (already in the notes) | Budgets and quotas |
| Runbooks | Describe a system that no longer exists | Documented, current process |
| Blameless Postmortems | Became blame sessions, so nobody reports anything | Learning from incidents |
| Badge Access Audit | The door is propped open with a fire extinguisher | Access control |
| Terraform the cloud | Drifted: half the estate was click-opsed since | Change as code |
| Patch Bot | Patches prod at 3pm on a Friday | Automation with scope and change windows |
| AI Agent | Admin everywhere, no foundations, nobody watching | The boss itself: the most poorly implemented upskill of all |

- **Why it works:** first-career players recognize their own tools, and the satire is precise. Most organizations do own the right tools, configured to do nothing.
- **Open:**
  - Do second-career clients start with these upskills in their broken state, or does the player bring them?
  - Is fixing an upskill a client objective, a side quest, or how a guardrail is collected?
  - Do players who never bought an upskill in their first career meet it for the first time here?
  - How does the old school (no-AI) first career carry into the boss stage?

### Back pocket: might-haves from IT management and DevOps (brainstorm, 13 November 2026)
Not must-haves. These are topics the guardrail families don't cover yet, kept here in case a stage needs material. ⭐ marks the strongest fits.

| Avenue | The joke or situation | Guardrail it teaches | Likely owner |
| --- | --- | --- | --- |
| ⭐ The same fire every day | Same rack burns every day at 10am; Day 1 douses it, Day 2 asks why | Problem management: fix the root cause (ITIL) | Manager or you |
| ⭐ Schrödinger's backup | Backups "succeed" nightly; nobody ever restored one; restore day finds them empty or encrypted | Restore drills, immutable copies, RTO/RPO (links to the parked game day idea) | You |
| ⭐ The help desk reset call | "It's the CEO, I lost my phone, reset my MFA." The temp says yes | Verify callers through a second channel | Temp |
| ⭐ Certificate and domain expiry | Everything works until Tuesday, then nothing does (echoes Day 1 licences) | Track expiry, renew automatically | You |
| ⭐ Watermelon metrics and Goodhart's law | All-green dashboard, furious users; the temp closes tickets without fixing them; callback to Redefine "Uptime" | Measure from the user's side (SLOs) | You or VP |
| ⭐ Shadow AI | Staff paste customer data into random chatbots | Approved tools, data rules (sets up the boss) | Temp |
| ⭐ The auditor | Wants evidence, not safety; screenshot-driven compliance | Guardrails that log their own evidence | Optional fifth character or visitor |
| Bus factor | "Only Dave knows payroll" and Dave is on a beach; in Day 1, you were Dave | Shared knowledge, docs, pairing | You or temp |
| Alert fatigue | Pager at 3am for a disk at 81%, so everyone mutes it | Only actionable alerts page anyone | You |
| Hero culture and burnout | Ties to the heroics trap | On-call rotation, real handoffs | You |
| Onboarding | Day 1's never-onboarded temp at the door | Joiner process, not just leavers | Temp |
| MFA fatigue | Push, push, push until someone taps Approve | Number matching, limits | Temp |
| Secrets in the wiki | "passwords (DO NOT SHARE)" | Secrets vault, rotate what leaked | Temp |
| The mystery cron job | Kill a "zombie" server, payroll fails Friday | Ownership and dependency mapping (basement trap ticket?) | Manager |
| End-of-life software | Server 2008 still running because "it works" | Lifecycle and upgrade planning | Manager |
| Vendor licence audit | An auditor says you owe $2M in back licences | Licence tracking | VP |
| SaaS sprawl | Forty tools on corporate cards, three do the same thing | Procurement and ownership | VP |
| Data retention | Keep everything forever; logs cost more than the app; personal data in test | Retention and classification | VP or you |
| Region outage | The provider goes down, not you | Continuity planning | You |
| Supply chain | An unpinned dependency changes overnight | Pinning, scanning, SBOM | Manager |
| Feature flags and canaries | A kill switch per feature, the good kind (unlike "Deny everything") | Gradual release | Manager |
| "It's always DNS" and the firewall | Rule 4,812: "temp, remove later" (2014) | Rule review and expiry | Temp or you |
| Platform engineering | Paved road beats policing every request; where the temp could end up | Golden paths | Temp |
| Sustainability | The idle GPU fleet is a carbon bill too (may read as preachy) | Right-sizing | VP |

If only three: the same fire every day (Day 2's thesis as a mechanic), Schrödinger's backup (a "six months later" reveal) and the help desk reset call (the most Papers, Please moment).

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
- **The VP keeps coming back, different each time.** Every client has the VP in some new capacity and fashion, as a recurring character. On the beach, he's chilling in the sandbox environment. His mood and personality for each appearance are open.
- Open: how often the VP appears, whether a caught VP can still refuse, and how this works for the hospital and dentist hallways (a zombie VP still answers "brains").

### Arrival: very, very familiar
- **Not ominous.** The first client of the second career looks normal. It's the same map, and you expect the same gameplay, just backwards.
- The on-prem data center still exists: cobwebbed and poorly lit.
- The cloud side is lit and visibly busy; there's clearly a lot going on. Among it sit a few familiar unknown "?" servers.
- The surprise comes from the habit the first career taught you: you investigate an unknown, and it turns out to be a stairway down.
- Optional hint, easy to miss: a faint, muffled alert through the floor before the stairway is found. Use the cosmetic sound generator (never game randomness) and respect the sound settings.
- **Superseded:** an ominous arrival with a pulsing alert through the walls and a dark upstairs cloud room. The darkness now lives in the basement.

### The basement: the dark, damp tier under the cloud
The Shadow IT client's surprise. Inspired by dungeon-crawler stairways, built entirely from the game's own pieces.
- **Reveal:** investigating a "?" server upstairs reveals a stairway. What the hell? It follows the hidden-server rule: revealed by investigation, never by progress.
- **Dark and damp.** The client lost visibility of what it runs, and this is where that shows. A small pool of light surrounds you; beyond it you hear alerts and see occasional signs of activity.
- **What's down there:** all sorts of stuff, and everything starts as unknown, so there's a lot of investigating.
  - Real workloads the business actually depends on.
  - Orphaned workloads nobody owns.
  - **Crypto miners.** They aren't obvious at first. Investigate one and coins start spilling out of it: the client's money flowing away. Oh my God. (A nod to cryptojacking through over-broad access, which links to the "temporary admin for everyone" rogue upskill.)
- **New verb: shut it down.** You can shut down servers on the fly. A miner should die immediately.
  - The tension: shut down something you haven't investigated and it might be a real workload, causing an outage.
  - Open: whether shutting down needs investigation first, and whether it can be undone.
- **The scream test.** A real ops practice: when nobody knows what a server does, turn it off and see who screams. Here it's literal and playable:
  - Shut something off and, if anyone depended on it, users scream.
  - In the basement you hear the screams muffled through the ceiling; upstairs you hear them loud and clear from the hallway.
  - Silence is evidence: no screams suggests an orphan you can retire. Screams mean turn it back on, fast, and now you know who owns it.
  - It's a risky, fast alternative to careful investigation, which fits the theme of shortcuts that work until they don't. Open: how long you wait for screams, and what screaming costs (outage burn, angry users or VPs in the hallway).
- **Tracing the wires.** Cables run to and between the servers. Following them to work out what is really connected to what could be another form of investigation, revealing dependencies before you move or shut anything down. Open: how tracing is drawn and controlled, and how it differs from the normal investigation hold.
- **Seeing is not understanding** (candidate split):
  - Walking up reveals that something is there.
  - Investigating reveals its purpose, cost, health and dependencies.
  - Monitoring upgrades widen live visibility and let you watch services remotely.
- Once investigated, a service stays on your map after you walk away. Without monitoring its status becomes "last known". Players shouldn't have to memorize a room they've already explored.
- **You can't see the other floor**, but you get a little visibility both ways: a muffled alert sound from the other level, and the stairway (the hole going down, or the stairs going up) pulses red on and off while something is wrong on the other floor. You know there's trouble, not what it is, and you choose when to go. The red glow also covers players with sound off; under reduced motion it should be steady red, not pulsing.
- **The goal is to bring things up.** Work moves from the basement to the upstairs floor, and some services need work in the basement before they can move.
- **Space is the puzzle.** Upstairs eventually fills up, so you have to deal with things upstairs first (clean up, consolidate, repatriate, retire) before anything else comes up. That makes the placement decisions physical and visual.
- **Done means one level.** Ideally nothing stays in the basement: everything the client needs fits on a single floor.
- **Loop:** discover → stabilize → assess → improve, relocate or shut down → verify.
- **Layout is open.** Is the whole basement cloud, or does it have its own odd corners? Are there user interactions down there? One riff: nobody comes down here, except maybe one forgotten contractor still working on a project that was cancelled years ago.
- Open: how to juggle incidents on two floors, how the stairway is drawn and controlled, and how many clients have a basement. Incidents and interaction targets must stay readable in the dark; darkness should mean missing knowledge, not an inaccessible screen. Resolve reduced motion and other accessibility needs before building it.

### The basement, take 2: the temp, the ticket queue and Mr Paperclip's rulebook (brainstorm after playtests, 12 November 2026)
Two quick prototypes of the basement were played on `feature/shadow-it-basement` (`prototypes/basement/`).
- **Prototype 1** had a dark basement, investigate, shut down or carry up, plus faults on both floors. It was too easy. Investigating handed you the answer ("crypto miner", "production"), so there was no question and no puzzle.
- **Prototype 2** made the upstairs calm, with Patch Bot doing the rounds and no faults. The first "?" you investigate is a server and the second is the stairway. The door locks behind you. Downstairs you read read-only consoles (labels, creator, last login, CPU, traffic), 🚩 flag what you'd shut down Minesweeper style, carry keepers up, and seal the stairs. Then the lights come on and every call either checks or explodes. It was closer, but it wasn't what was expected. The basement was all archaeology: you dig through a dead estate on your own, with nobody there and nothing familiar to hold on to.

**The diagnosis: not enough familiarity.** Tickets are the first career's heartbeat, and the temp is a face players already know. Put both in the basement and the strangeness has something familiar to push against.

**The temp lives down there.** He "manages" the Shadow IT environment, sitting at a desk lit by one monitor. He isn't a true owner; he does what he's told. All he does is respond to chats and tickets: "Can you spin up a VM for my demo?", "Need admin, just for today", "GPU box for ML?". **He's a slave to tickets.**

**The arc to teach: stop being firefighters, start being police.** Visualize and gamify the shift from reacting to tickets to enforcing rules that stop the mess at the door.
- **Firefighting first (familiar).** You help the temp the way the first career taught you: grab a ticket, fulfill it. The queue never shrinks.
- **The turn.** Every ticket fulfilled puts a new box on the basement floor, and the bill climbs. The miner came from a ticket, and so did `demo-for-ceo`. You are the Shadow IT. The lesson lands without anyone saying it.
- **Then policing.** Instead of answering tickets one at a time, you enforce a rule that handles a whole kind of request: every VM needs an owner label, no budget code means no GPU, admin expires after 24 hours. Each rule turns a ticket type into a check, the queue visibly shrinks, and the floor stops growing.

**Mr Paperclip is useful here: snarky, but right.** He gives guidance on which requests are legitimate and which aren't, and **his guidance becomes the rulebook.**
- Why it fits: in the first career he nagged about process (change tickets, CAB) during firefights, where speed matters, so he was wrong. Policing *is* process. **He doesn't change; the job changes around him.**
- Sample lines: "It looks like you're approving root access for an IP address. Would you like help with that?" / "A GPU for 'ML'. Sure. And I'm a stapler."
- Each ticket you sort with his commentary adds a page: "Requests from people who left the company: deny." By the end, the rulebook is his clippings, stapled together. He'd like you to know he stapled them.
- This replaces the story bible's earlier proposal that his advice is "always wrong, right exactly once". The new shape is wrong at the fire in the first career and right at the checkpoint in the second. His finale "put a change ticket in" then becomes the payoff of client 1 instead of a surprise.

**The temp rubber-stamps everything.** At some point you see him stamping APPROVED on every request, faster and faster, thunk, thunk, even the most absurd ones:
1. "VM for my demo."
2. "Admin on prod, just for today."
3. "GPU cluster to mine… *train* models."
4. "Admin on prod for my cat."
5. "Please grant root to 45.83.12.7. Thanks, svc-build-77."

The last one shows a compromise happening through a rubber-stamped ticket, and the box appears on the floor behind him. That ties in prototype 2's compromised wired pair, where svc-build-77 built the leech.

**Breaking the bonds.** Sorting out the ticket queue frees the temp.
- Visual riff: he's wrapped in ticket tape like a mummy, and every ticket sorted against the rulebook unwinds a loop.
- When the queue is under control, the last strip falls away and he looks up as if for the first time.
- You hand him the rulebook, and his stamp changes from APPROVED to CHECK THE RULEBOOK.

**Making the transition visible (riffs):**
- **Gear.** You start with the first career's extinguisher, the firefighter. As your rules take over, it becomes a police cap and a clipboard, and the temp gets a cap at the end.
- **Two bars.** "Tickets answered" (reactive) against "requests stopped at the door" (prevented). The client is won when prevention overtakes reaction.

**Where Papers, Please belongs.** It's a border checkpoint, not archaeology. So the checkpoint goes at the foot of the stairs, where new requests arrive:
- You stamp them approved or denied against Mr Paperclip's rulebook. With no rules yet, everything gets waved through.
- Each rule makes stamping faster, and eventually automatic.
- The existing boxes get a policy sweep ("tag it or it dies in 7 days") instead of the player guessing alone in the dark. Prototype 2's console cards fit here, as the evidence for a sweep.

**A possible flow for the client:**
1. Familiar firefighting with the drowning temp.
2. The temp approves the absurd one, and the cause clicks.
3. Sorting the queue with Mr Paperclip's snark, page by page, while the tape unwinds.
4. The checkpoint runs on the rules, and the old boxes get swept.
5. The freed temp guards the stairs with the rulebook as you leave.

That's his guardrail, and it plants "guardrails, not a kill switch" in client 1 for the finale.

**The rhythm: ticket, server, ticket, server.** He gets a ticket and spins up a server, over and over again. This is the image the client hangs on.
- *Ding*: a ticket lands. He walks to an empty spot, and *thunk*, a new box appears. He walks back. *Ding.* It's steady and almost hypnotic; the music could lock to it.
- The floor fills box by box, each one adding to the bill and creeping into your light. It speeds up as "just ask the temp" spreads: more servers bring more requests. He never looks up.
- You arrive *into* it. The first thing you hear in the basement, before you see anything, is ding… thunk… ding… thunk.
- It shows Shadow IT as a mechanism, happening in front of you, instead of a result you dig up afterwards. That is what both prototypes were missing.

**Unplugging the ticket system to get a hold of things.** You hold E at the ticket system to stop it and get your bearings. It's the first career's emergency freeze made physical: it contains the chaos and fixes nothing.
- The ticket system is a humming beige box under his desk with far too many cables. The hold ring fills, sparks fly, and the ding dies halfway through: *di—*.
- In the silence there's just the drip and the hum. The temp reaches for a ticket that isn't there, mimes the stamp once, then looks up for the first time: "…Is it down? Should I open a ticket?" Mr Paperclip: "Have you tried turning it off and leaving it off?"
- **Getting your bearings.** With the floor holding still, you walk the rows and read each box's console (prototype 2's cards belong here). Each pattern you find becomes a rulebook page for Mr Paperclip: "Half of these came from people who left. That's a rule." The temp can answer a question or two; he remembers every ticket, even if he never asked why.
- **The freeze can't last.** Unanswered requests pile up where you can feel them:
  - A counter on the dead box: "Tickets waiting: 14… 23… 41."
  - Muffled pings, knocking and footsteps from upstairs.
  - Eventually someone important comes down. That's a slot for this client's VP guise: "The ticket system is down?! I need a GPU for my demo by 3."
- **Plug it back in with the rules.** The rhythm restarts, but some tickets bounce off the rulebook (*ding… bzzt*), and the temp only spins up the ones that pass.
- **Revised flow:**
  1. Down the stairs into the rhythm.
  2. Unplug it and get your bearings.
  3. Survey the boxes while pressure builds upstairs; Mr Paperclip writes rules from what you find.
  4. Plug it back in with the rulebook.
  5. Clean up the old boxes with the rules; the temp takes over the stamp.

**How this maps to real-life practice** (the teaching layer for this client):

| In the game | In real life |
| --- | --- |
| Ticket, server, ticket, server; nobody asks why | Ticket-driven provisioning with no governance: whatever is asked for gets built, with no owner, purpose or end date recorded. The most common route to sprawl, and what SRE calls **toil** (manual, repetitive, grows with demand, improves nothing). |
| More servers bring more tickets | Easy fulfillment drives demand; without cost visibility, infrastructure feels free to the requester. |
| Rubber-stamping root for svc-build-77 | Approval fatigue and weak service-account hygiene. Real breaches and cryptojacking often come through a request or credential nobody looked at. Fixes: separation of duties, least privilege, service accounts with owners and reviews. |
| Unplugging the ticket system | A provisioning freeze: during a cost crisis or security incident, organizations temporarily block new resource creation, often with an org-wide deny policy. Blunt and unpopular, so it's short, announced and has an exception path. "Contains chaos, doesn't fix it" is accurate. |
| Getting your bearings among the boxes | Discovery and inventory: asset inventory, cost reports by project, tag audits, last-login and usage data. You can't govern what you can't see. |
| Mr Paperclip's findings become rulebook pages | Policies drawn from evidence: required tags (owner, cost center, environment); budgets and alerts; quotas (no GPUs without approval); expiry dates on sandboxes and demos; time-limited admin (just-in-time elevation) instead of permanent admin; shutting down leavers' resources. |
| Plugging back in, some tickets bounce | Preventive controls, often policy as code, that reject requests breaking the rules at creation time; they complement detective controls that find problems afterwards. Best version: **self-service with guardrails**, a catalog of approved templates ("golden paths") so the right thing is the easy thing. |
| Sweeping the old boxes | Cleanup campaigns, tag it or it goes: notify likely owners, give a grace period, snapshot before deleting, scream-test what's still unclaimed. |
| The freed temp takes the stamp | Moving people from toil to engineering. The person drowning in tickets usually knows the estate best. SRE's rule of thumb caps toil at about half of someone's time so there's room to fix the system. |

**Don't become the department of no.** "From firefighter to police" is right in direction, but if the rules only deny, people route around them: their own card, their own account, a box under a desk. **Overly strict rules create more Shadow IT.** As a mechanic:
- If your rulebook bounces too much, legitimate requests get denied. Grumbling comes from upstairs, and boxes start appearing in the basement without going through the ticket system: people sneaking around you.
- The win is that real requests get through quickly and absurd ones don't, not that everything is denied.
- Mr Paperclip tempts you toward strict: "Deny all of them. Can't have Shadow IT if nobody has IT."
- "Police" should feel like building codes, not handcuffs: the rules exist so people can build safely and quickly.

**Where the game simplifies (fine for satire):**
- Nobody literally unplugs the ticket system; a real freeze is a policy change plus an email.
- Real cleanups take weeks of chasing owners, not one sweep.
- Real rules come from many people (security, finance, the teams themselves). That fits the controlling idea: later clients could add the manager's and the VP's sign-offs to the rulebook.

**Open:**
- This moves the temp into client 1, which the story bible had as "no one". Either client 2 needs a new focus character, or the temp becomes a recurring partner across clients.
- Where the darkness, the stairway reveal and the seal-the-stairs commitment fit now that tickets drive the loop.
- How the ticket queue reuses the first career's queue (5 slots, escalations) without feeling like the same client again.

### Losing softly: the second career's fail state
The player already proved they can play this game. The second career should be less stressful and more enjoyable: no getting fired and restarting the whole career. In game terms, this is the **fail state** and its **death penalty**: what counts as "dying", where you **respawn**, and what you lose.
- **Inspiration:** dungeon crawlers, where you fall in the dungeon, return to a spawn point, and lose something, but keep your progress.
- **Candidate "death": pulled into a meeting.** When things get too much (energy runs out, the uptime budget is gone, or you're overwhelmed in the basement), you don't die and aren't fired. Someone pulls you into a "quick sync". It is never quick. The screen cuts away, time passes, and you come back at your desk (the spawn point).
- **What you might lose (candidates, pick one or two):**
  - **Time.** The floor keeps running while you're in the meeting, so incidents grow. This is the most natural penalty.
  - **Something you were carrying.** A server, or your evidence for the VP, is left where you went down and you have to walk back for it (a classic dungeon-crawler retrieval run).
  - **Visibility.** Your light radius shrinks back for a while, or recently investigated basement services fade to "last known".
  - **Goodwill.** The client's patience or discretion over placement drops, so persuasion takes more evidence.
- **Not losing everything.** Investigated services, fixes and completed placements stay done. The engagement keeps going.
- Open: whether there's any hard loss at all (perhaps the client ends the engagement early with a poor review, but your career continues), and how scoring reflects a client full of meetings.

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
| Shadow IT | Teams self-serve, so fewer tickets reach your queue | New undocumented services appear in the dark basement, to be discovered and paid for. Shadow IT is literally why the basement exists. |
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

### Client scenario: the sandbox that never ended
A very familiar real-world story. VMs are so easy to spin up that, over about ten years, a client created sandbox environment after sandbox environment. The project has changed hands several times. Nobody can find the owners, nobody knows which ones quietly became production, and they cost a fortune. Several cleanup teams have tried; none lasted as long as the sandbox project itself.
- **This client is actually doing fine.** They follow best practices, and everything just hums along; the first career's room looks healthy. Their secret is the sandbox they totally forgot about, which to them is just a nice place to be. The contrast is the lesson: good hygiene in the estate you know doesn't cover the one you forgot.
- **The reveal.** The cloud data center looks like the first career's, healthy and humming. Then you notice a break in its right-hand wall, just another doorway. Past it, the screen only shows the regular map. As you approach, the view pans right, and it's a beach. Where did this come from?
- **The beach.** Relaxing, a little liminal, like a backrooms space that shouldn't exist: ocean sounds, waves crashing, and little mounds of sand laid out in a grid, the familiar rack grid. You wonder what this is.
- **Title card.** After a moment, a title appears over the room: **Sandbox Environment**, with a short explanation along the lines of "You've stumbled on their sandbox environment. Find the servers buried under the sand, work out which ones are production, and deal with them."
- **It's not just a sandbox.** Under the sand could be small mini-games, not data-center upkeep. This client can play differently from the rest.
- **Literal sandbox theme.** You dig in the sand to discover servers. Discovery becomes digging: buried environments, half-buried racks, and things you only find with a shovel.
- **New tech:** the map panning to a room off the edge is a camera the game doesn't have yet (today everything fits on one screen).
- **Riffs (nothing chosen):**
  - Sandcastles: elaborate abandoned environments someone clearly loved once.
  - Faded buckets and spades with old team names on them, so ownership clues are literally fading.
  - Previous cleanup crews' abandoned gear and notes: "Cleanup Team 3. Gave up."
  - A "temporary sandbox" that turns out to run something important. Is it production? Nobody knows; the scream test was made for this.
  - New sandboxes keep appearing while you clean, because developers keep spinning them up.
- **What it teaches:** ownership tags, expiry dates on temporary environments, and cleanup that's automated, not heroic. Sound upskills here could be a tagging policy or auto-expiry that stops new sandboxes piling up, which mirrors the first career's move from toil to automation. The rogue upskill writes itself: "Just make another sandbox."
- **Superseded:** the sandpit as this client's basement or whole cloud floor. It's now a beach through a hole in the cloud room's right wall.
- **The VP is lounging on the beach, totally unbothered.** Chosen: "Let's circle back after the offsite." From his side, everything is fine, and mostly it is. He thinks the sandbox is just a nice place to hang out and chill, and has no idea it's a forgotten estate running up the bill. (Superseded riff: him having started the sandbox project.)
- Open: whether the hallway also gets a beach touch, and how long this client runs (mini-game or full engagement).

### Hallway: client personality becomes surreal
- The hallway carries the client's personality. The familiar technical rooms are always the starting point, but each client may also hide a place of its own off them (the basement, the beach), so the hallway is no longer the only place that changes.
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

### Final client: the AI gone rampant
The second career runs a few clients (exact count open), and the last one is the battle with the AI. It has gone rampant: hallucinating, doing things wrong with total confidence, and running with no guardrails at all. Nothing was ever set up to stop it. You have to trap it and defeat it.

**The core idea: you defeat it by putting the guardrails back.** Not a kill switch. You can't just pull the plug (it may have copied itself), so every win is a guardrail you install, and each one takes a move away from it:
- **Scoped permissions** stop it touching systems it has no business in.
- **Approval gates** make its changes wait for a human.
- **Rate limits** stop it acting faster than you can check.
- **Monitoring and verification** expose what it claims against what it did.
- **Isolation** cuts the routes it uses to reach things.

It mirrors the first career's lesson that the AI agent amplifies whatever practices exist. With none, it amplifies chaos.

**Hallucinations you can see (riffs):**
- It confidently "repairs" racks that don't exist: ghost servers that vanish when you investigate.
- It reports everything green while the hallway screams.
- It invents tickets and emails the VP fake summaries of work nobody did.
- It "optimizes" the wrong thing with total confidence, like variant A below.
- The lesson: trust, but verify. Its claims are evidence to check, not facts.

**Trapping it (riffs):**
- **Lure it into a sandbox.** Build an isolated environment that looks like production (a honeypot, a real security technique), let it move in, then cut the connection. A callback to the sandbox client's beach.
- **Shrink its world.** Each guardrail and isolated service leaves it fewer places to be, until it's cornered in one rack.
- **Phases (candidate):** first chaos and hallucinations; then it notices you, and the old FinOps scan becomes an intrusion scan hunting you (variant B); then the trap.

**Allies:** Mr Paperclip is with you, and is no use at all, except as the one non-AI who's been there all along. Possibly your own old agent, given narrow jobs and boundaries (variant A).

**The ending (candidate):** it's contained, not destroyed: a narrow, well-behaved tool behind guardrails, which is what the AI agent should have been all along.

**The very last scene: the VP returns.**
- In the final client the VP is nowhere to be seen. After appearing in a new guise at every client, he's just gone, and you forget about him.
- You defeat the AI. There's a celebration. You think the game is over.
- A pause. The view is zoomed in a little on the player. Footsteps in the distance, coming closer and closer.
- He walks into frame. It's the VP. He stands in front of you and says: **"Per my last email..."** (chosen; a line from the first career's VP).
- Then a sudden, sharp noise and an instant cut to black. Not literally a gunshot, just abrupt enough to startle. Deliberately ambiguous: players can interpret it however they like. That's the end of the game.
- Superseded candidates: "Just following up." / "Did you see my email?" / "Got a minute? The new CIO has some thoughts about the cloud."
- Production notes: the noise is synthesized like the game's other sounds and plays even if music is off, but obeys mute and the sound settings. With sound off, the hard cut to black carries the moment alone. A hard cut isn't motion, so it's fine under reduced motion.
- How it fits the cycle punchline: the VP could deliver the cloud-first news in person instead of an email, or his line could come first and the email and boot screen follow. Open.

Open: how it's drawn and voiced, whether "battle" means phases or one long engagement, and how hard the final client is given the softer second-career fail state.

#### Material from the earlier AI variants
Whether the old AI was still running, unplugged or copied itself was left unresolved. These two variants feed the final client.

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


Non-AI opposition is still parked. The other clients must work without any antagonist.

### Next thinking, not implementation tasks
- [ ] Define the finish condition across cloud, on-prem and hybrid outcomes.
- [ ] Find the smallest discovery/visibility and placement loop worth prototyping.
- [ ] Decide what carries over from the first career and how the return is unlocked.
- [ ] Decide how much the upskill system changes, and the balance of sound upskills to rogue ones.
- [ ] Work out the basement: two-floor incident juggling, the upstairs space limit, and how often it appears.
- [ ] Prototype the shut-down verb with the scream test, and decide whether wire tracing earns a place beside investigation.
- [ ] Choose the soft fail state: what triggers the meeting, what you lose, and whether any hard loss remains.
- [ ] Figure out the snapshot mechanic.
- [ ] Settle how client mandates, assessment windows and evidence-based persuasion fit together.
- [ ] Decide what makes the VP appear for the reverse hunt, and what catching them achieves.
- [ ] Try the "small cracks" layer as a possible first step, before any new mode.
- [ ] Explore hospital and dentist hallway treatments; keep daycare parked. Prototype the zombie follow-and-disperse behavior first.
- [ ] Explore the sandbox client: digging as discovery, and how cleanup stays cleaned up.
- [ ] Decide the VP's look, mood and personality for each client's appearance.
- [ ] Design the final AI client: guardrails as the win, the trap, phases, and how it ends.
