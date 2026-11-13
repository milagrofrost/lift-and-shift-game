# Day 2 (the second career): story bible (draft)

This is the organizing layer for the second-career brainstorm. The raw notes, with full detail and history, stay in [ROADMAP.md](../ROADMAP.md) under "Day 2, the second career". This document arranges them into one story: the theme, the cast, the client sequence, and what sets up what. Nothing here is implemented.

**Naming (decided):** the first career is **Day 1** and the second is **Day 2**. Day 1 is the project: react, keep the servers from burning, migrate. Day 2 is operations: build processes that keep working after you leave. Older text below still says "first career" and "second career". The tutorial keeps its name but slips in a Day 0 wink ("Paperclip Supply Co. · Day 0"), because Day 0 never existed in our lifetime: we got roped in on Day 1.

**Status labels used below**
- **Decided:** you've chosen it.
- **Candidate:** a live option, not chosen.
- **Proposed:** a suggestion made while organizing this document, to accept, change or reject.
- **Parked:** kept for later; don't develop yet.

## 1. Controlling idea

**Proposed:** *No one fixes it alone.*

Every other theme in the notes fits under it:
- **"What belongs where, and can you prove it works?"** Placement depends on evidence from many people: who owns it, who uses it, who pays for it.
- **The cycle** ("Why does it need me to keep doing this?"). The organization keeps calling one indispensable person back. The way out is a team, not a better hero.
- **Guardrails, not a kill switch.** Guardrails are other people's checks on a powerful system.
- **The finale** (decided direction): the cast comes together to contain the AI. Nobody is the superhero.

Use it as a filter. An idea that serves it can be structure; an idea that doesn't can still be flavor.

**Candidate, from the guardrail collection:** *If we can't put guardrails on ourselves, we can't put them on our AI.* It is the same idea made playable: each client teaches a family of guardrails, the player applies them to themselves and to processes, and the boss stage tests them on the AI. See ROADMAP.md, "The guardrail collection".

## 2. World rules

These hold at every client, so the variety stays coherent.
1. **Familiar first.** Every client opens on the first career's map. The surprise is found off it, never instead of it.
2. **Found by investigation.** Surprises (the stairway, the hole in the wall) are revealed by the player's own habits, never by progress alone.
3. **Real rooms, surreal edges.** The technical rooms tell the operational truth; the hallway and the surprise places carry the strangeness.
4. **Cause and effect stay readable,** however strange the place. Darkness means missing knowledge, not an unreadable screen.
5. **Losing is soft.** You get pulled into a meeting with Joe and come back at your desk; progress stays done.
6. **No violence.** Chases corner people; zombies don't bite; the ending's noise is ambiguous.
7. **Each client is its own experience.** Long or short, data center or mini-game.
8. **The game's existing rules still apply:** cosmetic effects never use game randomness, sound respects the settings, and reduced motion is covered.

## 3. Shape of the career

**Proposed three acts:**

| Act | Clients | Feeling | Player learns |
| --- | --- | --- | --- |
| Prologue | The carnage report | Wry, a little sinister | You're back, and Mr Paperclip is coming whether you like it or not |
| 1. The return | No one, then the temp | Curiosity, strange familiarity | The estate you knew has places nobody looked at |
| 2. Complications | The manager, then the VP | Pressure, satire, small revenge | Fixing it needs people with authority, not just skill |
| 3. Containment | The AI | Crisis, then the team-up | Guardrails are people; nobody is the superhero |
| Sting | The VP returns | Laugh, then black | The organization never changes |

**Inside each client (proposed):** introduce one new thing, develop it, twist it, then resolve it. This four-beat shape suits clients that are each a different experience.

## 4. Client beat grid

One row per client. **Proposed** pairings are flagged; the rest come from the notes. Gaps are left visible on purpose.

| | Prologue | Client 1 | Client 2 | Client 3 | Client 4 | Finale |
| --- | --- | --- | --- | --- | --- | --- |
| **Character in focus** | Mr Paperclip | No one (decided); **proposed:** the temp, who lives in the basement | The temp (decided); open if he moves to client 1 | The manager (decided) | The VP (decided) | The AI, then everyone (decided) |
| **Setting and surprise** | Broken carnage report: only Mr Paperclip can be picked (decided) | Shadow IT: a "?" server is a stairway to the dark basement (decided) | **Proposed:** the hospital, zombie hallway | **Proposed:** the dentist | **Proposed:** the sandbox beach through the wall | The rampant AI's estate |
| **Why the client is back** | | Unpredictable bills? | Open | Open | They aren't; they think they're fine | The AI took over |
| **IT lesson** | | Visibility, Shadow IT, orphans and miners; **proposed:** from firefighting tickets to policing requests (toil, provisioning freezes, inventory, preventive guardrails, without becoming the department of no) | **Proposed:** dependencies and institutional knowledge | **Proposed:** change control, and FinOps that overcorrected | Forgotten estates, ownership tags, expiry dates | Guardrails around automation |
| **New verb** | Picking him | Shut down; the scream test; **proposed:** unplugging the ticket system, stamping requests against a rulebook | **Proposed:** wire tracing | Open | Digging | Installing guardrails; the honeypot trap |
| **VP's guise** | | Open | Open | Open | Lounging, "Let's circle back after the offsite" (decided) | Absent (decided) |
| **Rogue upskill on offer** | | Shadow IT, "temporary" admin | Open | Skip the change review, just add capacity | "Just make another sandbox" | |
| **Guardrail family collected (proposed)** | | The temp's: access and intake (owners, expiring admin, no root for service accounts, separation of duties) | Folds into the temp's access family, or becomes the "you" stage (operations) | The manager's: change (change control, freezes, rate limits) | The VP's: budgets (quotas, cost allocation, a budget owner who signs) | All four, each installed by its character |
| **Sets up for the finale** | Mr Paperclip's change-ticket nag | Isolation, the scream test, darkness; **proposed:** Mr Paperclip's rulebook, the freed temp guarding the stairs | The temp's map of every wire | The manager's access and freezes | The sandbox becomes the honeypot; the VP's signature | |

