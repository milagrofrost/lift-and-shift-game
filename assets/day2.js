/* Lift & Shift · Day 2 prototype: "The last temp".
   Day 1 rewards doing the work yourself. Day 2 rewards getting someone else ready to do it.
   One returning client (Teddy's Bright Smile Dental), one temp (Doug, the last one the agency has), three night shifts.

   Each shift opens with a timed handover on Day 1's floor. Do a job with Doug beside you and he watches (demonstrate).
   Press Space at a job and he tries it while you supervise (practice): mistakes you're there for get caught. Hold E at
   the wiki to write a runbook, at the dusty Patch Bot to configure it, at the portal kiosk to stop it auto-approving
   everything, and at a rack's tag to fix what keeps breaking it. You can't do it all, and his head fills up: lessons
   stick less the more you cram in. Runbooks don't use head space. Then you go home and he runs the night alone on
   Day 1's own simulation (patch cycles, tickets, escalations, fires, outages, the uptime budget) while you watch.
   If he gets stuck he calls you; answering is stepping in. The review says what happened and why.

   This file loads before the game. The game calls window.LasDay2(G) once with a bridge to its internals and keeps the
   result as D2; every Day 1 hook is behind S.d2, so a normal career never runs this code.
   Rules kept from the game: drawing never uses randomness and Doug's chatter has its own generator, so neither shifts
   the game's odds. Handover and shift run at a fixed step with their own seeded Math.random, so the same handover
   always plays out the same night. Everything about Day 2 lives in S.d2. */