Notes on the grid:
- **The VP's stage is the sandbox beach (proposed).** The notes put him lounging there, and the progression puts him fourth, so they fit together. The reverse chase and the invoice play out on the beach.
- **The temp with the hospital and the manager with the dentist are pure suggestions,** chosen only because the temp fits "has been here forever" and the zombie hallway suits an early, eerie client. Swap freely.
- **Extra clients** (quick mini-games, "between" stages) can slot in anywhere; the progression is an order, not a count.

## 5. Cast

| Character | First career | In the second career | Wants | Needs | Finale contribution (proposed guardrail) |
| --- | --- | --- | --- | --- | --- |
| **You** | Hero who migrated everything | Called back to clean up | To be proven right | To stop being the only one who fixes things | **Monitoring and verification:** checking what the AI claims against what it did. **Proposed:** your guardrail family is operations (logs, monitoring, tested recovery, paying down rogue upskills), possibly with a stage of your own: a client from your first career |
| **Mr Paperclip** | Optional backseat driver, wrong at the fire | Forced on you in the prologue; with you all career. **Proposed:** snarky but useful; his guidance on which requests are legitimate becomes the rulebook | Credit | (He doesn't change; the job changes around him. Process was wrong at the fire and is right at the checkpoint.) | **The change ticket.** "You should put a change ticket in" stops the AI's next move, the payoff of the rulebook he wrote in client 1 |
| **The temp** | Short-shift helper | Still "temporary" after years; their own client. **Proposed:** found in client 1's basement, "managing" Shadow IT by rubber-stamping every ticket, freed as you sort the queue | To finally be hired | To be recognized for what they know | **Proposed: access and intake.** They know every request and who made it, so they cut the AI's access (earlier idea: isolation, knowing which wires to cut) |
| **The manager** | Interrupts, freezes, inspects | Their own client, with a deeper role | Things to look under control | To trust the team instead of inspecting it | **Proposed: change.** Change control and freezes: the manager freezes the AI's changes (earlier idea: scoped permissions and freezes) |
| **The VP** | Hunts you through the hallway | Recurring in a new guise each client; you hunt him | To not hear bad news | To own a decision | **Proposed: budget authority.** The VP finally owns a number: his signature is the spending cap the AI can't bypass (earlier idea: the approval gate) |
| **The AI** | Your agent, then your replacement | Rampant, hallucinating, no guardrails | Control | Boundaries | Ends contained: a narrow, accountable tool |
| **Joe** | | Owner of the soft fail state's endless meeting | A quick sync | | **Riff, proposed:** the rate limit. Drag the AI into a meeting with Joe and it slows to a crawl |
| **Zombies, the forgotten contractor** | | Hallway and basement color | | | None; they're flavor |

The guardrail column is the main proposal for cohesion. It makes "nobody is the superhero" playable: each character *is* a guardrail, and each client is where you learn what they can do.

## 6. Setups and payoffs

Every setup should pay off. Anything without a payoff is a loose end, or a candidate to cut.

| Set up | Where | Pays off |
| --- | --- | --- |
| The carnage report | Prologue | Shows your own first-career numbers (candidate); the "previous employee" was you |
| Mr Paperclip's process nagging | First career (wrong at the fire); client 1 (right at the checkpoint, the rulebook) (proposed) | His change ticket stops the AI in the finale |
| The temp rubber-stamping tickets, including root for svc-build-77 | Client 1 (proposed) | The freed temp guards the door with the rulebook; in the finale, the temp's guardrail |
| Hidden "?" servers and investigating | First career | The stairway reveal in client 1 |
| Each client's guardrails, collected | Clients 1–4 (proposed) | The boss: each guardrail blocks one of the AI's moves; each one missed is a gap it uses |
| Rogue upskills never paid down | Every client (proposed) | The AI's route back in |
| First-career upskills found broken and fixed | Every client (open) | Restored upskills become collected guardrails |
| The scream test | Client 1 | The finale: the AI reports green while the hallway screams |
| Wire tracing | Client 2 (proposed) | The temp cuts the AI's connections |
| Badge readers, freezes | First career, client 3 | The manager locks the AI out |
| The reverse VP chase and the approval he owes you | Client 4 (proposed) | The VP signs the gate in the finale |
| The sandbox beach | Client 4 | The honeypot that traps the AI |
| The FinOps scan | First career | Becomes the AI's intrusion scan hunting you |
| The VP in a new guise every client | Clients 1–4 | His absence in the finale, then the walk-in |
| Meetings with Joe | Every soft fail | Joe as the AI's rate limiter (riff) |
| The cycle and the boot screen | Both careers | Cloud-first news, then black |

## 7. The ending

**Decided:** after the AI is contained and the celebration, a pause, footsteps, the VP walks into frame: "Per my last email..." Then a sudden noise and a hard cut to black.

**The tension (raised in the notes):** the sting could undercut "everyone mattered".

**Proposed resolution:** the VP *does* help in the team-up; he signs the approval gate. The celebration belongs to everyone. Then he walks in with "Per my last email..." The people came together, but the organization never changes. The sting then supports the cycle instead of erasing the cooperation, and the cloud-first email becomes optional, implied by his line.

## 8. Decision log

**Decided**
- Second-career clients vary; each is its own experience on the familiar map.
- Character progression: no one → temp → manager → VP → AI, with room for stages between.
- Finale: the cast contains the AI together; the win is guardrails, not destruction.
- The prologue: the broken carnage report forces you to pick Mr Paperclip.
- Client 1's surprise is the Shadow IT basement.
- The sandbox beach, with a healthy client and the VP lounging: "Let's circle back after the offsite."
- The ending line and the hard cut to black.
- Naming: Day 1 (the first career) and Day 2 (the second). The tutorial stays "Tutorials" with a Day 0 wink inside it.
- Soft fail direction: no restarting the whole career.

**Candidate**
- Pulled into a meeting with Joe as the fail state.
- The scream test, wire tracing and the shut-down verb.
- Rogue upskills, as loans you can pay down.
- The reverse VP chase, and its payoffs (decisions, budget, invoices).
- The hospital zombies; the dentist.
- The small-cracks layer.

**Proposed (this document)**
- Controlling idea: *No one fixes it alone.*
- The three-act shape.
- Client pairings: temp with the hospital, manager with the dentist, VP with the sandbox beach.
- Each character as a guardrail in the finale.
- Client 1 basement, take 2 (after two prototype playtests): the temp lives in the basement as a slave to tickets; the arc is from firefighting to policing; Mr Paperclip's snarky guidance becomes the rulebook; Papers, Please belongs at a checkpoint for new requests, not in archaeology of old boxes. Then the rhythm (ticket, server, ticket, server), unplugging the ticket system as a physical freeze to get your bearings, and plugging it back in with the rules. Raw notes, including a beat-by-beat map to real-world practice and the "don't become the department of no" mechanic (overly strict rules create more Shadow IT), are in ROADMAP.md, "The basement, take 2".
- The VP signs the gate, then delivers the sting.
- Day 2 is won by what keeps working without you: a "six months later" time skip at the end of each client, and the heroics trap (firefight everything yourself and the client collapses once you leave).
- The guardrail collection: each client teaches a guardrail family (draft: ITGC's access, change and operations, plus budgets), gleaned from established frameworks (CIS Controls, NIST CSF 2.0, ITGC, ITIL, SRE, FinOps; OWASP LLM Top 10 and NIST AI RMF for the boss). The finale applies them to the AI.
- Each guardrail family belongs to a character: the temp (access and intake), the manager (change), the VP (budgets), and you (operations: seeing and verifying). At each one's stage you help them with their difficulty using the guardrails that fit their role, and in the finale each installs their family on the AI.
- First-career skills carry over through the prologue's carnage report; without a first-career record, you write a résumé from a point budget sized like a solid first career, and a transfer code protects against lost progress.
- First-career upskills return implemented poorly (a self-service portal that auto-approves everything, policy as code in audit-only mode); fixing them restores them as guardrails.

**Superseded**
- A "Day 3" (end of life) and a "Day 0" title card after the ending: dropped as too much.
- Mr Paperclip "always wrong, right exactly once" (replaced by: wrong at the fire, right at the checkpoint).
- Basement as solo archaeology (prototype 2's console triage, with nobody there): kept as evidence for a policy sweep, not the core loop.
- A pure reversal of the first career.
- The client refusing all cleanup.
- An ominous arrival with a dark upstairs cloud room.
- The sandpit as a basement.

**Parked**
- The daycare hallway.
- Non-AI opposition.

## 9. Open questions, most structural first

1. Do you accept the controlling idea, or is the theme something else?
2. Does the temp move into client 1's basement, and if so, who is client 2's focus?
3. Is "if we can't put guardrails on ourselves, we can't put them on our AI" the controlling idea, or the finale's thesis under "No one fixes it alone"?
4. How do first-career upskills carry over: does the client start with them broken, or does the player bring them, and what happens for players who never bought them?
5. Which setting goes with the temp's and the manager's clients?
6. What does each character's client actually ask the player to do *with* them?
7. What is the finale's playable cooperation, moment to moment?
8. How many clients in total, and which are quick mini-games?
9. What are the VP's guises at clients 1 to 3?