(() => {
"use strict";
window.LasDay2 = G => {
const {W,H,RACKS,DESK,TIER,C,ctx,DISP,BODY,MONO,RM,keys,tx,rr,em,bar,smallBubble,fl,toast,sfx,goTo,dist,clamp,$,show,play,
  setMuffle,applyPatch,patchDue,noteRestored,ticketLimit,mkBot,logLv,decoT,doorCross,spraying,drawSpray} = G;

/* ==== Tuning ==== */
const STEP = 1/60;
const SLEEP_FF = 5;                             // the night runs x5 while your eyes are shut; x1 while you're awake
const CLOSE_T = 2.6;                            // seconds for your eyes to drift shut: heavy, a flutter, heavier, gone
// runbooks: you write the first version (a baseline, 50%); Doug takes it the rest of the way to 100% from what he's actually done
const BASE = 0.5, DOC_MAX = 1;
const EXP_JOB = 1, EXP_FAIL = 1.5, EXP_CALL = 3, EXP_CAP = 40;   // experience to write up: a job, a mistake (they teach more), a call you talked him through
const WRITE_PER = 0.8;                          // seconds of writing per point of experience (slower than you: he's working it out as he goes)
const EXP_DOC = 0.025, EXP_XP = 0.5;            // per point: runbook (less as it nears 100%) and skill
const TALK_BACK = 15, TALK_BACKS = 2;            // talking him back in: what it costs you, and how many times he'll pick up                           // energy it costs you to talk him back in after he walks out
const WAKE_T = 2.6;                             // seconds to open your eyes after you pick up: a crack, a blink, a squint, then the room
const SLEEP_REGEN = 0.35;                       // energy per second of the night you spend asleep (about +50 over a quiet night)
const CALL_COST = 20, WAKE_MIN = 20;            // picking up costs energy; under this when it starts ringing, you sleep through that call
const CALL_T = 4.2, RING_EVERY = 1.4;           // it rings three times, then voicemail
const STAY_UP = 1.4;                            // seconds you stay awake after the last reason to (a call, a job you talked him through)
const ZOOM = 1.8;                               // the security camera's close-up on him while you're on the phone
const PREP_LEN = 100, SHIFT_LEN = 150;          // seconds of game time: 16:20-18:00 handover, 22:00-06:00 night
const ERR = 120;                                // the night's uptime budget
const NAME = "Doug";
// the ladder: patching first; tickets and fires once patching is Practiced; bringing servers back up once both of those are
const SK = ["patch","ticket","fire","restore"];
const SKILL = {patch:{name:"Patching",icon:"🩹",short:"patching"},ticket:{name:"Tickets",icon:"🎫",short:"tickets"},
  fire:{name:"Fires",icon:"🧯",short:"firefighting"},restore:{name:"Outages",icon:"🔌",short:"bringing servers back up"}};
const SKILL_OF = {patch:"patch",botfix:"patch",ticket:"ticket",fire:"fire",botfire:"fire",restore:"restore"};
const NEEDS = {patch:[],ticket:["patch"],fire:["patch"],restore:["ticket","fire"]};
const READY = 40;                               // "Practiced" opens the next rung
const unlocked = (pr,sk) => NEEDS[sk].every(k => pr.sk[k].xp>=READY);
const needText = sk => NEEDS[sk].map(k => SKILL[k].short).join(" and ");
const LEVELS = [[0,"Never seen it"],[15,"Watched it"],[40,"Practiced"],[70,"Confident"],[90,"Could teach it"]];
const level = xp => LEVELS.reduce((i,l,k) => xp >= l[0] ? k : i, 0);
const WATCH_R = 130, SUP_R = 140;               // how close he has to be to watch you, and you to supervise him
const DOC_T = 9, TOOL_T = 6, BOT_T = 24;       // hold-E seconds: a runbook's first version, fixing the portal, getting Patch Bot working (a couple of handovers' worth; progress is kept)
const HEAD_DEMO = 9, HEAD_TRY = 13, HEAD_SWITCH = 6;   // head space is his capacity to learn today: at 0 nothing new sticks
// Patch Bot learns: every case someone teaches it where it got stuck raises its odds
const BOTFIRE0 = 30, BOTFIRE_GROW = 3, BOTFIRE_T = 2.5;   // Patch Bot on a case it doesn't know: it catches fire (the server's fine), grows, and you hold E 2.5 s to put it out
const BOT_FIRST = 0.3;   // with a working Patch Bot, Doug leaves a patch to it until under 30% of the cycle is left (or the bot is already on it)
const BOT_OK0 =0.5, BOT_LEARN = 0.08, BOT_LEARN_DOUG = 0.06, BOT_MAX = 0.92, BOTFIX_T = 3;
const DEMO_CAP = 38;                             // watching alone never gets him to "Practiced" (40): he has to try it
// the room: [slot, name, tier, patch cycle, share of the first cycle left at the start of the handover]
const ROOM = [[0,"Scheduling","bronze",50,.8],[1,"Patient Records","silver",56,.92],[2,"Practice Mgmt","gold",62,1],
  [3,"Billing","bronze",46,.74],[4,"X-Ray Archive","silver",58,.86],[5,"Website","bronze",52,.7],[6,"Front Desk PC","bronze",48,.96],
  [7,"Dr. Ken's Laptop","silver",54,.78],[9,"Imaging Bridge","gold",60,.84],[10,"File Share","bronze",44,1]];
// old hardware that falls over on a schedule (the same every try at a night); Day 1's escalations still start fires on their own
const ISSUES = {psu:{slot:7},vent:{slot:4}};
const PREP_EVENTS = {psu:[24],vent:[60]};
// five nights; each a little busier. Only the last one has to go well.
const SHIFTS = [
  {name:"Monday night",tk:0.85,psu:[50],vent:[100]},
  {name:"Tuesday night",tk:1.0,psu:[40],vent:[90]},
  {name:"Wednesday night",tk:1.1,psu:[32,104],vent:[66]},
  {name:"Thursday night",tk:1.25,psu:[28,96],vent:[58,120]},
  {name:"Month-end close",tk:1.4,psu:[26,86,132],vent:[52,114]},
];
const DAYS = SHIFTS.length;
const SITE = "TEDDY'S EASTSIDE CLINIC (NOT MIGRATED)";   // the floor label: a second site nobody put on the migration list
// stations: the wiki (where Day 1's inbox sat), Patch Bot gathering dust where Day 1's bots park, the portal kiosk
const DOCS = {patch:{x:408,y:58},ticket:{x:456,y:58},fire:{x:504,y:58},restore:{x:552,y:58}};
const BOTSPOT = {x:180,y:524}, PORTAL = {x:566,y:428};
const PREP_TK = 0.7;                            // the handover's tickets come a little slower than a night's
const STRESS_RATE = 0.6;                        // how fast a bad night wears him down (a full queue, outages, work he can't do)
const TEAL = "#4fd1c5";

/* ==== Doug's lines (their own generator: chatter never touches the game's odds) ==== */
const L = {
  hi0:["Hi! I'm Doug. The agency said this was data entry.","Doug. Temp. The last one, apparently.","Hi! Are you the one who knows everything?"],
  back:["Fine. I'm back. But I want it noted.","You said 'please'. Nobody's ever said 'please' to me.","I'm only back because you sounded worse than me."],
  hiN:["Morning! I never left. Nine coffees. I can hear colours.","I don't really sleep. The hallway coffee sees to that.","Round two. I took notes. On my hand. All night."],
  watch:["Ohh, so THAT's the button.","Can you do that again, but slower?","Writing this down. Mentally.","Wait, which cable was that?","Huh. That's it?"],
  tryOk:["I did it! Don't look at me.","Is this what confidence feels like?","Nailed it. Probably."],
  caught:["Whoa, not that one. Got it.","Oh. The OTHER cable.","Okay, so don't do that. Noted."],
  show:["Show me first? I've never seen one.","Can you do one while I watch?","I don't know what that even is yet."],
  later:["One thing at a time. Can we stick with the easy stuff?","I'm still getting the hang of the last thing.","That looks like a next-week problem."],
  note:["Okay. Writing down what actually happens. Mostly the swearing.","Step one: panic. Step two... let me write step two.","Adding to it. Future Doug will thank me."],
  noted:["Done. It's in the wiki now. Real words and everything.","Updated. Next time I won't have to call. Probably.","There. Now it's not just in my head."],
  robot:["Wait. You're patching the robot?","Oh, so the bot just needs to be told.","You're teaching the robot. Cool. Cool cool."],
  tryIt:["Me? Okay. Okay okay okay.","You'll stay right here, right?","Watch me. Actually, don't."],
  full:["That's a lot of new words.","My brain is full. Is that a thing?","I'm going to need a notebook."],
  empty:["Sorry. Nothing's going in anymore.","I'm nodding, but I'm not retaining.","Brain's closed. Come back tomorrow."],
  morning:["Morning. So... about last night. I'm still here. I'm always here.","I didn't go home. Is that allowed? Anyway, here's the list.","Still here. Some of the servers are not."],
  ok:["Patched it. All by myself.","Look at me, doing IT.","Back online! Nobody saw it was down. Right?","Ticket closed. For real this time.","Done. Should I tell someone?"],
  fail:["Was it supposed to beep like that?","Okay, that's worse now.","Hmm. Is there an undo?"],
  noDoc:["Is there a runbook? There's never a runbook.","The wiki page just says 'ask the consultant'.","Nobody showed me this one."],
  partDoc:["Step 4 just says TODO.","The runbook ends mid-sentence.","'Then you just know.' I don't, actually."],
  doc:["The runbook says do this. So I'm doing this.","Following the runbook. Like a professional.","Step 1... step 2... look at me go."],
  stress:["Is it always like this?","My last job had a ping pong table.","Why is everything beeping?","I'm fine. This is fine."],
  calm:["I've got this.","Is it always this quiet?","Quick, nobody break anything."],
  call:["Hey, sorry, it's Doug. Quick question...","It's Doug. Something's broken. Is that bad?","Hi, it's Doug again. Don't be mad."],
  vm:["Voicemail. Cool. Cool cool cool.","Straight to voicemail. I'll... figure it out.","Not picking up. Great."],
  guided:["Oh! Okay. That makes sense.","Got it. Thanks. Sorry. Thanks.","Writing that down. For real this time."],
  coffee:["Coffee first. Then panic.","Five-minute break. Four. Three.","This coffee is load-bearing."],
  gold:["That's the gold one. I'm not touching the gold one.","Gold? Nope. Not without a runbook."],
  bold:["How hard can it be?","I've seen this on YouTube.","Okay. Confidence. Go."],
  idle:["One sec, checking my phone.","Do we get a lunch break?","Is the vending machine on-prem or cloud?"],
  stuff:["You want ME to write it? I don't know how it works yet.","That's a you job. I'll watch."],
  what:["What should I do?","Point me at something.","I'm ready. I think."],
  solo:["On my own? Okay. Okay okay okay.","Going solo. Like a professional. Who is alone.","I'll just... do what I know. Which is some things."],
  recall:["Coming! Did you miss me?","Back. What are we learning?","Oh good, supervision."],
};
let lseed = 0x2d2b;
const lr = () => {lseed = (Math.imul(lseed,1664525)+1013904223)>>>0; return lseed/4294967296;};
const line = k => {const a = L[k]; return a[Math.floor(lr()*a.length)];};
const say = (T,k,t=2.8) => {T.say = L[k] ? line(k) : k; T.sayT = t;};

/* ==== State ==== */
const S_ = () => G.S, D = () => G.S && G.S.d2;
const clone = o => JSON.parse(JSON.stringify(o));
const freshProg = () => ({shift:0,sk:{patch:{xp:0,doc:0},ticket:{xp:0,doc:0},fire:{xp:0,doc:0},restore:{xp:0,doc:0}},conf:20,stress:0,
  tools:{bot:false,portal:false},work:{bot:0,portal:0},botOk:BOT_OK0,botSeen:false,hist:[],
  exp:{patch:0,ticket:0,fire:0,restore:0}});
const expOf = (pr,k) => (pr.exp||{})[k]||0;
const rb = s => s.doc/DOC_MAX;   // how much of a runbook's help he gets: a 100% runbook is as good as it gets
const mkTemp = (x,y) => ({x,y,tgt:null,work:0,need:0,say:"",sayT:0,ext:null,quit:false,cool:{},phone:false,watching:false,idleT:0,chatT:4,breakCd:0,replanT:0});
// the seeded generator the fixed-step loop swaps in for Math.random (state lives in S.d2, so it's part of the run)
const rngOf = d => () => {d.rs = (d.rs+0x6D2B79F5)|0; let t = d.rs; t = Math.imul(t^t>>>15,1|t); t ^= t+Math.imul(t^t>>>7,61|t); return ((t^t>>>14)>>>0)/4294967296;};
const night = d => ["shift","review","final"].includes(d.phase);
const clock = (d) => {const m = night(d) ? 22*60+d.t/SHIFT_LEN*480 : 16*60+20+d.t; const h = Math.floor(m/60)%24, mm = Math.floor(m%60); return `${String(h).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;};
const atClock = (d,t) => clock({phase:"shift",t});   // reviews talk about the night
// he only takes on a rung he's reached, once he's seen it done (or has most of a runbook)
const canDo = (pr,sk) => unlocked(pr,sk) && (pr.sk[sk].xp>=15 || pr.sk[sk].doc>=BASE);
const canBotfix = pr => pr.botSeen && pr.sk.patch.xp>=READY;
const goldOK = s => s.xp>=40 || s.doc>=DOC_MAX-1e-6;
const avgP = pr => SK.reduce((a,k) => a+pr.sk[k].xp/100, 0)/SK.length;
const avgDoc = pr => SK.reduce((a,k) => a+rb(pr.sk[k]), 0)/SK.length;
const judgment = pr => clamp(0.25+0.45*avgP(pr)+0.15*avgDoc(pr)+0.2*pr.conf/100-pr.stress/250, 0.05, 0.95);
// on his own (detached, or at night) he gets his baseline; with you right there he does better while he's new to it,
// and the difference fades as he gets good: by Confident it hardly matters whether you're watching
const BASE_ODDS = {patch:0.38,ticket:0.44,fire:0.45,restore:0.36};
const SUP_BONUS = 0.24, SUP_FADE = 75;
const supBonus = s => SUP_BONUS*Math.max(0,1-s.xp/SUP_FADE);
function odds(pr,sk,sup=false){
  const s = pr.sk[sk], p = s.xp/100;
  return clamp(BASE_ODDS[sk]+(0.88-BASE_ODDS[sk])*p+(sup?supBonus(s):0)+0.14*rb(s)-Math.max(0,(pr.stress-50)/50)*0.18+(pr.conf-40)/100*0.06, 0.15, 0.96);
}
const speed = pr => (112+36*avgP(pr))*(pr.stress>80?1.1:1);

/* ==== Starting Day 2 ==== */
function start(){
  G.newRun();
  const S = S_();
  S.diff = "normal"; S.hardcore = false; S.noAI = true; G.BK.left = 0;   // no restore points: the night is the test
  S.d2 = {prog:freshProg(),snap:null,phase:"brief",t:0,acc:0,rs:1,tk:1,tries:SHIFTS.map(() => []),temp:mkTemp(480,H-24)};
  G.vpMail("Day 2 · 1 unread message","RE: RE: Teddy's Bright Smile Dental (they called back)","You (the unicorn)","Teddy's Bright Smile Dental, HR (re: temps)",`      <p>Hi,</p>
      <p>Remember <b>Teddy's Bright Smile Dental</b>? Your first client. They called. Again. I picked up this time.</p>
      <p>Turns out Teddy's has a second clinic. The <b>Eastside</b> one, across town, in a strip mall between a vape shop and a tax place. Its server closet never made the migration list, because nobody told us it existed. Your unicorn magic didn't reach it. The main clinic is in the cloud and quiet; this one has been falling over every night, and nobody there knows how any of it works. Funny, that.</p>
      <p>So this contract says the scary words: <b>sustainable without us.</b> They have exactly one temp left, <b>${NAME}</b>. The others quit. (We pay a fair wage, supposedly.) ${NAME} is now their whole IT department, nights included.</p>
      <ol>
        <li><b>Hand over.</b> You get about an hour and a half with ${NAME} before each night shift. Start him on the easy stuff. Show him, let him try, write it down, fix what keeps breaking, and keep the place running while you do. You won't get to all of it.</li>
        <li><b>Go home.</b> He runs the night. You sleep. (He doesn't. He shadows you all day, works all night, and runs on the hallway coffee. We don't ask.) If he calls, you can pick up, but every call means it isn't sustainable yet.</li>
        <li><b>Come back in the morning.</b> Whatever broke overnight is still broken. Fix it, teach him the next thing, try again.</li>
        <li><b>Five nights at Teddy's.</b> The first few will go badly. That's fine. If he gets through the month-end close on night five, we stop billing them. I mean: they're self-sufficient. Good for them.</li>
      </ol>
      <p>If ${NAME} quits or the place falls over, that's on us. Well. You.</p>`,"d2go","Meet Doug","Lift &amp; Shift AI Consulting Ltd.","Sent from my phone. Please excuse brevity, typos and unreasonable expectations.");
}
// the room as it is at the start of a handover; the night picks up exactly where the handover left it
function buildRoom(d){
  const S = S_();
  S.racks = Array(12).fill(null); S.tierTot = {};
  for (const [slot,name,tier,m,f] of ROOM){S.racks[slot] = {name,heavy:0,tier,licBase:0,slot,maxT:m,timer:m*f,fire:0,spreadT:3,down:false,prog:0,hidden:false,lic:0,covered:false}; S.tierTot[tier] = (S.tierTot[tier]||0)+1;}
  Object.assign(S,{cloud:Array(16).fill(null),pipe:[],carry:null,wave:[],tk:[{age:0}],em:[],atk:[],st:[],sp:[],fl:[],fx:[],temp:null,mgr:null,agent:null,cbots:[],
    errMax:ERR,err:ERR,security:100,alert:false,frozen:false,freezeT:0,freezeIncident:false,freezeCooldown:0,escT:null,tkT:3,emT:1e9,stT:4,spT:1e9,time:0,window:0,focus:0,pizza:null,
    totalApps:ROOM.length,lz:0,energy:70,upgrades:{portal:d.prog.tools.portal?2:0}});
  S.bots = d.prog.tools.bot ? [mkBot("patch")] : [];
}
// what a handover starts from, so "Redo this handover" can put the room back exactly
const roomSnap = S => ({energy:S.energy,racks:clone(S.racks),tk:S.tk.length,bots:S.bots.map(b => ({x:b.x,y:b.y,stuck:b.stuck==null?null:b.stuck,fire:b.fire||0}))});
function roomRestore(S,r){
  S.racks = clone(r.racks); S.tk = Array.from({length:r.tk},() => ({age:0}));
  S.bots = r.bots.map(o => Object.assign(mkBot("patch"),o));
  if (r.energy!=null) S.energy = r.energy;
  Object.assign(S,{atk:[],st:[],fl:[],fx:[],escT:null,alert:false,frozen:false,freezeT:0,freezeIncident:false,freezeCooldown:0,tkT:3,errMax:ERR,err:ERR,security:100});
}
function morning(S,d){
  // the night's mess is still there: same racks, same queue, a bot still stuck where it got stuck
  Object.assign(S,{fl:[],fx:[],atk:[],errMax:ERR,err:ERR,security:100,freezeT:0,freezeIncident:false,freezeCooldown:0,tkT:3});   // your energy is whatever last night's sleep left you
  S.racks.forEach(a => {if (a) a.prog = 0;});
  if (d.prog.tools.bot && !S.bots.length) S.bots = [mkBot("patch")];
}
// how: fresh (day one), morning (after a night), redo (this handover again, exactly as it started)
function beginPrep(how="fresh",talkedBack=false){
  const S = S_(), d = D(), pr = d.prog;
  if (how==="fresh") buildRoom(d); else if (how==="redo") roomRestore(S,d.room); else morning(S,d);
  if (talkedBack) S.energy = Math.max(0,S.energy-TALK_BACK);   // early-morning phone call, the other way round this time
  d.talkedBack = talkedBack || (how==="redo" && d.talkedBack);
  d.snap = clone(pr); d.room = roomSnap(S);
  Object.assign(d,{phase:"prep",t:0,acc:0,rs:7001+pr.shift*131,tk:PREP_TK,head:100,last:null,taught:Object.fromEntries(SK.map(k => [k,0])),lessons:[],headLow:false,headOut:false,solo:false,toldLater:{},fired:{},reopen:[],call:null,pending:null,ff:false,fixWas:false,toldStuck:false});
  const P = S.p; Object.assign(P,{x:480,y:300,stun:0,heldBy:null,userImm:2,ghost:0,boost:0});
  S.users.forEach(u => {u.hunter = false; u.gone = false;});
  const T = d.temp = mkTemp(480,H-24);
  const mess = morningMess(S);
  say(T, d.talkedBack ? "back" : !pr.shift ? "hi0" : mess.length ? "morning" : "hiN", 3.5);
  play();
  toast(`🧑‍🏫 Day ${pr.shift+1} of ${DAYS}: handover before ${NAME}'s ${SHIFTS[pr.shift].name}. You leave at 18:00.`);
  if (pr.shift && mess.length) toast(`☀️ Overnight: ${mess.join(", ")}.`);
  if (d.talkedBack) toast(`📞 06:10: you talked ${NAME} back in. He's back. He wants it noted that he's doing you a favour. It cost you sleep (⚡−${TALK_BACK}).`);
  const lots = SK.filter(k => expOf(pr,k)>=1);
  if (pr.shift && lots.length) toast(`📝 ${NAME} has things to add to the runbooks from last night (${lots.map(k => `${SKILL[k].name.toLowerCase()} ✎${Math.floor(expOf(pr,k))}`).join(", ")}). Walk him to one and press Space: he writes up what he's learned, and that's how it sticks. It takes him a while, so keep the floor going.${lots.some(k => pr.sk[k].doc<BASE)?" Runbooks with nothing in them need your first version (hold E) before he can add to them.":""}`);
  if (!pr.shift) setTimeout(() => {if (D() && D().phase==="prep") toast(`👀 Start with patching: patch a few with ${NAME} next to you, then press Space at one and let him try while you watch.`);}, 2600);
}
function morningMess(S){
  const r = S.racks.filter(Boolean), out = [], down = r.filter(a => a.down).length, fire = r.filter(a => a.fire>0).length, sb = S.bots.find(b => b.stuck!=null);
  if (down) out.push(`${down} server${down>1?"s":""} still down`);
  if (fire) out.push(`${fire} on fire`);
  if (S.bots.some(b => b.fire>0)) out.push("Patch Bot on fire");
  else if (sb) out.push(`Patch Bot stuck on ${S.racks[sb.stuck].name}`);
  if (S.tk.length>=3) out.push(`${S.tk.length} tickets waiting`);
  return out;
}

/* ==== Handover: stations you hold E at ==== */
const stationDone = (pr,k) => k.startsWith("doc:") ? pr.sk[k.slice(4)].doc>=BASE : k==="bot" ? pr.tools.bot : pr.tools.portal;
function stations(){
  const d = D(), pr = d.prog, out = [];
  for (const k of SK) out.push({st:"doc:"+k,pos:DOCS[k],r:28,need:DOC_T,have:pr.sk[k].doc/BASE*DOC_T,
    info:`write the first version of the ${SKILL[k].short} runbook`,short:`${SKILL[k].short} runbook`,word:"WRITE"});
  out.push({st:"bot",pos:BOTSPOT,r:40,need:BOT_T,have:pr.work.bot,info:"get Patch Bot working (unplugged since Day 1; it's a job)",short:"set up Patch Bot",word:"SETUP"});
  out.push({st:"portal",pos:PORTAL,r:34,need:TOOL_T,have:pr.work.portal,info:"fix the Self-Service Portal (it auto-approves everything)",short:"fix the portal",word:"FIX"});
  return out.filter(o => !stationDone(pr,o.st));
}
// a stuck Patch Bot: you're not patching the server, you're patching the bot (it learns the case and finishes the job)
function botStations(){
  const pr = D().prog;
  return S_().bots.filter(b => b.fire>0 || b.stuck!=null).map(b => b.fire>0
    ? {st:"botfire",b,pos:{x:b.x,y:b.y},r:30,need:BOTFIRE_T,have:b.fireP||0,info:"put out Patch Bot (it caught fire on a case it doesn't know)",short:"put out Patch Bot",word:"DOUSE"}
    : {st:"botfix",b,pos:{x:b.x,y:b.y},r:30,need:BOTFIX_T,have:b.fixP||0,
    info:`teach Patch Bot the case it's stuck on (it gets ${pct(pr.botOk)} right now)`,short:"teach Patch Bot",word:"TEACH"});
}
// fix targets offered to the game's fixTarget (only while handing over)
function targets(P){
  const d = D(); if (!d || d.phase!=="prep") return [];
  return [...stations(),...botStations()].map(o => ({...o,d:dist(P,o.pos)})).filter(o => o.d<o.r).map(o => ({kind:"d2",st:o.st,b:o.b,pos:o.pos,key:"d2"+o.st,need:o.need,d:o.d,word:o.word,
    info:`Hold E: ${o.info} (${Math.max(0,o.need-o.have).toFixed(1)}s, free)`,warn:`Hold E: ${o.short}`}));
}
// one frame of holding E at a station; returns progress in seconds
function work(f,dt){
  const d = D(), pr = d.prog, T = d.temp;
  let have;
  if (f.st==="botfire"){const b = f.b; b.fireP = (b.fireP||0)+dt; have = b.fireP; S_().botExt = {b,t:S_().t};
    if (have>=f.need-1e-6){b.fire = 0; b.fireP = 0; sfx("fireOut"); fl({x:b.x,y:b.y-20},"Patch Bot: fire out",C.ok); did("fire");} return have;}   // he can learn firefighting from this too
  if (f.st==="botfix"){const b = f.b; b.fixP = (b.fixP||0)+dt; have = b.fixP; if (have>=f.need-1e-6){b.fixP = 0; teachBot(b,"you");} return have;}
  if (f.st.startsWith("doc:")){const s = pr.sk[f.st.slice(4)]; s.doc = Math.min(BASE,s.doc+dt/DOC_T*BASE); have = s.doc/BASE*DOC_T;
    if (s.doc>=BASE-1e-9){s.doc = Math.max(s.doc,BASE); sfx("sent"); fl(f.pos,`📄 ${SKILL[f.st.slice(4)].name} runbook: first version (50%)`,C.ok);
      if (dist(T,S_().p)<WATCH_R) say(T,"Ooh, a runbook. I can add to that. Once I know what I'm doing.");}}
  else {pr.work[f.st] = Math.min(f.need,pr.work[f.st]+dt); have = pr.work[f.st];
    if (have>=f.need-1e-6) finishStation(f.st);}
  return have;
}
function finishStation(k){
  const S = S_(), d = D(), pr = d.prog;
  if (k==="bot"){pr.tools.bot = true; const b = mkBot("patch"); b.x = BOTSPOT.x; b.y = BOTSPOT.y; S.bots.push(b); sfx("buy"); fl(BOTSPOT,"🤖 Patch Bot online",C.ok);
    toast("🤖 Patch Bot is back. It gets about half its patches right. When it hits a case it doesn't know, it gets stuck on that server until someone teaches it.");}
  else if (k==="portal"){pr.tools.portal = true; S.upgrades.portal = 2; sfx("buy"); fl(PORTAL,"🙋 Portal fixed",C.ok); toast("🙋 The portal stopped auto-approving everything. Users reset their own passwords: about 28% fewer tickets.");}
}

/* ==== Patch Bot: stuck until taught ==== */
const botOdds = () => D().prog.botOk;
function botFail(b,a){
  const d = D();
  b.stuck = a.slot; b.tgt = null; b.work = 0; b.flash = 1.5; b.fixP = 0; b.fire = BOTFIRE0; b.fireP = 0; sfx("fireStart");
  fl(RACKS[a.slot],"🤖🔥 Patch Bot caught fire",C.danger,1);
  if (d.st && d.phase==="shift") d.st.stuck++;
  if (!d.toldStuck){d.toldStuck = true; toast(`🤖🔥 Patch Bot hit a case it doesn't know on ${a.name} and caught fire. The server's fine; the bot isn't. Put it out (hold E at it), then teach it the case (hold E again). It'll get that kind right more often after.`);}
}
// true while it's stuck: it stays put at that server. Patched by hand or knocked over, it gives up on it (and learned nothing)
function botStuck(b,dt=0){
  if (b.fire>0){b.fire = Math.min(100,b.fire+BOTFIRE_GROW*dt); b.flash = Math.max(b.flash,0.3); return true;}   // on fire: it does nothing else
  if (b.stuck==null) return false;
  const a = S_().racks[b.stuck];
  if (!a || a.down || !patchDue(a)){b.stuck = null; b.fixP = 0; return false;}
  b.flash = Math.max(b.flash,0.3); return true;
}
function teachBot(b,who){
  const S = S_(), d = D(), pr = d.prog, a = S.racks[b.stuck], T = d.temp;
  pr.botOk = Math.min(BOT_MAX,pr.botOk+(who==="you"?BOT_LEARN:BOT_LEARN_DOUG));
  b.stuck = null; b.fixP = 0; if (a){applyPatch(a); fl(RACKS[a.slot],`🤖 Learned it: now ${pct(pr.botOk)}`,C.ok);}
  sfx("buy");
  if (who==="you" && T && !T.tgt && dist(T,S.p)<WATCH_R && !pr.botSeen){pr.botSeen = true; say(T,"robot",3);
    if (pr.sk.patch.xp<READY) toast(`🤖 ${NAME} saw how you teach the bot. Once his patching is Practiced, he can do it himself.`);}
  if (who!=="you" && d.st && d.phase==="shift") d.st.botTaught++;
}

/* ==== Teaching ==== */
function lesson(d,sk,how,ok){
  const pr = d.prog, s = pr.sk[sk], T = d.temp;
  if (d.head<=0){if (!d.headOut){d.headOut = true; say(T,"empty",3);} fl({x:T.x,y:T.y-26},"🧠 Head full: nothing stuck",C.muted,2); return;}
  const cost = (how==="demo"?HEAD_DEMO:HEAD_TRY)+(d.last&&d.last!==sk?HEAD_SWITCH:0);
  const eff = d.head/100;   // what's left of today's head space is how much of this lesson sticks
  d.head = Math.max(0,d.head-cost); d.last = sk; d.taught[sk]++;
  const gain = how==="demo" ? 11*eff*Math.max(0,1-s.xp/DEMO_CAP) : (ok?17:9)*eff*(1-s.xp/105);
  const before = level(s.xp), was = SK.filter(k => unlocked(pr,k)); s.xp = Math.min(100,s.xp+gain);
  d.lessons.push({sk,how,ok,gain});
  if (how==="try") pr.conf = clamp(pr.conf+(ok?5:-1),0,100);
  fl({x:T.x,y:T.y-26},`🧠 +${Math.max(1,Math.round(gain))} ${SKILL[sk].name.toLowerCase()}${gain<3?" (not much stuck)":""}`,TEAL,2);
  if (level(s.xp)>before) toast(`🧑‍🏫 ${NAME}'s ${SKILL[sk].short}: ${LEVELS[level(s.xp)][1]}.`);
  for (const k of SK) if (!was.includes(k) && unlocked(pr,k)) toast(`🔓 ${NAME} is ready to learn ${SKILL[k].short}.`);
  if (d.head<35 && !d.headLow){d.headLow = true; say(T,"full",3.2); toast(`🧠 ${NAME}'s head is nearly full. Lessons stick less, and at empty nothing new goes in until tomorrow. Runbooks, tools and his own write-ups don't need head space.`);}
}
// a job you finished by hand (from the game's doFix): if he was watching, that's a demonstration
function did(kind){
  const S = S_(), d = D(); if (!d || d.phase!=="prep") return;
  const T = d.temp; if (d.solo || T.tgt || T.quit || dist(T,S.p)>WATCH_R) return;
  const sk = SKILL_OF[kind];
  if (!unlocked(d.prog,sk)){if (!d.toldLater[sk]){d.toldLater[sk] = 1; say(T,"later",3); fl({x:T.x,y:T.y-26},`Not ready for ${SKILL[sk].short}: ${needText(sk)} first`,C.muted,2);} return;}
  lesson(d,sk,"demo",true);
  gainExp(d.prog,sk,EXP_JOB);   // what he watched you do is something for the runbook too
  if (T.sayT<=0.5) say(T,"watch");
}
// Space in the handover: hand the job you're standing at to him, and stay close to supervise
// the runbook you're standing at, if he has something to add to it (it needs your first version, and a 100% one is done)
const canAdd = (pr,k) => expOf(pr,k)>=1 && pr.sk[k].doc>=BASE && pr.sk[k].doc<DOC_MAX-1e-6;
const noteAt = (pr,P) => SK.find(k => canAdd(pr,k) && dist(P,DOCS[k])<30);
function coach(){
  const S = S_(), d = D(); if (d && d.phase==="shift"){if (d.call) answer(); return;}   // at night Space (or GRAB) picks up the phone
  if (!d || d.phase!=="prep") return;
  const T = d.temp, f = S.fix, nk = noteAt(d.prog,S.p);
  if (nk){if (T.tgt){fl({x:T.x,y:T.y-30},`${NAME} is busy`,C.muted,2); return;}
    T.tgt = {kind:"note",sk:nk,u:0,total:expOf(d.prog,nk),dDoc:0,dXp:0}; T.work = T.need = 0; say(T,"note");
    fl({x:S.p.x,y:S.p.y-26},`📝 Write it up, ${NAME}`,TEAL,2); return;}
  if (T.tgt && T.tgt.kind==="note"){   // writing at the wiki: Space anywhere calls him back (to the job you're at, if he can try it)
    d.solo = false; doneWriting(d,T,T.tgt,true);
    if (!coachable(f)){fl({x:S.p.x,y:S.p.y-26},`🙋 ${NAME}, with me`,TEAL,2); return;}}
  if (!f){d.solo = !d.solo;
    if (d.solo){say(T,"solo"); fl({x:S.p.x,y:S.p.y-26},`🚶 ${NAME} is on his own`,TEAL,2);}
    else {if (T.tgt && T.tgt.solo){T.tgt = null; T.work = T.need = 0;} say(T,"recall"); fl({x:S.p.x,y:S.p.y-26},`🙋 ${NAME}, with me`,TEAL,2);}
    return;}
  if (T.tgt && T.tgt.solo){T.tgt = null; T.work = T.need = 0;}   // a job you point him at beats whatever he picked himself
  if (T.tgt){fl({x:T.x,y:T.y-30},`${NAME} is busy`,C.muted,2); return;}
  if (f.kind==="d2" && f.st==="botfire"){
    if (!unlocked(d.prog,"fire")){say(T,"later"); return;}
    if (!canDo(d.prog,"fire")){say(T,"show"); return;}
    d.solo = false; T.tgt = {kind:"botfire",b:f.b,a:null,u:0,sup:true}; T.work = T.need = 0; say(T,"tryIt");
    fl({x:S.p.x,y:S.p.y-26},`🧑‍🏫 Your turn, ${NAME}`,TEAL,2); return;
  }
  if (f.kind==="d2" && f.st==="botfix"){
    if (!canBotfix(d.prog)){say(T,d.prog.botSeen?"later":"show"); return;}
    d.solo = false; T.tgt = {kind:"botfix",a:S.racks[f.b.stuck],b:f.b,u:0,sup:true}; T.work = T.need = 0; say(T,"tryIt");
    fl({x:S.p.x,y:S.p.y-26},`🧑‍🏫 Your turn, ${NAME}`,TEAL,2); return;
  }
  if (f.kind==="d2"){say(T,"stuff"); return;}
  if (!SKILL_OF[f.kind]) return;
  const sk = SKILL_OF[f.kind];
  if (!unlocked(d.prog,sk)){say(T,"later"); fl({x:T.x,y:T.y-26},`Not ready: ${needText(sk)} first`,C.muted,2); return;}
  if (!canDo(d.prog,sk)){say(T,"show"); return;}   // show him a couple of times before he tries it himself
  d.solo = false; T.tgt = {kind:f.kind,a:f.a||null,u:0,sup:true}; T.work = 0; T.need = 0; say(T,"tryIt");
  fl({x:S.p.x,y:S.p.y-26},`🧑‍🏫 Your turn, ${NAME}`,TEAL,2);
}
const coachable = f => {const pr = D().prog; return !!f && (f.kind==="d2" ? (f.st==="botfix" && canBotfix(pr)) || (f.st==="botfire" && canDo(pr,"fire")) : !!SKILL_OF[f.kind] && canDo(pr,SKILL_OF[f.kind]));};
// what Space does where you stand: [INFO hint, WARN hint, touch word]
const coachHint = () => {const S = S_(), d = D(); if (!d || d.phase!=="prep") return null;
  const T = d.temp, free = !T.tgt || T.tgt.solo;
  const nk = free && noteAt(d.prog,S.p), n = nk && expOf(d.prog,nk);
  if (nk) return [`Space: ${NAME} adds what he's learned to the ${SKILL[nk].short} runbook (✎${Math.floor(n)}, about ${Math.ceil(n*WRITE_PER)}s)`,`Space: ${NAME} adds to it`,"COACH"];
  if (T.tgt && T.tgt.kind==="note") return coachable(S.fix) ? [`Space: ${NAME} stops writing and tries this one`,`Space: ${NAME} tries this`,"COACH"] : [`Space: call ${NAME} back (he stops writing; what he's written stays, the rest he can add later)`,`Space: call ${NAME} back`,"RECALL"];
  if (!S.fix) return d.solo ? [`Space: call ${NAME} back (he follows you again, and learns)`,`Space: call ${NAME} back`,"RECALL"]
    : [`Space: send ${NAME} off on his own (he covers what he can, but his skills stop growing)`,`Space: ${NAME} goes solo`,"SOLO"];
  return free && coachable(S.fix) ? [`Space: let ${NAME} try this one (stay close to supervise)`,`Space: ${NAME} tries`,"COACH"] : null;};

/* ==== Doug doing a job (handover practice and the night shift share this) ==== */
function valid(t){
  const S = S_();
  if (t.kind==="ticket") return S.tk.length>0;
  if (t.kind==="coffee") return S.st.includes(t.s);
  if (t.kind==="note") return canAdd(D().prog,t.sk) || (t.total>0 && expOf(D().prog,t.sk)>0 && D().prog.sk[t.sk].doc<DOC_MAX-1e-6);
  if (t.kind==="botfire") return S.bots.includes(t.b) && t.b.fire>0;
  if (t.kind==="botfix") return S.bots.includes(t.b) && !!t.a && t.b.stuck===t.a.slot && !(t.b.fire>0);
  const a = t.a; if (!a || S.racks[a.slot]!==a || a.hidden) return false;
  if (t.kind==="fire") return a.fire>0;
  if (t.kind==="restore") return a.down;
  return !a.down && a.fire===0 && patchDue(a);
}
const spot = t => t.kind==="botfire" ? {x:t.b.x+26,y:t.b.y+8} : t.kind==="note" ? {x:DOCS[t.sk].x,y:DOCS[t.sk].y+40} : t.kind==="ticket" ? {x:DESK.x+40,y:DESK.y-44} : t.kind==="coffee" ? t.s : {x:RACKS[t.a.slot].x,y:RACKS[t.a.slot].y+44};
function needFor(pr,t){
  const s = pr.sk[SKILL_OF[t.kind]], p = s.xp/100;
  const base = t.kind==="patch" ? 1.3 : t.kind==="botfix" ? 2.2 : t.kind==="ticket" ? 0.95 : TIER[t.a.tier].restore;
  return base*(1.9-0.9*p)*(1-0.15*rb(s))*(pr.conf<25?1.2:1)*(t.guided?0.8:1);
}
function runTask(d,T,dt,how){
  const S = S_(), pr = d.prog, t = T.tgt;
  if (!valid(t)){if (t.sup && t.kind!=="ticket") say(T,"Oh. Never mind, it's done."); T.tgt = null; T.work = T.need = 0; return;}
  const p = spot(t);
  if (!goTo(T,p.x,p.y,speed(pr),dt)){doorCross(T,false); return;}
  if (t.kind==="coffee"){S.st = S.st.filter(x => x!==t.s); pr.stress = Math.max(0,pr.stress-18); pr.conf = Math.min(100,pr.conf+2); T.breakCd = 25; d.st && d.st.coffee++; say(T,"coffee"); sfx(t.s.kind==="coffee"?"coffee":"donut"); T.tgt = null; return;}
  if (t.kind==="note"){writeUp(d,T,t,dt); return;}
  const sk = SKILL_OF[t.kind], s = pr.sk[sk];
  if (t.kind==="botfire"){
    const r = (16+30*s.xp/100)*(1+0.25*rb(s))*(t.guided?1.3:1);
    t.b.fire -= r*dt; T.ext = {bot:t.b,t:S.t};
    if (t.b.fire<=0){t.b.fire = 0; t.b.fireP = 0; sfx("fireOut"); fl({x:t.b.x,y:t.b.y-20},`${NAME}: Patch Bot's out`,C.ok); finish(d,T,t,true,how);}
    return;
  }
  if (t.kind==="fire"){
    const r = (16+30*s.xp/100)*(1+0.25*rb(s))*(t.guided?1.3:1);
    t.a.fire -= r*dt; T.ext = {a:t.a,t:S.t};
    if (t.a.fire<=0){t.a.fire = 0; sfx("fireOut"); fl(RACKS[t.a.slot],`${NAME}: fire out`,C.ok); finish(d,T,t,true,how);}
    return;
  }
  if (!T.need) T.need = needFor(pr,t);
  T.work += dt; if (T.work<T.need) return;
  const watched = !!t.sup && dist(T,S.p)<SUP_R;   // you're right there
  const ok = !!t.guided || Math.random()<odds(pr,sk,watched);
  if (t.sup && !ok && dist(T,S.p)<SUP_R){  // you were right there: the mistake gets caught before it does damage
    fl(spot(t),"✋ Caught it",C.amber,2); say(T,"caught"); lesson(d,sk,"try",false); T.work = 0; T.need = 0; T.tgt = null; return;
  }
  const a = t.a;
  if (t.kind==="botfix"){
    if (ok){teachBot(t.b,"doug"); fl(RACKS[a.slot],`${NAME} taught the bot`,C.ok);}
    else fl(RACKS[a.slot],`${NAME}: the bot's still confused`,C.amber,1);
  } else if (t.kind==="patch"){
    if (ok){applyPatch(a); sfx("patch"); fl(RACKS[a.slot],`${NAME}: patched`,C.ok);}
    else if (Math.random()<0.68-0.53*s.xp/100){   /* new and on his own, a bad patch often takes the server down */a.down = true; a.fire = 0; a.downT = S.time; a.prog = 0; S.ss.lost++; sfx("offline"); fl(RACKS[a.slot],"OFFLINE",C.danger); toast(`🧑‍💼 ${NAME} patched ${a.name}... and took it offline.`);}
    else fl(RACKS[a.slot],`${NAME}: patch didn't take`,C.amber,1);
  } else if (t.kind==="restore"){
    if (ok){sfx("online"); noteRestored(a); a.down = false; a.timer = Math.max(a.timer,a.maxT*0.5); fl(RACKS[a.slot],`${NAME}: back online`,C.ok);}
    else fl(RACKS[a.slot],`${NAME}: still won't come up`,C.amber,1);
  } else {
    S.tk.shift(); sfx("closed");
    if (ok) fl(DESK,`${NAME} closed a ticket`,C.ok);
    else {d.reopen.push(S.time+8); fl(DESK,`${NAME} "closed" a ticket`,C.amber,1);}
  }
  finish(d,T,t,ok,how);
}
// Doug at the wiki, adding what he's learned to a runbook you started: everything he's done since he last wrote it up,
// slower than you write, no head space (it's his own experience), and it's how the experience sinks in. The more he's
// done, the more he adds, up to 100%. If you leave first, what he's written stays.
function writeUp(d,T,t,dt){
  const pr = d.prog, k = t.sk, s = pr.sk[k];
  if (!t.began){t.began = true; t.lv = level(s.xp); t.open = SK.filter(x => unlocked(pr,x));}
  const use = Math.min(expOf(pr,k),dt/WRITE_PER);
  pr.exp[k] = Math.max(0,expOf(pr,k)-use);
  const dd = Math.min(DOC_MAX-s.doc,use*EXP_DOC*Math.max(0.35,(DOC_MAX-s.doc)/(DOC_MAX-BASE)));
  s.doc += dd; if (DOC_MAX-s.doc<0.004) s.doc = DOC_MAX;
  const dx = unlocked(pr,k) ? use*EXP_XP*(1-s.xp/105) : 0; s.xp = Math.min(100,s.xp+dx);
  t.dDoc += dd; t.dXp += dx; T.need = t.total*WRITE_PER; T.work = (t.total-expOf(pr,k))*WRITE_PER;
  if (expOf(pr,k)>0.001 && s.doc<DOC_MAX) return;
  if (s.doc>=DOC_MAX || expOf(pr,k)<=0.001) pr.exp[k] = 0;   // all written (or as good as a runbook gets; the rest stays in his head)
  doneWriting(d,T,t,false);
}
// he puts the pen down: finished, or called back part way (what he's written stays written, the rest he can add later)
function doneWriting(d,T,t,stopped){
  const pr = d.prog, k = t.sk, s = pr.sk[k];
  if (t.dDoc>0 || t.dXp>0) pr.conf = clamp(pr.conf+(stopped?1:3),0,100);
  T.tgt = null; T.need = T.work = 0;
  if (t.dDoc>0.0005){sfx("sent"); fl(DOCS[k],`📝 ${SKILL[k].name} runbook ${pct(s.doc)} (+${Math.max(1,Math.round(t.dDoc*100))})${t.dXp>=1?` · 🧠 +${Math.round(t.dXp)}`:""}${stopped?" · stopped":""}`,C.ok);}
  if (t.began && level(s.xp)>t.lv) toast(`🧑‍🏫 ${NAME}'s ${SKILL[k].short}: ${LEVELS[level(s.xp)][1]}.`);
  if (t.began) for (const x of SK) if (!t.open.includes(x) && unlocked(pr,x)) toast(`🔓 ${NAME} is ready to learn ${SKILL[x].short}.`);
  say(T,stopped?"recall":"noted");
}
// everything he does is something he can write up later; mistakes and calls teach the most
const gainExp = (pr,k,n) => {pr.exp = pr.exp || {}; if (pr.sk[k].doc>=DOC_MAX-1e-6){pr.exp[k] = 0; return;}   // a finished runbook has nothing left to add
  pr.exp[k] = Math.min(EXP_CAP,expOf(pr,k)+n);};
function finish(d,T,t,ok,how){
  const pr = d.prog, sk = SKILL_OF[t.kind], s = pr.sk[sk];
  T.tgt = null; T.work = T.need = 0;
  gainExp(pr,sk,t.guided ? EXP_CALL : ok ? EXP_JOB : EXP_FAIL);   // every job he does is something for the runbook, on his own included
  if (how==="solo"){if (!ok) say(T,"fail"); return;}   // on his own in the handover: he covers the floor, but no skill sticks
  if (how==="prep" && t.sup){lesson(d,sk,"try",ok); if (ok) say(T,"tryOk"); return;}
  // learning by doing, on his own: slower than a lesson, but it doesn't use up head space
  s.xp = Math.min(100,s.xp+(t.guided?8:ok?3:1.5)*(1-s.xp/105));
  pr.conf = clamp(pr.conf+(ok?3:-7),0,100);
  pr.stress = clamp(pr.stress+(ok?(t.kind==="restore"&&t.a.tier==="gold"?-10:-4):7),0,100);
  if (d.st){const j = d.st.jobs[sk]; j[ok?0:1]++; if (t.guided) d.st.guidedJobs++;}
  if (t.guided) say(T,"guided");
  else if (!ok) say(T,"fail");
  else if (T.sayT<=0 && lr()<0.5) say(T, s.doc>0 && s.doc<DOC_MAX-1e-6 && lr()<0.5 ? "partDoc" : s.doc>=DOC_MAX-1e-6 && lr()<0.4 ? "doc" : "ok");
}

/* ==== The handover, tick by tick ==== */
function events(d,list){
  const S = S_(), pr = d.prog;
  for (const k in ISSUES){
    for (const at of list[k]||[]) if (d.t>=at && !d.fired[k+at]){d.fired[k+at] = 1;
      const a = S.racks[ISSUES[k].slot]; if (!a || a.down || a.fire>0) continue;
      if (k==="psu"){a.down = true; a.fire = 0; a.downT = S.time; a.prog = 0; S.ss.lost++; sfx("offline"); fl(RACKS[a.slot],"OFFLINE",C.danger); toast(`⚡ ${a.name} fell over. Old hardware does that.`);}
      else {a.fire = 24; a.spreadT = 3; sfx("fireStart"); toast(`🔥 ${a.name} overheated. It's on fire.`);}
      if (d.st) d.st[k]++;}}
}
function tickPrep(d,T,dt){
  const S = S_(), P = S.p;
  events(d,PREP_EVENTS);
  if (S.err<1) S.err = 1;   // the handover can't get you fired; what you leave behind is his problem tonight
  if (d.t>=PREP_LEN && !d.pending){d.pending = "handover"; return;}
  d.prog.stress = Math.max(0,d.prog.stress-0.5*dt);
  if (T.tgt){T.watching = false; runTask(d,T,dt,T.tgt.solo?"solo":"prep"); return;}
  if (d.solo){T.watching = false;
    const {best} = choose(d,T);
    if (best){T.tgt = {...best,solo:true}; T.work = T.need = 0; return;}
    goTo(T,470,420,60,dt); doorCross(T,false); return;}
  const f = S.fix, busy = f && (S.fixP>0 || keys.fix) && (SKILL_OF[f.kind] || (f.kind==="d2" && (f.st==="botfix" || f.st==="botfire")));
  T.watching = !!busy && dist(T,P)<WATCH_R;
  if (dist(T,P)>58){const side = P.x<480 ? 1 : -1; goTo(T,P.x+side*34,P.y+30,150,dt); doorCross(T,false);}
  T.chatT -= dt; if (T.chatT<=0){T.chatT = 9+lr()*6; if (!T.watching && T.sayT<=0) say(T,"idle");}
}

/* ==== The night shift: Doug on his own ==== */
function tasks(){
  const S = S_(), out = [];
  const botUp = S.bots.some(b => b.kind==="patch" && !(b.fire>0) && b.stuck==null);   // a working Patch Bot gets first go at patches
  S.racks.forEach(a => {if (!a || a.hidden) return;
    if (a.fire>0) out.push({kind:"fire",a,u:100+a.fire*0.4});
    else if (a.down) out.push({kind:"restore",a,u:80+({gold:40,silver:15,bronze:0})[a.tier]});
    else if (patchDue(a) && !S.bots.some(b => b.stuck===a.slot || b.tgt===a)
      && !(botUp && a.timer/a.maxT>BOT_FIRST)) out.push({kind:"patch",a,u:15+75*(1-a.timer/a.maxT)});});
  for (const b of S.bots){
    if (b.fire>0) out.push({kind:"botfire",a:null,b,u:96});                                       // a burning robot is urgent
    else if (b.stuck!=null && S.racks[b.stuck]) out.push({kind:"botfix",a:S.racks[b.stuck],b,u:85});}   // and he'll call you about it
  if (S.tk.length){const q = S.tk.length/ticketLimit(); out.push({kind:"ticket",a:null,u:20+75*q*q});}
  return out;
}
const tkey = t => t.kind+(t.a?t.a.slot:"");
function choose(d,T){
  const S = S_(), pr = d.prog, jd = judgment(pr);
  let best = null, bs = -1e9, help = null;
  d.cantNow = false;
  const list = tasks();
  if (d.vm){const live = new Set(list.map(tkey)); for (const k in d.vm) if (!live.has(k)) delete d.vm[k];}   // that problem's gone: a new one can ring again
  for (const t of list){
    if ((T.cool[tkey(t)]||0)>S.time) continue;
    const sk = SKILL_OF[t.kind], s = pr.sk[sk], p = s.xp/100;
    let can = t.kind==="botfix" ? canBotfix(pr) : canDo(pr,sk);
    if (t.kind==="restore" && t.a.tier==="gold" && !goldOK(s)) can = false;
    if (!can){
      if (t.u>=60){if (unlocked(pr,sk) && (s.xp>=15 || s.doc>0)) d.cantNow = true;   // only work he's started learning and still can't handle eats at him
        const k = tkey(t)+"@"+Math.floor(S.time/20); if (d.st && d.phase==="shift" && !d.st.cantSeen[k]){d.st.cantSeen[k] = 1; d.st.cant[sk]++;}}
      const wing = pr.conf>=60 && unlocked(pr,sk) && t.kind!=="botfix" && !(t.a && t.a.tier==="gold");   // confident enough to wing a rung he's reached, never on gold
      if (!wing && t.u>=80 && !(d.vm && d.vm[tkey(t)]) && (!help || t.u>help.u)) help = t;   // anything he can't wing is worth a call, however confident he is
      if (!wing) continue;
      t.bold = true;
    }
    const comfort = can ? 1-(1-jd)*(1-(0.45+0.55*p)) : 0.5;
    const sc = t.u*comfort-dist(T,spot(t))*0.06*(1.2-jd)+(Math.random()*2-1)*14*(1-jd);
    if (sc>bs){bs = sc; best = t;}
  }
  return {best,help};
}
// what he asks when he calls: the thing in front of him
function question(t){
  const a = t.a, n = a && a.name;
  if (t.kind==="restore") return a.tier==="gold" ? `${n} is down. The GOLD one. What do I do?` : `${n} is down. How do I bring it back?`;
  if (t.kind==="fire") return `${n} is on fire. Like, actually on fire.`;
  if (t.kind==="patch") return `${n} needs a patch and I've never done one.`;
  if (t.kind==="botfire") return "Patch Bot is on fire. The robot. Is that normal?";
  if (t.kind==="botfix") return `Patch Bot's stuck at ${n}. Do I... talk to it?`;
  return "The ticket queue's full. Which one do I do first?";
}
function startCall(d,T,t){
  const tired = S_().energy<WAKE_MIN;   // decided when it starts ringing: catching up mid-ring doesn't wake you
  d.call = {t,left:CALL_T,ring:RING_EVERY,tired}; T.phone = true; say(T,question(t),CALL_T+0.5); sfx(tired?"phoneDull":"phone");
  d.st.callAbout[SKILL_OF[t.kind]] = (d.st.callAbout[SKILL_OF[t.kind]]||0)+1;
  toast(`📞 ${NAME} is calling you about ${t.b?"Patch Bot":t.a?t.a.name:"the tickets"}. Press E or Space to pick up. (That counts as stepping in.)`);
}
function answer(){
  const S = S_(), d = D(); if (!d || !d.call) return;
  if (d.call.tired || S.energy<WAKE_MIN) return;   // too tired: you sleep through it
  S.energy = Math.max(0,S.energy-CALL_COST);
  const T = d.temp, t = d.call.t; d.call = null; T.phone = false;
  d.st.calls++; d.callCd = S.time+6; d.prog.stress = Math.max(0,d.prog.stress-8); sfx("click");
  if (valid(t)){t.guided = true; T.tgt = t; T.work = T.need = 0; say(T,question(t),WAKE_T+1.6);
}
  else say(T,"Oh, it's fine now. Sorry. Bye!");
}
function tickShift(d,T,dt){
  const S = S_(), pr = d.prog, st = d.st;
  if (T.quit){if (goTo(T,480,H-8,140,dt) || T.y>=H-14 || d.t-st.quitT>3.5) d.pending = "review"; return;}
  events(d,SHIFTS[pr.shift]);
  if (d.t>=SHIFT_LEN){d.pending = "review"; return;}
  if (!wakeWhy(d)) S.energy = Math.min(100,S.energy+SLEEP_REGEN*dt);   // asleep (phone ringing or not): it comes back, slowly
  // tickets he "closed" without fixing come back
  d.reopen = d.reopen.filter(at => {if (S.time<at) return true; if (S.tk.length<ticketLimit()){S.tk.push({age:0}); st.reopened++; fl(DESK,"🎫 Reopened: it wasn't fixed",C.amber,1);} return false;});
  T.breakCd = Math.max(0,T.breakCd-dt);
  // stress: a full queue, things down or burning, and work he can't do; a quiet room lets it drain
  const q = S.tk.length/ticketLimit(), downs = S.racks.filter(a => a && a.down), down = downs.length, fires = S.racks.filter(a => a && a.fire>0).length+S.bots.filter(b => b.fire>0).length;
  const scare = Math.min(3,downs.reduce((s,a) => s+({gold:2.4,silver:1.1,bronze:0.6})[a.tier],0));   // a gold outage is scarier than a bronze one
  const mine = k => canDo(pr,k) ? 1 : 0.5;   // trouble nobody's shown him how to handle worries him, but it isn't on him yet
  const parts = {queue:1.4*q*q*mine("ticket"),incident:scare*mine("restore")+0.8*Math.min(2,fires)*mine("fire"),unknown:d.cantNow?1.0:0};
  for (const p in parts) parts[p] *= STRESS_RATE;
  let ds = parts.queue+parts.incident+parts.unknown;
  if (!down && !fires && q<0.4) ds -= 1.2;
  if (ds>0){const k = (1-0.35*pr.conf/100)*(1-0.25*avgDoc(pr)); ds *= k; for (const p in parts) st.sx[p] += parts[p]*k*dt;}
  pr.stress = clamp(pr.stress+ds*dt,0,100);
  st.peak = Math.max(st.peak,pr.stress);
  if (pr.stress>=100){T.quit = true; T.tgt = null; T.phone = false; d.call = null; st.quitT = d.t; sfx("quit");
    const why = S.racks.some(a => a && (a.down||a.fire>0)) && avgDoc(pr)<0.5 ? "I quit! Nobody wrote anything down." : "I quit! I'm going back to data entry.";
    say(T,why,4); toast(`🧑‍💼 ${NAME}: "${why}"`); return;}
  // a call rings until you pick up or it goes to voicemail; he stands there holding the phone
  if (d.call){
    d.call.left -= dt; d.call.ring -= dt; if (d.call.ring<=0 && d.call.left>0.3){d.call.ring = RING_EVERY; sfx(d.call.tired?"phoneDull":"phone");}
    if (d.call.left<=0){const t = d.call.t, hit = canDo(pr,SKILL_OF[t.kind]) ? 12 : 6; if (d.call.tired) st.slept++; d.call = null; T.phone = false; st.ignored++; st.sx.calls += hit;
      pr.stress = Math.min(100,pr.stress+hit); pr.conf = Math.max(0,pr.conf-4); T.cool[tkey(t)] = S.time+14; d.vm = d.vm || {}; d.vm[tkey(t)] = 1; say(T,"vm",3);   /* voicemail: he won't call about this one again */}
    return;
  }
  // a coffee break when it's getting to him and nothing's on fire
  if (!T.tgt && pr.stress>=60 && !down && !fires && T.breakCd<=0 && S.st.length){
    let s = null, bd = 1e9; for (const x of S.st){const dd = dist(x,T); if (dd<bd){bd = dd; s = x;}}
    T.tgt = {kind:"coffee",s,u:0};
  }
  // good judgment drops routine work when something important breaks
  T.replanT -= dt;
  if (T.tgt && T.tgt.u<70 && T.tgt.kind!=="coffee" && !T.tgt.guided && T.replanT<=0){T.replanT = 2;
    const {best} = choose(d,T); if (best && best.a && best.u>=80 && !best.bold && Math.random()<judgment(pr)){T.tgt = best; T.work = T.need = 0; say(T,`Dropping this. ${best.a.name} needs me!`);}}
  if (!T.tgt){
    const {best,help} = choose(d,T);
    if (help && (!best || best.u<help.u) && S.time>(d.callCd||0)){T.tgt = {kind:"ring",t:help,u:help.u}; T.work = T.need = 0; return;}   // walks over to it, then calls
    if (best){T.tgt = best; T.work = T.need = 0;
      const s = pr.sk[SKILL_OF[best.kind]];
      if (best.bold) say(T,"bold");
      else if (best.kind==="restore" && best.a.tier==="gold" && T.sayT<=0) say(T,s.doc>=DOC_MAX-1e-6?"doc":"Okay. The gold one. Breathe.");}
    else if (help && T.sayT<=0){say(T,help.a&&help.a.tier==="gold"?"gold":"noDoc");}
  }
  if (T.tgt && T.tgt.kind==="ring"){const t = T.tgt.t;
    if (!valid(t)){T.tgt = null; return;}
    const p = spot(t); if (!goTo(T,p.x,p.y,speed(pr),dt)){doorCross(T,false); return;}
    T.tgt = null; startCall(d,T,t); return;}
  if (T.tgt){runTask(d,T,dt,"shift"); return;}
  goTo(T,470,420,60,dt); doorCross(T,false);
  T.chatT -= dt; if (T.chatT<=0){T.chatT = 8+lr()*6; if (T.sayT<=0) say(T,pr.stress>55?"stress":"calm");}
}

/* ==== The game calls these ==== */
function tick(dt){
  const d = D(); if (!d) return;
  const T = d.temp; d.t += dt; if (T.sayT>0) T.sayT -= dt;
  if (d.phase==="prep") tickPrep(d,T,dt);
  else if (d.phase==="shift") tickShift(d,T,dt);
}
// the game's frame: a fixed step with Day 2's own seeded randomness, the night runs fast while you sleep, calls answered with E or Space
function frame(dt){
  const S = S_(), d = D();
  if (d.pending){const p = d.pending; d.pending = null; return p==="handover" ? handover() : review();}
  if (d.phase==="shift"){const f = !!keys.fix||tapE; tapE = false; if (d.call && f && !d.fixWas) answer(); d.fixWas = !!keys.fix;}
  const sp = d.phase==="shift" && asleep(d) ? SLEEP_FF : 1;
  d.acc += dt*sp; let n = 0;
  const real = Math.random; Math.random = rngOf(d);
  try {while (d.acc>=STEP && n<12){G.update(STEP); d.acc -= STEP; n++; if (G.mode!=="play" || d.pending || S!==S_() || (sp>1 && d.call)) break;}}
  finally {Math.random = real;}
  if (n>=12 || (sp>1 && d.call)) d.acc = 0;
  if (d.phase==="shift") eyes(d,dt);
}
// the night with your eyes shut: picking up the phone (or him walking out) wakes you, and once he's sorted you drift off again.
// Real time, not game time, and no randomness: it changes how fast the night plays, never what happens in it.
// The phone rings in the dark: your eyes stay shut until you pick up.
const wakeWhy = d => {const T = d.temp; return !!(T.quit || (T.tgt && T.tgt.guided));};
const asleep = d => d.eye<=0 && !d.call && !wakeWhy(d);
// opening your eyes after you pick up: a crack, a blink, a squint, another blink, then the room
const WAKE_KEYS = [[0,0],[0.45,0.16],[0.62,0.03],[1.25,0.34],[1.42,0.13],[WAKE_T,1]];
function wakeCurve(t){
  for (let i = 1; i<WAKE_KEYS.length; i++){const [t1,v1] = WAKE_KEYS[i], [t0,v0] = WAKE_KEYS[i-1];
    if (t<=t1){const k = (t-t0)/(t1-t0); return v0+(v1-v0)*k*k*(3-2*k);}}
  return 1;
}
// drifting off, the other way round: heavy lids, a flutter open, heavier, a last blink, gone
const SLEEP_KEYS = [[0,1],[0.7,0.5],[1.0,0.62],[1.7,0.18],[1.9,0.3],[CLOSE_T,0]];
const keyed = (keys,t) => {for (let i = 1; i<keys.length; i++){const [t1,v1] = keys[i], [t0,v0] = keys[i-1];
  if (t<=t1){const k = (t-t0)/(t1-t0); return v0+(v1-v0)*k*k*(3-2*k);}} return keys[keys.length-1][1];};
function eyes(d,dt){
  if (wakeWhy(d)) d.upT = STAY_UP; else d.upT = Math.max(0,d.upT-dt);
  if (d.upT>0){
    d.closeT = null;
    if (d.openT==null){if (d.eye<=0.02){d.openT = 0; d.zoomT = 0; d.wakes++;} else d.openT = WAKE_T;}   // from asleep: the slow version
    else d.openT += dt;
    d.eye = RM ? 1 : d.openT<WAKE_T ? wakeCurve(d.openT) : Math.min(1,d.eye+dt/0.3);
  } else {
    d.openT = null;
    if (d.closeT==null){d.closeT = 0; d.closeFrom = d.eye;} else d.closeT += dt;
    d.eye = RM ? 0 : d.closeFrom*keyed(SLEEP_KEYS,d.closeT);
  }
  d.zoomT += dt;
}
// soft focus: blurry as your eyes open, sharpening as they adjust; blurring again as they close
const blurNow = d => {if (RM) return 0;
  const waking = d.wakes ? Math.pow(1-clamp(d.zoomT/(WAKE_T+0.9),0,1),1.6)*7 : 0, closing = d.closeT!=null ? (1-d.eye)*5 : 0;
  return Math.max(waking,closing);};
// once the phone has woken you, you're watching him on the security camera: close up on him, wherever he goes
const remote = d => d.wakes>0;
const zoomNow = d => remote(d) ? ZOOM : 1;
const away = () => {const d = D(); return !!d && d.phase==="shift";};
function collapse(kind){
  const S = S_(), d = D();
  if (d.phase!=="shift"){S.err = Math.max(S.err,1); S.security = Math.max(S.security,1); return;}
  if (!d.end){d.end = {why:kind,at:d.t}; d.pending = "review"; sfx("offline");}
}

/* ==== Handover summary, then home ==== */
function handover(){
  const S = S_(), d = D(), pr = d.prog, T = d.temp;
  if (T.tgt && T.tgt.sup){T.tgt = null; T.work = T.need = 0;}
  d.phase = "handover"; G.mode = "title";
  const up = S.racks.filter(Boolean), down = up.filter(a => a.down), fire = up.filter(a => a.fire>0), open = up.filter(a => !a.down && patchDue(a));
  d.ho = {tk:S.tk.length,down:down.length,fire:fire.length,open:open.length};
  const todo = stations().map(o => o.info);
  const lessons = SK.map(k => d.taught[k]?`${SKILL[k].name} ×${d.taught[k]}`:null).filter(Boolean);
  show(`<div class="eyebrow">Handover · ${clock(d)} · Night ${pr.shift+1} of ${DAYS}</div>
  <h2>You're out the door.</h2>
  <p>${NAME} has ${SHIFTS[pr.shift].name} to himself: <b>22:00 to 06:00</b>. You go home and sleep (he doesn't; he's fine; there's coffee). If he calls, the phone rings in the dark: <kbd>E</kbd> or <kbd>Space</kbd> picks up (that counts as stepping in, and costs you ⚡${CALL_COST}; under ⚡${WAKE_MIN} you sleep through it), you open your eyes on the security camera, close up on him wherever the trouble is, and once he's sorted you go back to sleep. Tomorrow he writes up whatever you talked him through.</p>
  ${skillTable(pr,d.snap)}
  <div class="d2cols">
    <div><h3>Today you</h3><ul>${lessons.length?`<li>Taught: ${lessons.join(", ")}${d.headLow?" (his head filled up)":""}</li>`:"<li>Taught him nothing directly.</li>"}${kitList(pr,d.snap).map(x => `<li>${x}</li>`).join("")||""}</ul></div>
    <div><h3>You're leaving him</h3><ul>
      <li>${d.ho.tk} open ticket${d.ho.tk===1?"":"s"}, ${d.ho.open} server${d.ho.open===1?"":"s"} not patched this cycle</li>
      ${d.ho.down||d.ho.fire?`<li class="bad">${d.ho.down?`${d.ho.down} offline`:""}${d.ho.down&&d.ho.fire?" and ":""}${d.ho.fire?`${d.ho.fire} on fire`:""}. Good luck, ${NAME}.</li>`:""}
      ${todo.length?`<li>Still not done: ${todo.slice(0,4).join("; ")}${todo.length>4?"…":""}</li>`:"<li>Every runbook, tool and fix is done.</li>"}
    </ul></div>
  </div>
  <div class="row"><button class="btn" data-act="d2shift">Go home ▸</button></div>`);
}
function startShift(){
  const S = S_(), d = D(), pr = d.prog, T = d.temp;
  Object.assign(d,{phase:"shift",t:0,acc:0,rs:9001+pr.shift*977,tk:SHIFTS[pr.shift].tk,call:null,callCd:0,vm:{},fixWas:true,end:null,pending:null,cantNow:false,saidTk:0,eye:1,upT:2.6,zoomT:9,wakes:0,openT:null,closeT:null});
  d.st = {a0:S.ss.audits,e0:S.ss.esc,l0:S.ss.lost,b0:S.ss.bot,jobs:Object.fromEntries(SK.map(k => [k,[0,0]])),cant:Object.fromEntries(SK.map(k => [k,0])),cantSeen:{},stuck:0,botTaught:0,calls:0,ignored:0,slept:0,energy0:S.energy,callAbout:{},
    guidedJobs:0,psu:0,vent:0,peak:pr.stress,sx:{queue:0,incident:0,unknown:0,calls:0},coffee:0,reopened:0,quitT:0,stress0:pr.stress,conf0:pr.conf};
  S.err = S.errMax; S.security = 100;   // the night gets a full budget; what you left broken is what it costs
  const P = S.p; Object.assign(P,{x:-400,y:-400,heldBy:null,stun:0});
  S.fix = null; S.fixP = 0; S.prompt = "";
  S.users.forEach(u => {if (u.hunter) u.gone = true;});
  T.x = DESK.x; T.y = DESK.y-60; T.tgt = null; T.work = T.need = 0; T.quit = false; T.phone = false; T.watching = false; T.cool = {};
  say(T, pr.shift===DAYS-1 ? "Month-end. They said it's 'a bit busy'." : "Okay. Just me. Totally fine.", 3.5);
  play();
  toast(`🌙 ${SHIFTS[pr.shift].name}. ${NAME} is on his own. You go home and sleep. If he calls, pick up and you'll see what he's dealing with.`);
}

/* ==== Review ==== */
const pct = v => `${Math.round(v*100)}%`;
function skillTable(pr,was){
  return `<table class="d2skt"><thead><tr><th>${NAME} knows</th><th>Level</th><th>Runbook</th></tr></thead><tbody>${SK.map(k => {
    const s = pr.sk[k], w = was ? was.sk[k] : s, up = level(s.xp)>level(w.xp), dx = Math.round(s.xp-w.xp);
    return `<tr><td>${SKILL[k].icon} ${SKILL[k].name}</td><td><span class="d2pips">${pips(s.xp)}</span> ${LEVELS[level(s.xp)][1]}${dx>0?` <span class="d2dx${up?" d2up":""}">+${dx}</span>`:""}</td><td>${s.doc>0?`📄 ${pct(s.doc)}${w.doc<s.doc-0.005?` <span class="d2dx d2up">+${Math.round((s.doc-w.doc)*100)}</span>`:""}`:"—"}</td></tr>`;}).join("")}</tbody></table>`;
}
const pips = xp => {const l = level(xp); return [1,2,3,4].map(i => `<i class="${i<=l?"on":""}"></i>`).join("");};
function kitList(pr,was){
  const out = [];
  if (pr.tools.bot && !(was && was.tools.bot)) out.push("Configured Patch Bot");
  if (pr.tools.portal && !(was && was.tools.portal)) out.push("Fixed the Self-Service Portal");
  for (const k of SK){const s = pr.sk[k], w = was ? was.sk[k].doc : 0;
    if (s.doc>=BASE && w<BASE) out.push(`Wrote the first ${SKILL[k].short} runbook`);
    if (s.doc>Math.max(w,BASE)+0.005) out.push(`${NAME} added to the ${SKILL[k].short} runbook (now ${pct(s.doc)})`);}
  return out;
}
function result(){
  const S = S_(), d = D(), pr = d.prog, st = d.st, why = d.end ? d.end.why : d.temp.quit ? "quit" : "done";
  const up = Math.max(0,S.err/S.errMax), downNow = S.racks.filter(a => a && a.down).length, fireNow = S.racks.filter(a => a && a.fire>0).length;
  const audits = S.ss.audits-st.a0, esc = S.ss.esc-st.e0, lost = S.ss.lost-st.l0, bot = S.ss.bot-st.b0;
  const healthy = why==="done" && up>=0.5 && !downNow && !fireNow && audits<=3;
  const grade = why==="quit" ? "quit" : why!=="done" ? "collapse" : !healthy ? "limped" : st.calls ? "supported" : "independent";
  return {grade,pass:grade==="independent"||grade==="supported",why,up,downNow,fireNow,audits,esc,lost,bot,at:why==="quit"?st.quitT:d.end?d.end.at:SHIFT_LEN,calls:st.calls,ignored:st.ignored};
}
const GRADES = {
  independent:{stamp:"Independent",cls:"d2ok",title:`${NAME} handled it. Alone.`,sub:"The phone never rang. The servers are up. Nobody needed you. That's the job now."},
  supported:{stamp:"Needed you",cls:"d2meh",title:`${NAME} made it, with help.`,sub:"The place is standing, but you got called. Sustainable means the phone stays quiet."},
  limped:{stamp:"Limped through",cls:"d2meh",title:"Morning came. The place didn't look great.",sub:`${NAME} is still here, but the client's first email of the day has 'concerns' in the subject line.`},
  quit:{stamp:"Quit",cls:"d2bad",title:`${NAME} quit.`,sub:"Last temp. Remember? The agency stopped picking up too."},
  collapse:{stamp:"Collapsed",cls:"d2bad",title:"The uptime budget ran out.",sub:"Teddy's Bright Smile Dental called you. At home. At night. You know what that means."},
};
function insights(r){
  const S = S_(), d = D(), pr = d.prog, st = d.st, out = [];
  const at = t => atClock(d,t);
  if (r.grade==="quit"){
    const sx = st.sx, top = Object.entries({"a full ticket queue":sx.queue,"things down or on fire":sx.incident,"work nobody showed him how to do":sx.unknown,"calls that went to voicemail":sx.calls}).sort((a,b) => b[1]-a[1]).filter(e => e[1]>1).slice(0,2).map(e => e[0]);
    out.push(`${NAME} quit at ${at(r.at)}. What got to him most: ${top.join(" and ")||"everything, a little"}.`);
  } else if (r.grade==="collapse") out.push(`Outages drained the uptime budget by ${at(r.at)}. Gold servers burn it fastest: 3 per second while they're down.`);
  else if (r.grade==="limped"){
    const bits = [];
    if (r.up<0.5) bits.push(`uptime ended at ${pct(r.up)} (half is the bar)`);
    if (r.downNow) bits.push(`${r.downNow} server${r.downNow>1?"s were":" was"} still offline at 06:00`);
    if (r.fireNow) bits.push(`${r.fireNow} still on fire`);
    if (r.audits>3) bits.push(`${r.audits} servers failed audit`);
    out.push(`He made it to morning, but ${bits.join(", ")}. Surviving isn't the same as healthy.`);
  } else {
    const n = SK.reduce((a,k) => a+st.jobs[k][0],0)-st.guidedJobs;
    out.push(`${NAME} did ${n} job${n===1?"":"s"} on his own${r.calls?`, and ${st.guidedJobs} more with you on the phone`:""}. Uptime ended at ${pct(r.up)}.`);
  }
  for (const k of SK){
    const [ok,bad] = st.jobs[k], s = pr.sk[k], cant = st.cant[k];
    if (bad>=2) out.push(`${SKILL[k].name}: ${ok} of ${ok+bad} went right. He's at "${LEVELS[level(s.xp)][1]}"${s.doc>0?` with a ${pct(s.doc)} runbook`:" with no runbook"}. ${s.xp<40?"Let him practice with you watching (press Space at the job): you catch his mistakes before they cost anything.":s.doc<BASE?"A runbook would steady him when he's stressed.":lastNight(d)?"Every mistake is something he can add to the runbook.":"Every mistake is something he can add to the runbook tomorrow."}`);
    else if (cant && !unlocked(pr,k)) out.push(`He isn't ready for ${SKILL[k].short} yet (${cant} time${cant>1?"s":""} he had to leave it${st.callAbout[k]?" or call you":""}): ${needText(k)} has to reach Practiced first. Until then it's yours to cover, or a tool's.`);
    else if (cant) out.push(`He didn't know how to handle ${SKILL[k].short} (${cant} time${cant>1?"s":""} he had to leave it${st.callAbout[k]?" or call you":""}). ${s.xp<15?"He'd never even seen it done.":"He wasn't sure enough to try."} Show him a couple of times, then let him try.`);
  }
  if (st.calls) out.push(`You picked up ${st.calls} time${st.calls>1?"s":""}. Each call taught him a lot, and tomorrow he can add it to the runbook: walk him to the wiki and press Space at it. Still, the goal is a phone that never rings.`);
  if (st.slept) out.push(`You slept through ${st.slept} call${st.slept>1?"s":""}: too tired to wake up. Every call you pick up costs ⚡${CALL_COST}, and sleep only brings it back slowly.`);
  if (st.ignored>st.slept) out.push(`${st.ignored-st.slept} call${st.ignored-st.slept>1?"s":""} went to voicemail. That rattled him more than the problem did.`);
  if (!lastNight(d)) out.push(`You wake up with ⚡${Math.floor(S_().energy)} (you went to bed with ${Math.floor(st.energy0)}). That's what you start tomorrow's handover with.`);
  {const lots = SK.filter(k => expOf(pr,k)>=3); if (lots.length && !lastNight(d)) out.push(`He's got things to add to the ${lots.map(k => SKILL[k].short).join(", ")} runbook${lots.length>1?"s":""}. Tomorrow, walk him to the wiki and press Space at ${lots.length>1?"each":"it"}.`);}
  if (r.esc) out.push(`${r.esc} ticket${r.esc>1?"s":""} escalated into ${r.esc>1?"fires":"a fire"}.${pr.tools.portal?" Tickets are where he needs to be faster, or have fewer of them.":" The Self-Service Portal still auto-approves everything; fixing it cuts tickets by about 28%."}`);
  if (r.audits && !pr.tools.bot) out.push(`${r.audits} server${r.audits>1?"s":""} failed audit. Patch Bot has been unplugged since Day 1; configure it and he only has to clear its mistakes.`);
  else if (pr.tools.bot && r.bot) out.push(`Patch Bot did ${r.bot} job${r.bot>1?"s":""} and gets ${pct(pr.botOk)} right now.${st.stuck?` It got stuck ${st.stuck} time${st.stuck>1?"s":""} on cases it didn't know${st.botTaught?`; ${NAME} taught it ${st.botTaught}`:canBotfix(pr)?"":pr.botSeen?`. ${NAME} can teach it once his patching is Practiced`:`. Teach it with ${NAME} watching and he'll learn to do it too`}.`:""}`);
  if (st.reopened) out.push(`${st.reopened} ticket${st.reopened>1?"s":""} he "closed" came back. He was closing them, not fixing them.`);
  if (d.ho && (d.ho.down||d.ho.fire)) out.push(`You left him ${d.ho.down?`${d.ho.down} server${d.ho.down>1?"s":""} offline`:""}${d.ho.down&&d.ho.fire?" and ":""}${d.ho.fire?`${d.ho.fire} on fire`:""} at handover.`);
  if (d.headLow) out.push(`You crammed a lot into one handover: once his head filled up, lessons stopped sticking. Head space comes back every morning; runbooks and his own write-ups don't use it.`);
  return out.slice(0,7);
}
const QUOTES = {
  independent:["I didn't call you once. Did you notice? You noticed.","I think I actually know what I'm doing. Don't tell the agency.","Is this what a career feels like?"],
  supported:["Thanks for picking up. I'll get it next time. Probably.","Sorry about the call. And the other call.","I almost had it. Almost."],
  limped:["Everything's... mostly up? Define 'up'.","I closed a lot of tickets. Some of them were fixed.","Can someone else do Thursdays?"],
  quit:["I quit. Tell the agency I said hi.","Nobody wrote anything down. NOBODY.","I'm going back to data entry."],
  collapse:["I unplugged it and plugged it back in. Everything.","Was it supposed to beep like that? All of it?","I think I need a manager."],
};
const lastNight = d => d.prog.shift===DAYS-1;
// before the last night, walking out means going home early; on the last night it's for real
const gradeOf = (d,r) => r.grade==="quit" && !lastNight(d) ? {stamp:"Walked out",cls:"d2bad",title:`${NAME} went home early.`,sub:"He left a sticky note: \"too much.\" He'll be back tomorrow. Probably. Everything he walked away from is still broken."} : GRADES[r.grade];
function review(){
  const S = S_(), d = D(), pr = d.prog, r = result(), g = gradeOf(d,r);
  d.phase = "review"; G.mode = "end";
  const prev = d.tries[pr.shift].slice(-1)[0];
  d.tries[pr.shift].push({grade:r.grade,calls:r.calls,up:r.up,audits:r.audits});
  d.last = r;
  const st = d.st, jobs = SK.map(k => st.jobs[k]), done = jobs.reduce((a,j) => a+j[0],0), tried = jobs.reduce((a,j) => a+j[0]+j[1],0);
  const last = lastNight(d);
  const tb = TALK_BACKS-(pr.talkBacks||0), gone = !last && r.grade==="quit" && tb<=0;
  const btns = gone ? `<button class="btn" data-act="d2retry">Redo this handover</button>`
    : !last
    ? `<button class="btn" data-act="d2next">${r.grade==="quit"?`Talk him back in (${tb===1?"last chance":`${tb} left`}) ▸`:"Next morning ▸"}</button><button class="btn ghost" data-act="d2retry">Redo this handover</button>`
    : r.pass ? `<button class="btn" data-act="d2final">Finish ▸</button><button class="btn ghost" data-act="d2retry">Redo this handover</button>`
    : `<button class="btn" data-act="d2retry">Try the last night again</button>`;
  show(`<div class="endhead"><div class="stamp ${g.cls}" aria-hidden="true">${g.stamp}</div>
  <div class="eyebrow">Night ${pr.shift+1} of ${DAYS} · ${SHIFTS[pr.shift].name} · Morning report</div>
  <h2>${g.title}</h2></div>
  <p>${g.sub}${gone?` You've talked him back in ${TALK_BACKS} times. This time he isn't picking up. Redo this night from its handover.`:!last&&!r.pass?` That's normal this early: night ${DAYS} is the one that counts.${r.grade==="quit"?` You can talk him back in ${tb===1?"once more":`${tb} times`}, and that's it.`:""}`:""}</p>
  <div class="d2stats">
    <div><b>${done}/${tried}</b><span>jobs went right</span></div>
    <div class="${r.up<0.5?"bad":""}"><b>${pct(r.up)}</b><span>uptime left</span></div>
    <div class="${r.calls||r.ignored?"warn":""}"><b>${r.calls}</b><span>times you stepped in${r.ignored?` · ${r.ignored} ignored`:""}</span></div>
    <div class="${r.audits>3?"bad":""}"><b>${r.audits}</b><span>failed audits</span></div>
    <div class="${r.esc?"warn":""}"><b>${r.esc}</b><span>escalations</span></div>
    <div class="${st.peak>=80?"bad":st.peak>=55?"warn":""}"><b>${Math.round(st.peak)}</b><span>peak stress · now ${Math.round(pr.stress)}</span></div>
  </div>
  <blockquote class="d2quote">“${QUOTES[r.grade][pr.shift%3]}” <small>${NAME}</small></blockquote>
  <h3>What happened, and why</h3>
  <ul class="d2why">${insights(r).map(x => `<li>${x}</li>`).join("")}</ul>
  ${skillTable(pr,d.snap)}
  ${prev?`<p class="d2prev">Last try at this night: <b>${gradeOf(d,{grade:prev.grade}).stamp}</b>, ${prev.calls} call${prev.calls===1?"":"s"}, uptime ${pct(prev.up)}. Same night, same seed: only your handover changed.</p>`:`<p class="d2prev">Every try at this night plays the same events in the same order. Only your handover changes the outcome.</p>`}
  <div class="row">${btns}<button class="btn ghost" data-act="menu">Main menu</button></div>`);
  sfx("stamp");
}
function next(){
  const d = D(), pr = d.prog;
  const quit = d.last.grade==="quit";
  pr.hist.push({...d.last}); pr.shift++; if (quit){pr.conf = Math.max(0,pr.conf-10); pr.talkBacks = (pr.talkBacks||0)+1;}   // he never goes home: stress and confidence carry as they are
  beginPrep("morning",quit);
}
function retry(){const d = D(); d.prog = clone(d.snap); beginPrep("redo");}
function final(){
  const d = D(), pr = d.prog, hist = [...pr.hist,d.last];
  d.phase = "final"; G.mode = "end";
  const calls = hist.reduce((a,h) => a+h.calls,0), clean = d.last.grade==="independent", bad = hist.filter(h => !h.pass).length;
  show(`<div class="endhead"><div class="stamp ${clean?"d2ok":"d2meh"}" aria-hidden="true">Staying</div>
  <div class="eyebrow">Day 2 · Five nights at Teddy's · Prototype complete</div>
  <h2>${NAME} runs the night shift.</h2></div>
  <p>${DAYS} nights. ${bad?`${bad} of them went badly, which is what learning looks like.`:"Not one bad night."} ${calls?`You picked up the phone ${calls} time${calls>1?"s":""} along the way.`:"You never picked up the phone once."} ${clean?"The month-end close was boring. Boring is the goal.":"The month-end close went fine. Fine is the goal."}</p>
  ${skillTable(pr,null)}
  <div class="d2push" id="d2push"><div class="hd"><b>📤 <span class="st">Pushing to Code Hub</span></b> · <span class="repo">teddys-eastside/runbooks</span></div>
    <code class="log" aria-hidden="true">$ git push origin main</code>
    <ul>${SK.map(k => `<li data-to="${Math.round(pr.sk[k].doc/DOC_MAX*100)}"><span>${SKILL[k].icon} ${SKILL[k].name.toLowerCase()}.md</span><em><i></i></em><b>${pr.sk[k].doc>0?"0%":"empty"}</b></li>`).join("")}</ul>
    <code class="commit" aria-hidden="true">${pushCommit(pr)}</code>
    <small>✓ Pushed. Version-controlled, reviewed, and never finished. Whoever (or whatever) does this job next starts from these. Written-down scope is a guardrail.</small></div>
  <p>His badge still says <b>TEMP · ${NAME.toUpperCase()}</b>, but the countdown is gone. Making him permanent takes someone who can actually hire people. (That sounds like a job for a manager.)</p>
  <p class="d2prev">On Day 1 the temp came to help you, asked one question and quit. On Day 2 you came to help him. Easy things first, harder things once he was ready, and a Patch Bot that learned alongside him are why he stayed.</p>
  <div class="row"><button class="btn" data-act="d2">Play Day 2 again</button><button class="btn ghost" data-act="menu">Main menu</button></div>`);
  sfx("celebrate"); pushAnim();
}
// the commit line under the push: a short hash made from the runbooks themselves (no randomness)
function pushCommit(pr){
  let h = 2166136261; for (const k of SK){h ^= Math.round(pr.sk[k].doc*1000)+k.length; h = Math.imul(h,16777619)>>>0;}
  const files = SK.filter(k => pr.sk[k].doc>0).length;
  return `main ← ${h.toString(16).padStart(8,"0").slice(0,7)} "Runbooks from ${DAYS} nights at Teddy's (${NAME})" · ${files} file${files===1?"":"s"} changed`;
}
// Pushing to Code Hub, played out: the header pulses while each runbook's bar fills from 0 to its %, one after another,
// then the commit line and the caption land. Draw-only (real time, no randomness); reduced motion shows the end state.
function pushAnim(){
  const box = $("d2push"); if (!box) return;
  const rows = [...box.querySelectorAll("li")], log = box.querySelector(".log"), st = box.querySelector(".st");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FILL = 1100, GAP = 350, LEAD = 700;
  const plan = rows.map((li,i) => ({li,to:+li.dataset.to,empty:li.querySelector("b").textContent==="empty",at:LEAD+i*(FILL+GAP)}));
  const end = LEAD+rows.length*(FILL+GAP)+150;
  const done = () => {box.classList.remove("going"); box.classList.add("done"); st.textContent = "Pushed to Code Hub"; box.querySelector(".hd b").firstChild.textContent = "✅ ";
    log.textContent = `$ git push origin main · ${rows.length} files · done`;
    for (const p of plan){p.li.classList.add("ok"); p.li.querySelector("i").style.width = p.to+"%"; if (!p.empty) p.li.querySelector("b").textContent = p.to+"%";}};
  if (still){done(); return;}
  box.classList.add("going"); const t0 = performance.now(); let tick = -1;
  const step = now => {
    if (!box.isConnected) return;   // the screen moved on
    const t = now-t0;
    if (t>=end){done(); sfx("buy"); return;}
    let cur = null;
    for (const p of plan){const k = clamp((t-p.at)/FILL,0,1), e = 1-Math.pow(1-k,3), v = Math.round(p.to*e);
      p.li.classList.toggle("live",k>0 && k<1); p.li.querySelector("i").style.width = (p.to*e).toFixed(1)+"%";
      if (!p.empty) p.li.querySelector("b").textContent = v+"%";
      if (k>=1 && !p.li.classList.contains("ok")){p.li.classList.add("ok"); sfx("sent");}
      if (k>0 && k<1) cur = p;}
    const n = plan.filter(p => p.li.classList.contains("ok")).length;
    const msg = t<LEAD ? "$ git push origin main · Enumerating objects…" : `$ git push origin main · Writing objects: ${Math.round(100*clamp(t/end,0,1))}% (${n}/${rows.length})`;
    if (msg!==log.textContent) log.textContent = msg;
    requestAnimationFrame(step);};
  requestAnimationFrame(step);
}
function act(a){
  if (a==="d2") start();
  else if (a==="d2go") beginPrep("fresh");
  else if (a==="d2shift") startShift();
  else if (a==="d2next"){const d = D(); if (d.last && d.last.grade==="quit" && (d.prog.talkBacks||0)>=TALK_BACKS) return; next();}
  else if (a==="d2retry") retry();
  else if (a==="d2final") final();
}

/* ==== Drawing (no randomness here) ==== */
function drawUnder(){
  const S = S_(), d = D(); if (!d) return;
  if (d.phase==="shift" || d.phase==="review"){ctx.fillStyle = "rgba(6,12,34,.28)"; ctx.fillRect(0,0,W,H);}
  const pr = d.prog;
  // the cloud side: the main clinic, migrated on Day 1. Dark and quiet; nothing happens there tonight
  ctx.fillStyle = "rgba(4,8,20,.9)"; ctx.fillRect(600,0,360,H);
  ctx.fillStyle = "rgba(200,215,255,.35)";
  for (let i = 0; i<38; i++){const x = 606+((i*137)%348), y = 8+((i*89+i*i*7)%(H-16)), r = i%5===0 ? 1.4 : 0.8; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();}   // a fixed sky, no randomness
  tx("CLOUD · us-east-1",944,22,13,"#5d6f8a",{font:DISP,align:"right",weight:700});
  tx("☁ THE MAIN CLINIC · MIGRATED ON DAY 1",780,262,10.5,"#7b8ba5",{font:DISP,weight:700});
  tx("All quiet. Nothing to do here.",780,280,10,"#5d6f8a",{font:BODY});
  // the wiki: three runbooks, written or not
  ctx.fillStyle = "rgba(10,16,22,.82)"; rr(382,26,196,64,6); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; rr(382,26,196,64,6); ctx.stroke();
  tx("WIKI · RUNBOOKS",480,20,9,C.muted,{font:DISP,weight:700});
  for (const k of SK){const p = DOCS[k], s = pr.sk[k], base = s.doc>=BASE, top = s.doc>=DOC_MAX-1e-6;
    ctx.fillStyle = base ? "#e8f6ee" : "#f4f1e6"; rr(p.x-20,p.y-24,40,40,3); ctx.fill();
    ctx.fillStyle = "#6b5232"; rr(p.x-8,p.y-27,16,6,2); ctx.fill();
    em(SKILL[k].icon,p.x,p.y-9,13);
    tx(s.doc>0?`${pct(s.doc)}${top?" ✓":""}`:"EMPTY",p.x,p.y+8,7.5,base?"#1d7a46":s.doc>0?"#8a5a00":"#8a2a20",{font:DISP,weight:700});
    if (s.doc>0 && !top) bar(p.x-15,p.y+12,30,3,s.doc/DOC_MAX,base?"#2f9e62":C.amber,"rgba(0,0,0,.25)");
    const n = Math.floor(expOf(pr,k));
    if (n && d.phase==="prep"){ctx.fillStyle = canAdd(pr,k) ? C.amber : "#7d8a96"; ctx.beginPath(); ctx.arc(p.x+18,p.y-22,9,0,7); ctx.fill(); tx(`✎${n}`,p.x+18,p.y-22,7.5,"#1a1200",{font:DISP,weight:700});}}
  // Patch Bot, unplugged since Day 1
  if (!pr.tools.bot){const p = BOTSPOT;
    ctx.fillStyle = "#3a4650"; rr(p.x-14,p.y-14,28,24,6); ctx.fill(); ctx.strokeStyle = "#5d6b75"; ctx.lineWidth = 1.5; rr(p.x-14,p.y-14,28,24,6); ctx.stroke();
    ctx.fillStyle = "#1c252c"; rr(p.x-9,p.y-8,18,8,3); ctx.fill(); tx("zz",p.x+15,p.y-18,8,C.muted,{weight:700});
    ctx.strokeStyle = "rgba(220,230,240,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x-14,p.y-14); ctx.lineTo(p.x-4,p.y-4); ctx.moveTo(p.x-14,p.y-6); ctx.lineTo(p.x-6,p.y-14); ctx.stroke();
    tx("PATCH BOT · UNCONFIGURED",p.x,p.y+20,7.5,C.muted,{font:DISP,weight:700});
    if (pr.work.bot>0) bar(p.x-20,p.y+26,40,3,pr.work.bot/BOT_T,C.ok,"rgba(0,0,0,.3)");}
  // the portal kiosk
  {const p = PORTAL, ok = pr.tools.portal;
    ctx.fillStyle = "#26323b"; rr(p.x-13,p.y-20,26,40,4); ctx.fill();
    ctx.fillStyle = ok ? "#1f5c3a" : "#5c1f1f"; rr(p.x-10,p.y-17,20,15,2); ctx.fill();
    tx(ok?"✓":"✔✔",p.x,p.y-9,9,ok?"#9ff0c0":"#ffb3a8",{weight:700});
    tx(ok?"PORTAL":"AUTO-APPROVE",p.x,p.y+28,7.5,ok?C.ok:C.danger,{font:DISP,weight:700});
    if (!ok && pr.work.portal>0) bar(p.x-16,p.y+34,32,3,pr.work.portal/TOOL_T,C.ok,"rgba(0,0,0,.3)");}
}
function drawOver(){
  const S = S_(), d = D(); if (!d) return;
  const T = d.temp, pr = d.prog; if (!T) return;
  if (T.tgt && T.tgt.kind==="botfire" && spraying(T.ext)) drawSpray(T,{x:T.tgt.b.x,y:T.tgt.b.y},{fire:T.tgt.b.fire},"foam",`${NAME.toUpperCase()} EXTINGUISHING`);
  if (S.botExt && spraying(S.botExt) && S.botExt.b.fire>0) drawSpray(S.p,{x:S.botExt.b.x,y:S.botExt.b.y},{fire:100*(1-(S.botExt.b.fireP||0)/BOTFIRE_T)},"foam","EXTINGUISHING");
  if (T.tgt && T.tgt.kind==="fire" && spraying(T.ext)) drawSpray(T,RACKS[T.ext.a.slot],T.ext.a,"foam",`${NAME.toUpperCase()} EXTINGUISHING`);
  // Doug: Day 1's temp, teal shirt and VISITOR badge
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(T.x,T.y+17,13,4,0,0,7); ctx.fill();
  ctx.fillStyle = "#2c8c86"; ctx.beginPath(); ctx.moveTo(T.x-14,T.y+16); ctx.quadraticCurveTo(T.x-14,T.y-1,T.x,T.y-1); ctx.quadraticCurveTo(T.x+14,T.y-1,T.x+14,T.y+16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ff5fa2"; rr(T.x-6,T.y+4,12,8,2); ctx.fill(); tx("VISITOR",T.x,T.y+8,3.6,"#fff",{weight:700});
  ctx.fillStyle = "#a9b6c0"; ctx.beginPath(); ctx.arc(T.x,T.y-10,7.5,0,7); ctx.fill();
  if (T.tgt && T.need && T.work>0){ctx.strokeStyle = TEAL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(T.x,T.y,20,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,T.work/T.need)); ctx.stroke();}
  if (T.tgt && T.tgt.kind==="note") tx("ADDING TO THE RUNBOOK",T.x,T.y-36,7.5,TEAL,{font:DISP,weight:700});
  if (d.solo && d.phase==="prep") tx("ON HIS OWN",T.x,T.y-36,7.5,C.amber,{font:DISP,weight:700});
  if (T.tgt && T.tgt.sup && d.phase==="prep"){const near = dist(T,S.p)<SUP_R; tx(near?"SUPERVISED":"UNSUPERVISED",T.x,T.y-36,7.5,near?TEAL:C.amber,{font:DISP,weight:700});}
  if (T.watching) em("👀",T.x+15,T.y-20,13);
  // a stuck Patch Bot says so
  for (const b of S.bots){
    if (b.fire>0){const fl2 = RM ? 0 : Math.sin(decoT()*14+b.x)*1.5;
      ctx.fillStyle = `rgba(255,110,40,${0.22+b.fire/500})`; ctx.beginPath(); ctx.arc(b.x,b.y-4,18+b.fire/8,0,7); ctx.fill();
      em("🔥",b.x,b.y-14+fl2,16+b.fire/7);
      tx("ON FIRE",b.x,b.y-34-b.fire/20,8,C.danger,{font:DISP,weight:700}); if (b.fireP>0) bar(b.x-14,b.y-28,28,3,b.fireP/BOTFIRE_T,C.ok,"rgba(0,0,0,.3)");}
    else if (b.stuck!=null){tx("STUCK ?",b.x,b.y-26,8,C.danger,{font:DISP,weight:700}); if (b.fixP>0) bar(b.x-14,b.y-20,28,3,b.fixP/BOTFIX_T,C.ok,"rgba(0,0,0,.3)");}}
  if (T.phone) em("📱",T.x+14,T.y-6+(RM?0:Math.sin(decoT()*18)*1.5),14);
  const label = T.quit ? `${NAME.toUpperCase()} · QUIT` : `TEMP · ${NAME.toUpperCase()}`;
  tx(label,T.x,T.y+26,8,TEAL,{font:DISP,weight:700});
  if (!T.quit){const s = pr.stress/100; bar(T.x-16,T.y+32,32,3.5,s,s>0.75?C.danger:s>0.5?C.amber:C.ok,"rgba(0,0,0,.35)");}
  if ((logLv()>=1 || d.call || (T.tgt && T.tgt.guided)) && T.sayT>0) smallBubble(T.say,T.x,T.y-24,"#f6f8fa","#14212b");
  // the phone ringing at home
  if (d.call){const t = `📞 ${NAME.toUpperCase()} IS CALLING · PICK UP? (THAT'S STEPPING IN) · ${Math.ceil(d.call.left)}s`;
    ctx.font = `700 12px ${DISP}`; const w = ctx.measureText(t).width+20;
    ctx.fillStyle = `rgba(90,58,0,${RM?0.92:0.85+0.1*Math.sin(decoT()*8)})`; rr(W/2-w/2,64,w,24,6); ctx.fill();
    ctx.strokeStyle = C.amber; ctx.lineWidth = 1.5; rr(W/2-w/2,64,w,24,6); ctx.stroke(); tx(t,W/2,76,12,"#ffe2a8",{font:DISP,weight:700});}
}

/* ==== HUD panel ==== */
const CSS = `
body.d2on #hb-lease,body.d2on #hb-stars,body.d2on #hb-pts,body.d2on .hud .chip:has(#h-mig),body.d2on .hud .chip:has(#h-budget),body.d2on #freeze,body.d2on .help>span{display:none}
.help .d2help{display:none}body.d2on .help .d2help{display:inline}
.d2p{display:grid;grid-template-columns:minmax(150px,1fr) minmax(170px,1.1fr) minmax(220px,1.6fr) minmax(150px,1fr);gap:8px;margin:0 0 8px}
.d2p[hidden]{display:none}
.d2c{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:7px 10px;min-width:0;font-size:12px}
.d2c .lbl{display:block;color:var(--muted);font-size:10.5px;text-transform:uppercase;letter-spacing:.08em}
.d2clk b{font-family:var(--f-mono);font-size:20px;font-variant-numeric:tabular-nums}
.d2clk small{display:block;color:var(--muted);font-size:11px;margin:1px 0 4px}
.d2btns{display:flex;flex-wrap:wrap;gap:5px}
.d2btns button{background:var(--panel-2,#1c3243);border:1px solid var(--line);color:var(--ink);border-radius:6px;padding:4px 8px;font:inherit;font-size:12px;cursor:pointer;min-height:30px}
.d2btns button.on{border-color:var(--leak);color:var(--leak)}
.d2btns button.ring{border-color:var(--amber);color:var(--amber)}
.d2btns button:focus-visible{outline:2px solid var(--leak);outline-offset:2px}
.d2name{font-family:var(--f-display);font-weight:700;letter-spacing:.06em;color:#4fd1c5;margin-bottom:3px}
.d2m{display:grid;grid-template-columns:78px 1fr 26px;align-items:center;gap:6px;margin:2px 0;color:var(--muted)}
.d2m .t{height:6px;background:var(--line);border-radius:3px;overflow:hidden}.d2m .t i{display:block;height:100%;width:0;background:var(--ok)}
.d2m b{color:var(--ink);font-family:var(--f-mono);font-size:11px;text-align:right}
.d2m.bad .t i{background:var(--danger)}.d2m.warn .t i{background:var(--amber)}
.d2s{display:grid;grid-template-columns:18px 1fr auto;gap:2px 6px;align-items:center;margin:1px 0}
.d2s small{grid-column:2/4;color:var(--muted);font-size:10.5px;margin-top:-3px}
.d2s.locked>b,.d2s.locked>span{opacity:.45}
.d2pips{display:inline-flex;gap:2px;vertical-align:middle}.d2pips i{width:9px;height:6px;border-radius:2px;background:var(--line)}.d2pips i.on{background:#4fd1c5}
.d2kit{display:flex;flex-wrap:wrap;gap:4px;align-content:flex-start}
.d2kit .lbl{width:100%}
.d2k{border:1px solid var(--line);border-radius:5px;padding:1px 6px;font-size:11px;color:var(--muted)}
.d2k.on{border-color:var(--ok);color:var(--ok)}
.d2kit small{width:100%;color:var(--muted)}
@media (max-width:760px){.d2p{grid-template-columns:1fr 1fr}}
#d2lids{position:absolute;inset:0;z-index:5;pointer-events:none;overflow:hidden}
#d2cam{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden;font-family:var(--f-mono);color:#c8ffd0;font-size:clamp(10px,1.6vw,15px);letter-spacing:.08em;text-shadow:0 0 5px rgba(120,255,140,.65)}
#d2cam[hidden]{display:none}
#d2cam::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0 2px,transparent 2px 4px);animation:d2flick .16s steps(2) infinite}
#d2cam::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 52%,rgba(0,0,0,.6) 100%)}
#d2cam span{position:absolute;z-index:1}
#d2cam .tl{left:14px;top:10px}#d2cam .tr{right:14px;top:10px}#d2cam .bl{left:14px;bottom:10px}#d2cam .br{right:14px;bottom:10px}
#d2cam .rec{color:#ff4d3d;animation:d2rec 1s steps(2) infinite}
@keyframes d2flick{to{opacity:.82}}@keyframes d2rec{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){#d2cam::before,#d2cam .rec{animation:none}}
#d2lids[hidden]{display:none}
#d2lids>i{position:absolute;left:-3%;right:-3%;background:#000;height:0}
#d2lids>i.t{top:0;border-radius:0 0 50% 50%/0 0 26px 26px}
#d2lids>i.b{bottom:0;border-radius:50% 50% 0 0/26px 26px 0 0}
#d2lids .zz{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;opacity:0}
#d2lids .zz b{font-family:var(--f-mono);font-size:clamp(28px,7vw,64px);color:#ff4d3d;text-shadow:0 0 14px rgba(255,77,61,.55);font-variant-numeric:tabular-nums}
#d2lids .zz strong{font-family:var(--f-display);font-size:clamp(14px,2.6vw,20px);font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#c9d3dc}
#d2lids .zz span{color:#7d8a96;font-size:13px;letter-spacing:.06em}
#d2lids .zz em{font-style:normal;margin-top:10px;padding:6px 14px;border:1px solid #e0a020;border-radius:8px;color:#ffd27a;font-family:var(--f-display);font-weight:700;font-size:15px;letter-spacing:.04em;animation:d2ring .7s ease-in-out infinite alternate}
#d2lids .zz em[hidden]{display:none}
#d2lids .zz em.tired{border-color:#55606a;color:#8a96a0;animation:none}
@keyframes d2ring{from{opacity:.55;transform:rotate(-1.5deg)}to{opacity:1;transform:rotate(1.5deg)}}
@media (prefers-reduced-motion:reduce){#d2lids .zz em{animation:none}}
body.d2sleep .d2p>.d2c:not(.d2clk){opacity:.3}
.stamp.d2ok{color:var(--ok)}.stamp.d2meh{color:var(--amber)}.stamp.d2bad{color:var(--danger)}
.d2stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:6px;margin:8px 0}
.d2stats div{background:var(--panel-2,#1c3243);border:1px solid var(--line);border-radius:6px;padding:6px 8px}
.d2stats b{display:block;font-family:var(--f-mono);font-size:18px}.d2stats span{color:var(--muted);font-size:11.5px}
.d2stats .bad b{color:var(--danger)}.d2stats .warn b{color:var(--amber)}
.d2quote{margin:6px 0;padding:6px 12px;border-left:3px solid #4fd1c5;color:var(--ink);font-style:italic}.d2quote small{color:var(--muted);font-style:normal;margin-left:6px}
.d2why{margin:4px 0 8px;padding-left:20px;line-height:1.5}
.d2skt{width:100%;border-collapse:collapse;font-size:12.5px;margin:6px 0}.d2skt th{color:var(--muted);font-weight:600;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
.d2skt td,.d2skt th{padding:3px 6px;border-bottom:1px solid var(--line)}.d2dx{color:var(--muted);font-size:11px}
.d2add{padding:0 3px;border-radius:4px;outline:1px solid transparent;transition:outline-color .5s,background-color .5s,color .5s}
.d2add.bump{outline-color:var(--ok);background:rgba(47,158,98,.22);color:var(--ink,#fff);transition:none}
@media (prefers-reduced-motion:reduce){.d2add{transition:none}}.d2dx.d2up{color:var(--ok)}
.d2cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}.d2cols ul{margin:4px 0;padding-left:18px;line-height:1.5;font-size:13px}.d2cols li.bad{color:var(--danger)}
@media (max-width:560px){.d2cols{grid-template-columns:1fr}}
.d2prev{color:var(--muted);font-size:12.5px}
.d2push{margin:10px 0;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel-2,#1c3243);font-size:13px;transition:border-color .6s,box-shadow .6s}
.d2push .repo{font-family:var(--f-mono);color:var(--muted);font-size:12px}
.d2push code{display:block;font-family:var(--f-mono);font-size:11px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.d2push ul{list-style:none;margin:6px 0;padding:0}
.d2push li{display:grid;grid-template-columns:minmax(0,1.4fr) 2fr 4.4em;gap:8px;align-items:center;margin:3px 0;font-family:var(--f-mono);font-size:12px;color:var(--muted);transition:color .3s}
.d2push li.live,.d2push li.ok{color:var(--ink,inherit)}
.d2push li em{display:block;height:6px;border-radius:3px;background:rgba(127,127,127,.18);overflow:hidden}
.d2push li i{display:block;height:100%;width:0;border-radius:3px;background:var(--ok)}
.d2push li.live i{box-shadow:0 0 8px var(--ok)}
.d2push li b{text-align:right}
.d2push li.ok b::after{content:" ✓";color:var(--ok)}
.d2push .commit,.d2push small{opacity:0;transition:opacity .6s}
.d2push.done .commit,.d2push.done small{opacity:1}
.d2push.done .commit{color:var(--ok)}
.d2push small{display:block;margin-top:4px;color:var(--muted)}
.d2push.going .hd b{animation:d2pushing .55s ease-in-out infinite alternate}
.d2push.done{border-color:var(--ok);box-shadow:0 0 0 1px var(--ok),0 0 18px rgba(47,158,98,.35)}
@keyframes d2pushing{from{opacity:1}to{opacity:.3}}
@media (prefers-reduced-motion:reduce){.d2push,.d2push li,.d2push .commit,.d2push small{transition:none}.d2push.going .hd b{animation:none}}
/* a phone on its side: one thin row, like Day 1's HUD, so the floor still fits the screen */
@media (pointer:coarse) and (orientation:landscape) and (max-height:520px){
  .d2p{display:flex;gap:4px;margin:0}
  .d2c{flex:0 1 auto;min-width:0;overflow:hidden;padding:1px 7px;font-size:11px;display:flex;align-items:center;gap:8px;white-space:nowrap}
  .d2long{display:none}
  .d2c .lbl,.d2clk small,#d2-mhd,.d2kit small,.d2s small,.d2s b{display:none}
  .d2clk b{font-size:13px}
  .d2btns{flex-wrap:nowrap}.d2btns button{min-height:22px;padding:1px 6px;font-size:11px}
  .d2name{margin:0;font-size:11px}
  .d2m{grid-template-columns:auto 40px;gap:4px;margin:0}.d2m b{display:none}
  .d2s{display:flex;gap:3px;margin:0}
  .d2kit{display:none}
  body.d2on .stage{width:min(100%,calc((100vh - 96px)*960/560));width:min(100%,calc((100dvh - 96px)*960/560))}
}
`;
let panel = null, tapE = false, muffled = false;
// a quick tap of E can come and go between frames; remember it so it still picks up
addEventListener("keydown",e => {if (e.code==="KeyE" && !e.repeat){const d = D(); if (d && d.phase==="shift" && d.call) tapE = true;}});
function ensurePanel(){
  if (panel) return panel;
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  panel = document.createElement("div"); panel.className = "d2p"; panel.id = "d2panel"; panel.hidden = true;
  panel.innerHTML = `<div class="d2c d2clk"><span class="lbl" id="d2-ph">Handover</span><b id="d2-clk">16:20</b><small id="d2-sub"></small>
    <div class="d2btns"><button type="button" data-d2="go" id="d2-go">Go home<span class="d2long"> now</span> ▸</button><button type="button" data-d2="answer" id="d2-ans" class="ring" aria-label="Pick up">📞<span class="d2long"> Pick up</span></button></div></div>
  <div class="d2c"><div class="d2name">TEMP · ${NAME.toUpperCase()} <span id="d2-mood"></span></div>
    <div class="d2m" id="d2-mst"><span>Stress</span><div class="t"><i></i></div><b></b></div>
    <div class="d2m" id="d2-mcf"><span>Confidence</span><div class="t"><i></i></div><b></b></div>
    <div class="d2m" id="d2-mhd"><span>Head space</span><div class="t"><i></i></div><b></b></div></div>
  <div class="d2c">${SK.map(k => `<div class="d2s" id="d2-s-${k}"><span>${SKILL[k].icon}</span><b>${SKILL[k].name}</b><span class="d2pips"></span><small></small></div>`).join("")}</div>
  <div class="d2c d2kit"><span class="lbl">The environment</span>${[["bot","🤖 Patch Bot"],["portal","🙋 Portal"]].map(([k,t]) => `<span class="d2k" id="d2-k-${k}">${t}</span>`).join("")}<small id="d2-note"></small></div>`;
  $("health").after(panel);
  const lids = document.createElement("div"); lids.id = "d2lids"; lids.hidden = true; lids.setAttribute("aria-hidden","true");
  lids.innerHTML = `<i class="t"></i><i class="b"></i><div class="zz"><strong id="d2-znight"></strong><b id="d2-zclk">22:00</b><span id="d2-zz">💤 ${NAME} has the floor</span><em id="d2-ring" hidden></em></div>`;
  const cam = document.createElement("div"); cam.id = "d2cam"; cam.hidden = true; cam.setAttribute("aria-hidden","true");
  cam.innerHTML = `<span class="tl"><b class="rec">●</b> REC <b id="d2-cam">CAM 2</b></span><span class="tr" id="d2-camt">23:00:00</span><span class="bl">TEDDY'S BRIGHT SMILE DENTAL · ON-PREM</span><span class="br">LIVE · REMOTE VIEW</span>`;
  const stage = document.querySelector(".stage"); if (stage){stage.appendChild(cam); stage.appendChild(lids);}
  const help = document.querySelector(".help");
  if (help){const h = document.createElement("span"); h.className = "d2help";
    h.innerHTML = `<kbd>WASD</kbd> move · hold <kbd>E</kbd> do it yourself (${NAME} watches), write, fix · <kbd>Space</kbd> let ${NAME} try the job, or send him off / call him back · night: <kbd>E</kbd> or <kbd>Space</kbd> picks up when he calls · <kbd>P</kbd> pause`;
    help.prepend(h);}
  panel.addEventListener("click",e => {const b = e.target.closest("button[data-d2]"), d = D(); if (!b || !d || G.mode!=="play") return;
    if (b.dataset.d2==="go" && d.phase==="prep") d.pending = "handover";
    else if (b.dataset.d2==="answer") answer();
    b.blur();});
  return panel;
}
let shown = false;
const setText = (id,t) => {const e = $(id); if (e && e.textContent!==t) e.textContent = t;};
function meter(id,v,warnAt,badAt,inverse){
  const e = $(id); if (!e) return; const f = clamp(v/100,0,1);
  e.querySelector("i").style.width = `${f*100}%`; e.querySelector("b").textContent = Math.round(v);
  const bad = inverse ? v<=badAt : v>=badAt, warn = inverse ? v<=warnAt : v>=warnAt;
  e.classList.toggle("bad",bad); e.classList.toggle("warn",!bad && warn);
}
function hud(){
  const S = S_(), d = S && S.d2, on = !!d && ["prep","shift","handover","review","final"].includes(d.phase);
  if (!on && !shown) return;
  const p = ensurePanel();
  if (on!==shown){shown = on; p.hidden = !on; document.body.classList.toggle("d2on",on);}
  lidsHud(d);
  if (!on) return;
  const pr = d.prog, T = d.temp;
  setText("d2-ph", night(d) ? `Night ${pr.shift+1}/${DAYS} · ${SHIFTS[pr.shift].name}` : `Day ${pr.shift+1}/${DAYS} · Handover`);
  setText("d2-clk", clock(d));
  setText("d2-sub", d.phase==="review" ? "Night over." : d.phase==="shift" ? (T.quit ? `${NAME} quit.` : d.call ? (d.call.tired ? "Asleep. Too tired to wake up." : "Asleep. The phone's ringing.") : d.eye>0 ? "Awake. Watching him." : "Asleep.") : `You leave at 18:00 (${Math.max(0,Math.ceil(PREP_LEN-d.t))}s)`);
  $("d2-go").hidden = d.phase!=="prep"; $("d2-ans").hidden = !d.call;
  meter("d2-mst",pr.stress,55,80); meter("d2-mcf",pr.conf,35,15,true);
  $("d2-mhd").hidden = night(d); meter("d2-mhd",d.head||0,50,30,true);
  setText("d2-mood", T.quit ? "😤" : pr.stress>=80 ? "😰" : pr.stress>=55 ? "😬" : pr.conf>=60 ? "😎" : "🙂");
  for (const k of SK){const s = pr.sk[k], row = $("d2-s-"+k); const pp = row.querySelector(".d2pips"), h = pips(s.xp); if (pp.innerHTML!==h) pp.innerHTML = h;
    const open = unlocked(pr,k); row.classList.toggle("locked",!open);
    const ex = s.doc>=DOC_MAX-1e-6 ? 0 : Math.floor(expOf(pr,k)), now = performance.now();
    if (ex>(addSeen[k]??ex)) addFlash[k] = now+ADD_FLASH;   // each new point to add flashes green for a moment
    addSeen[k] = ex;
    const html = esc(open ? `${LEVELS[level(s.xp)][1]} · ${s.doc>0?`📄 runbook ${pct(s.doc)}`:"no runbook"}` : `🔒 after ${needText(k)} reach Practiced`)
      +(ex>=1 ? ` · <span class="d2add${(addFlash[k]||0)>now?" bump":""}">✎${ex} to add</span>` : "");
    const sm = row.querySelector("small"); if (sm.innerHTML!==html) sm.innerHTML = html;}
  setText("d2-k-bot", pr.tools.bot ? `🤖 Patch Bot ${pct(pr.botOk)}` : "🤖 Patch Bot");
  const kit = {bot:pr.tools.bot,portal:pr.tools.portal};
  for (const k in kit) $("d2-k-"+k).classList.toggle("on",!!kit[k]);
  setText("d2-note", d.phase==="shift" ? `📞 Stepped in: ${d.st?d.st.calls:0}${d.st&&d.st.ignored?` · ignored ${d.st.ignored}`:""}` : "Green = done. Hold E at each to fix it.");
  // the header line
  const m = $("h-mod"), html = night(d)
    ? `<b>Night shift</b> · ${NAME} is on his own and you're asleep. If the phone rings, <kbd>E</kbd> or <kbd>Space</kbd> picks up (that's stepping in).`
    : `<b>Teddy's Bright Smile Dental</b> · Day 2 · Show ${NAME} (do jobs beside him), let him try (<kbd>Space</kbd> at a job, stay close), write the first runbooks (hold <kbd>E</kbd> at the wiki), then have him add what he's learned (<kbd>Space</kbd> there). <kbd>Space</kbd> anywhere else sends him off on his own, or calls him back.`;
  if (m.innerHTML!==html) m.innerHTML = G.K(html);
  setText("h-sprint","Day 2");
  const sm = $("hb-up") && $("hb-up").querySelector("small"); if (sm) sm.textContent = night(d) ? "Empty = the client calls you" : "Tonight's budget starts full";
}
const ADD_FLASH = 1100;          // ms the green box stays on a skill's "to add" when it goes up (draw-only)
const addSeen = {}, addFlash = {};
const esc = t => String(t).replace(/[&<>"]/g,c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
// eyelids, the bedside clock and the wake-up zoom (draw-only; eyes() drives them)
const CAM_EASE = 4;            // how fast the camera catches up with him (per second; about a quarter second to close most of the gap)
let camPos = null, camAt = 0;  // where the camera points: real time, outside S
function lidsHud(d){
  const lids = $("d2lids"), cv = $("c"); if (!lids) return;
  const on = !!d && d.phase==="shift" && d.eye!=null;
  lids.hidden = !on; document.body.classList.toggle("d2sleep",on && d.eye<0.5);
  const muff = on && d.eye<0.5; if (muff!==muffled){muffled = muff; setMuffle(muff);}
  const cam = $("d2cam"), rv = on && remote(d); if (cam) cam.hidden = !rv;
  if (!on){if (cv && cv.style.transform) cv.style.transform = ""; if (cv && cv.style.filter) cv.style.filter = ""; return;}
  const bl = blurNow(d), flt = `${rv?"grayscale(.85) sepia(.4) hue-rotate(60deg) saturate(1.7) contrast(1.15) ":""}${bl>0.05?`blur(${bl.toFixed(2)}px)`:""}`.trim();
  if (cv && cv.style.filter!==flt) cv.style.filter = flt;
  if (rv){const m = 22*60+d.t/SHIFT_LEN*480, sec = Math.floor((m%1)*60);
    setText("d2-camt",`${clock(d)}:${String(sec).padStart(2,"0")}`); setText("d2-cam",`CAM ${d.temp.x<380?2:d.temp.x<600?1:3}`);}
  const h = `calc(${((1-d.eye)*50).toFixed(2)}% + ${((1-d.eye)*30).toFixed(1)}px)`, [t,b] = lids.querySelectorAll("i");
  if (t.style.height!==h){t.style.height = h; b.style.height = h;}
  lids.querySelector(".zz").style.opacity = String(Math.max(0,1-d.eye*4)); setText("d2-zclk",clock(d)); setText("d2-znight",`Night ${d.prog.shift+1} of ${DAYS} · ${SHIFTS[d.prog.shift].name}`);
  const ring = $("d2-ring"); ring.hidden = !d.call;
  const S = S_(), tired = !!d.call && d.call.tired;
  setText("d2-zz",`🎧 💤 ${NAME} has the floor · ⚡${Math.floor(S.energy)}`);
  if (d.call) setText("d2-ring", tired ? `📞 ${NAME} is calling · 😴 too tired to wake up · ${Math.ceil(d.call.left)}s`
    : `📞 ${NAME} is calling · ${G.K("press E")} to pick up (⚡−${CALL_COST}) · ${Math.ceil(d.call.left)}s`);
  ring.classList.toggle("tired",!!d.call && tired);
  const z = zoomNow(d), T = d.temp;
  if (cv){   // keep him in the middle of the shot, without showing past the edge of the room
    // the camera eases after him in real time (draw-only), so the ×5 night's bigger steps and sharp turns read as a smooth pan
    const now = performance.now(), dt = Math.min(0.1,(now-camAt)/1000); camAt = now;
    if (z<=1.001 || !camPos || dt<=0) camPos = {x:T.x,y:T.y};
    else {const k = 1-Math.exp(-dt*CAM_EASE); camPos.x += (T.x-camPos.x)*k; camPos.y += (T.y-camPos.y)*k;}
    const fx = clamp(0.5-camPos.x/W*z,1-z,0), fy = clamp(0.5-camPos.y/H*z,1-z,0);
    const tf = z>1.001 ? `translate(${(fx*100).toFixed(3)}%,${(fy*100).toFixed(3)}%) scale(${z.toFixed(3)})` : "";
    if (cv.style.transform!==tf){cv.style.transform = tf; cv.style.transformOrigin = tf ? "0 0" : ""; cv.style.willChange = tf ? "transform" : "";}}
}
const words = () => {const d = D(); if (!d) return null;
  if (d.phase==="shift") return {fix:d.call?"PICK UP":null,grab:["PICK UP",!!d.call]};
  const h = coachHint(); return {fix:null,grab:[h?h[2]:"COACH",!!h]};};
const spraying2 = () => {const d = D(), S = S_(); return !!d && ((!!d.temp && !!d.temp.tgt && (d.temp.tgt.kind==="fire" || d.temp.tgt.kind==="botfire") && spraying(d.temp.ext)) || (!!S.botExt && spraying(S.botExt)));};
const pauseText = () => {const d = D(); return d && d.phase==="shift" ? `${NAME} is paused too. He's grateful.` : `${NAME} is waiting. He's checking his phone.`;};

// headless: play one night from a fresh handover with the given preparation (tests and tuning). Leaves the run in review.
function simulate(setup={}){
  start(); const d = D(); Object.assign(d.prog,clone(setup.prog||{}));
  if (setup.prog && setup.prog.sk) for (const k of SK) d.prog.sk[k] = {...freshProg().sk[k],...setup.prog.sk[k]};
  beginPrep("fresh"); if (setup.clean !== false) S_().racks.forEach(a => a && (a.covered = true));
  d.t = PREP_LEN; handover(); startShift();
  const real = Math.random; Math.random = rngOf(d);
  try {let guard = 0; while (!d.pending && guard++<SHIFT_LEN/STEP+600){if (d.call && setup.answer) answer(); G.update(STEP);}}
  finally {Math.random = real;}
  review(); const sx = {}; for (const k in d.st.sx) sx[k] = Math.round(d.st.sx[k]);
  return {...d.last,stress:Math.round(d.prog.stress),peak:Math.round(d.st.peak),jobs:clone(d.st.jobs),cant:clone(d.st.cant),sx,coffee:d.st.coffee,reopened:d.st.reopened};
}
return {SITE,odds,ring:t => {const d = D(); startCall(d,d.temp,t);},start,act,tick,frame,asleep:() => {const d = D(); return !!d && d.phase==="shift" && asleep(d);},targets,work,did,coach,coachHint,away,collapse,drawUnder,drawOver,hud,words,spraying:spraying2,pauseText,simulate,
  botOdds,botFail,botStuck,SHIFTS,DAYS,SHIFT_LEN,PREP_LEN,freshProg,level,unlocked};
};
})();
