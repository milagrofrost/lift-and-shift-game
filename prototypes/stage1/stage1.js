/* Lift & Shift, Day 2 prototype 4: stage 1, the temp and the ticket system.
   A standalone page that tests one loop: on Day 1's familiar map, find what's driving the temp, freeze it, filter his
   requests yourself while he watches, and let him take over once he's learned the rules.

   The level: the cloud bill is too high and still climbing. The temp sits at the hallway desk building whatever the
   tickets say; servers keep appearing in the cloud room. An unknown rack in the old on-prem room flickers each time a
   ticket dings: it's the ticket system, wired to his desk. Hold E to freeze it. Requests then wait for you at the rack:
   E approves (it goes down the wire and he builds it), Space denies. Deny a request with a flaw once and he learns that
   stamp and bounces those himself. Deny a real one and the requester builds it themselves. Once he knows all four
   stamps he runs the system alone and sweeps old junk off the floor. Get the hourly rate under the client's target
   while he runs it, and the stage ends. Spend past the client's ceiling first and they pull the contract.

   Rules kept from the main game: cosmetic code never uses Math.random, decorative motion stands still under reduced
   motion. This prototype has no randomness at all: tickets come from a fixed deck, so every run plays the same. */
(() => {
"use strict";

/* ==== World layout (Day 1's three rooms) ==== */
const W = 960, H = 560;
const WALLS = [{x:354,y:0,w:12,h:200},{x:354,y:360,w:12,h:200},{x:594,y:0,w:12,h:200},{x:594,y:360,w:12,h:200}];
const RACKS = [];
for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) RACKS.push({x: 72 + c * 105, y: 100 + r * 116});
const WIKI = 1, TSYS = 7;                       // the two unknown racks
const SLOTS = [];
for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) SLOTS.push({x: 636 + c * 58, y: 78 + r * 98});
const DESK = {x: 425, y: 236, w: 110, h: 28}, SEAT = {x: 480, y: 288};
const DOOR_R = {x: 600, y: 280};                // the doorway into the cloud room
const T0 = RACKS[TSYS];
const CABLE = [{x: T0.x + 30, y: T0.y - 6}, {x: 300, y: T0.y - 6}, {x: 336, y: 286}, {x: 380, y: 262}, {x: DESK.x + 4, y: 252}];
const REACH = 58, PR = 15, SPEED = 175, TEMP_SPEED = 150;
const PROBE_TIME = 1.6, FREEZE_TIME = 1.2, SHUT_TIME = 0.9;
const ARRIVE = 3.0, ARRIVE_FROZEN = 3.6;        // seconds between requests (a little slower once someone's checking them)
const WIRE_TIME = 0.7;                          // a request travelling down the cable
const QFULL = 5;                                // Day 1's five-slot queue: full takes nothing new, and escalates
const ESC_WAIT = 12;                            // seconds of full queue per escalation (a dip doesn't reset it)
// Day 1's floor, sliced: patch cycles, fires, outages, breaches and the uptime budget
const PATCH_TIME = 1.2, DOUSE_TIME = 1.6, REBOOT_TIME = 2.0, FIRE_GROW = 1 / 28;
const UPTIME = 100, OUT_BURN = 2, BREACH_BURN = 1.5, UP_REC = 0.4, AUDIT_FINE = 200;
// people who come for you, and the temp's nerves
const USER_SPEED = 120, VP_SPEED = 100, USER_HOLD = 2, VP_HOLD = 3.2, IMMUNE = 1.2, HALL_IN = {x: 480, y: 590};
const THANK_CD = 8, QUIT_AT = 100;
const TARGET = 7.5;                             // the client's hourly target, $/hr
const CEILING = 5000;                           // the most the client will pay before pulling the contract
const STEADY = 6;                               // seconds under target, with the temp in charge, to finish

/* ==== Helpers ==== */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const TOUCH = matchMedia("(pointer:coarse)").matches;
const money = v => `$${v.toFixed(2)}`;
const big = v => `$${Math.round(v).toLocaleString("en-US")}`;

/* ==== Sound (synthesized, no randomness) ==== */
const AU = {on: true, ctx: null};
try { AU.on = localStorage.getItem("las-day2-sound") !== "off"; } catch (e) {}
function audio() {
  if (!AU.on) return null;
  if (!AU.ctx) { try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (AU.ctx.state === "suspended") AU.ctx.resume();
  return AU.ctx;
}
function tone(freq, dur, {type = "sine", vol = 0.08, at = 0, muffle = 0, slide = 0} = {}) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if (muffle) { const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = muffle; o.connect(f); node = f; }
  node.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}
const SFX = {
  ding: () => tone(1320, .18, {vol: .035}),
  thunk: () => tone(90, .22, {type: "square", vol: .055, muffle: 700}),
  stamp: () => tone(180, .07, {type: "square", vol: .05, muffle: 600}),
  bzzt: () => tone(140, .22, {type: "sawtooth", vol: .045, muffle: 1500}),
  done: () => { tone(660, .12, {vol: .07}); tone(880, .16, {vol: .07, at: .09}); },
  reveal: () => { tone(330, .3, {type: "triangle", vol: .08}); tone(247, .5, {type: "triangle", vol: .07, at: .18}); },
  freeze: () => { [1568, 1976, 2349, 2637].forEach((f, k) => tone(f, .5, {type: "sine", vol: .03, at: k * .07})); tone(120, .6, {type: "sawtooth", vol: .025, slide: -60, muffle: 300}); },
  page: () => { tone(880, .06, {type: "triangle", vol: .05}); tone(1175, .1, {type: "triangle", vol: .05, at: .06}); },
  off: () => { tone(520, .1, {type: "triangle", vol: .05, slide: -300}); tone(160, .2, {type: "square", vol: .03, at: .08, muffle: 500}); },
  grumble: () => tone(160, .5, {type: "sawtooth", vol: .03, slide: -60, muffle: 450}),
  sneak: () => { tone(300, .08, {type: "triangle", vol: .035, muffle: 900}); tone(240, .1, {type: "triangle", vol: .035, at: .1, muffle: 900}); },
  bell: () => { [784, 659, 523].forEach((f, k) => tone(f, .4, {type: "triangle", vol: .06, at: k * .25})); },
  fail: () => { [392, 330, 262].forEach((f, k) => tone(f, .45, {type: "square", vol: .035, at: k * .28, muffle: 900})); },
};
function setSound(on) {
  AU.on = on; try { localStorage.setItem("las-day2-sound", on ? "on" : "off"); } catch (e) {}
  $("snd").textContent = on ? "🔊 Sound on" : "🔇 Sound off"; $("snd").setAttribute("aria-pressed", String(on));
  if (on) audio(); else if (AU.ctx) AU.ctx.suspend();
}

/* ==== Words: Mr Paperclip and the temp (kept short) ==== */
const CLIP_LINES = {
  start: "Same old map. Except the bill. And that dinging.",
  hint: "Every time it dings, a server shows up. Where's the ding coming from?",
  found: "It's wired straight to his desk. He's not lazy. He's plugged in.",
  frozen: "Quiet. Now he's waiting for somebody to tell him what's okay. That's you. Briefly.",
  learn: "He's watching you. Do it once and he's got it.",
  approveBad: "You just approved that. In front of him. He took notes.",
  legitDenied: "That one was real. Say no to real work and people build it themselves.",
  handed: "Look at that. He doesn't need you. Rude. Wonderful.",
  shutLegit: "That one was in use. Read the icons first. Or don't, I'm a paperclip.",
  giveUp: "Nobody was at the desk, so somebody did it themselves.",
  escalate: "His queue's been full too long. Someone escalated. Something's on fire now. Classic.",
  fire: "Fire! I'd douse that. Or watch. Watching's also a choice.",
  hot: "The minecoin box is mining heat. Mostly heat.",
  outage: "That one's down. Users have noticed. Users always notice.",
  breach: "Admin forever got used. By someone who isn't us. Shut it down.",
  audit: "Missed a patch. The auditor says hi. And invoiced.",
  stress: "He's drowning. A 'thanks' costs nothing. I'd know, nobody's ever said it to me.",
  vp: "You said no to a VP. He's coming. Look busy. No, look *aligned*.",
  user: "Someone wants an exception. In person. Brace.",
  thank: "Look at him. Recognition: free, and somehow nobody does it.",
};
const THANKS = ["Oh. Thanks.", "Nobody's ever said that.", "…Thanks. Really.", "I'll keep going."];
const ASKS = ["Can I get an exception?", "It's just one VM!", "But I really need it.", "Who approved THAT rule?"];
const VP_LINES = ["Per my last email…", "I don't need a budget code, I need a demo.", "Let's take this offline. Now. Here."];
function clip(key) { if (!S || S.clipSaid[key]) return; S.clipSaid[key] = true; S.clipText = CLIP_LINES[key]; S.clipT = 4.6; }
const LEARN_LINE = {owner: "❓ No owner… no server. Got it.", budget: "✖ No budget code. Bounce.", end: "∞ Never ends? Bounce.", admin: "🔑 Admin forever? Nope.", ok: "✔ Owner, budget, end date… build it. Got it."};

/* ==== Requests ==== */
// A request is junk for exactly one reason (its flaw), or real (no flaw). The four flaws are the four stamps.
const FLAWS = ["owner", "budget", "end", "admin"];
const FLAW_ICON = {owner: "❓", budget: "✖", end: "∞", admin: "🔑", ok: "✔"};
const LESSONS = [...FLAWS, "ok"];          // four stamps for no, and one for yes
const RQ = (who, what, icon, cost, flaw = null, temp = false) => ({who, what, icon, cost, flaw, temp});
const DECK = [
  RQ("🧑", "web scale-out", "🛒", 0.5),
  RQ("🧑", "need a VM thx", "🖥️", 0.5, "owner"),
  RQ("🧑‍💼", "board demo", "📊", 0.7, "budget", true),
  RQ("👩", "vendor SFTP", "📁", 0.4),
  RQ("🧑", "hackathon VM", "🧪", 0.6, "end", true),
  RQ("🧑", "admin, just today", "🖥️", 0.4, "admin"),
  RQ("🧑‍💼", "sales demo · till Fri", "📊", 0.5, null, true),
  RQ("🧑", "minecoin node", "🪙", 1.2, "budget"),
  RQ("👩", "month-end batch", "🧾", 0.5),
  RQ("🧑", "copy of copy of crm", "🖥️", 0.6, "owner"),
  RQ("🧑‍💼", "offsite demo", "📊", 0.6, "end", true),
  RQ("👩", "admin for my cat", "🐈", 0.4, "admin"),
];
// after the first round, the real asks are mostly short-lived: they end on their own (⏳), unlike the junk (∞)
const LATER = {0: RQ("🧑", "load test · 1 day", "🛒", 0.5, null, true), 3: RQ("👩", "vendor trial · 2 wks", "📁", 0.4, null, true), 8: RQ("👩", "month-end batch", "🧾", 0.5, null, true)};
const EXPIRE = 40;                              // seconds a real temporary server lives before its end date
// already on the floor when you arrive: years of yes
const OLD = [
  ["web-store", "🛒", 0.6], ["auth", "🔐", 0.4], ["payroll", "💰", 0.5], ["crm", "📇", 0.5], ["search", "🔎", 0.5], ["billing", "🧾", 0.6], ["mail", "✉️", 0.4],
  ["minecoin", "🪙", 2.2, "budget"], ["hack-vm", "🧪", 0.6, "end"], ["vm-thx", "🖥️", 0.5, "owner"], ["admin-box", "🖥️", 0.4, "admin"],
  ["demo-2023", "📊", 0.7, "end"], ["load-test", "🖥️", 0.8, "budget"], ["crm-copy", "🖥️", 0.6, "owner"], ["admin-jump", "🖥️", 0.4, "admin"],
];
const OLD_SLOTS = [0, 2, 3, 7, 9, 12, 16, 1, 5, 8, 13, 19, 22, 25, 27];

/* ==== Run state ==== */
let NEXT = 1;
function newRun() {
  NEXT = 1;
  const R = {
    t: 0, p: {x: 480, y: 470}, hold: null, prompt: "", clipSaid: {}, clipText: "", clipT: 0,
    racks: RACKS.map((r, i) => ({i, x: r.x, y: r.y, kind: i === WIKI || i === TSYS ? "unknown" : "off", flick: 0})),
    servers: [], deck: 0, nextReq: 2.5, found: false, frozen: false, handed: false, cableT: 0,
    q: [], wire: [], jobs: [], learned: {}, stamps: [], timers: [],
    temp: {x: SEAT.x, y: SEAT.y, state: "desk", t: 0, job: null, path: [], tgt: null, say: "", sayT: 0, stampT: 0, puzzled: 0},
    spent: 0, rate0: 0, built: 0, bounced: 0, served: 0, junkLet: 0, legitDenied: 0, sneaks: 0, oops: 0, swept: 0, youShut: 0, gaveUp: 0,
    steady: 0, done: false, result: null,
    uptime: UPTIME, escT: 0, escI: 0, escalations: 0, audits: 0, outages: 0, breaches: 0,
    stress: 0, thankCD: 0, thanks: 0, people: [], held: null, immune: 2, quit: false, denies: 0,
  };
  OLD.forEach(([name, icon, cost, flaw], k) => R.servers.push(mkServer({what: name, icon, cost, flaw: flaw || null, who: ""}, OLD_SLOTS[k], "old", 0)));
  R.rate0 = R.servers.reduce((s, b) => s + b.cost, 0);
  return R;
}
function mkServer(rq, slot, origin, glow = 1.2) {
  const id = NEXT++, b = {id, slot, x: SLOTS[slot].x, y: SLOTS[slot].y, name: rq.what, icon: rq.icon, cost: rq.cost, flaw: rq.flaw, origin, glow, rq,
    fire: 0, down: false, breach: false};
  // real, lasting servers need patching on Day 1's cycles (staggered, no randomness)
  if (!rq.flaw && !rq.temp) { b.cycle = 55 + (id * 11) % 26; b.left = origin === "old" ? b.cycle * (0.35 + (id * 0.17) % 0.6) : b.cycle; b.covered = false; }
  // junk causes its own incidents: costly no-budget boxes run hot, admin-forever boxes get breached
  if (rq.flaw === "budget" && rq.cost >= 0.8) b.hotT = 38 + (id * 5) % 20;
  if (rq.flaw === "admin") b.breachT = 55 + (id * 7) % 30;
  return b;
}
const patchable = b => b.cycle && !b.down;
const incident = () => S.servers.some(b => b.fire > 0 || b.down || b.breach);
const rate = () => S.servers.reduce((s, b) => s + b.cost, 0);
const freeSlot = near => { const used = new Set(S.servers.map(b => b.slot)); if (S.temp.tgt != null) used.add(S.temp.tgt); let best = -1, bd = 1e9;
  SLOTS.forEach((s, i) => { if (used.has(i)) return; const d = dist(s, near); if (d < bd) { bd = d; best = i; } }); return best; };
const learnedCount = () => LESSONS.filter(f => S.learned[f]).length;

/* ==== Canvas and drawing helpers ==== */
const cs = getComputedStyle(document.documentElement), C = {};
["bg","panel","line","ink","muted","amber","danger","ok","leak","ai","prem","prem-2","hall","hall-2","sky","sky-2","sky-ink","wall","rack","rack-2"].forEach(k => C[k] = cs.getPropertyValue("--" + k).trim());
const EF = "'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
const MONO = '"IBM Plex Mono",Consolas,monospace', DISP = '"Chakra Petch","Segoe UI",sans-serif';
const cv = $("c"), ctx = cv.getContext("2d");
function resize() { const DPR = Math.min(2, window.devicePixelRatio || 1); cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
resize(); addEventListener("resize", resize);
function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
function em(s, x, y, size) { ctx.fillStyle = "#fff"; ctx.font = `${size}px ${EF}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(s, x, y); }
function tx(s, x, y, size, color, {font = MONO, align = "center", weight = 400, max = 0} = {}) {
  ctx.font = `${weight} ${size}px ${font}`;
  if (max) { let sz = size; while (sz > 7 && ctx.measureText(s).width > max) { sz -= 0.5; ctx.font = `${weight} ${sz}px ${font}`; } }
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(s, x, y);
}
const decoT = () => RM ? 0 : S.t;
const pulse = (speed = 6, phase = 0) => RM ? 1 : 0.5 + 0.5 * Math.sin(S.t * speed + phase);

/* ==== Input ==== */
const keys = {}; let grabPressed = false, fixPressed = false, mode = "intro";
const MAP = {ArrowUp: "u", KeyW: "u", ArrowDown: "d", KeyS: "d", ArrowLeft: "l", KeyA: "l", ArrowRight: "r", KeyD: "r", Space: "grab", KeyJ: "grab", KeyE: "fix", KeyK: "fix"};
addEventListener("pointerdown", () => { if (AU.on) audio(); }, {passive: true});
addEventListener("keydown", e => {
  if (AU.on) audio();
  if (e.code === "KeyM" && !e.repeat) { setSound(!AU.on); toast(AU.on ? "🔊 Sound on" : "🔇 Sound off"); return; }
  if (e.code === "KeyP" || e.code === "Escape") { if (mode === "play" || mode === "paused") { e.preventDefault(); togglePause(); } return; }
  if (mode !== "play") return;
  const k = MAP[e.code]; if (!k) return;
  e.preventDefault();
  if (k === "grab" && !keys.grab) grabPressed = true;
  if (k === "fix" && !keys.fix) fixPressed = true;
  keys[k] = true;
});
addEventListener("keyup", e => { const k = MAP[e.code]; if (k) keys[k] = false; });
addEventListener("blur", () => { for (const k in keys) keys[k] = false; if (mode === "play") togglePause(); });
$("snd").addEventListener("click", () => { audio(); setSound(!AU.on); });
$("smiley").addEventListener("click", () => { if (mode === "intro") return; hideOverlay(); start(); });
const capture = (el, id) => { try { el.setPointerCapture(id); } catch (e) {} };
const stick = {on: false, x: 0, y: 0, id: null, ox: 0, oy: 0}, STICK_R = 66;
function stickDraw(dx = 0, dy = 0) { const d = Math.hypot(dx, dy), k = d > STICK_R ? STICK_R / d : 1; $("stick-knob").style.transform = `translate(${dx * k}px,${dy * k}px)`; }
function stickEnd() { const z = $("stick-zone"), b = $("stick-base"); stick.on = false; stick.id = null; stick.x = stick.y = 0; z.classList.remove("on"); b.style.left = b.style.top = b.style.bottom = ""; stickDraw(); }
{
  const z = $("stick-zone"), b = $("stick-base");
  z.addEventListener("pointerdown", e => { if (stick.id !== null) return; e.preventDefault(); capture(z, e.pointerId);
    stick.id = e.pointerId; stick.on = true; stick.ox = e.clientX; stick.oy = e.clientY; z.classList.add("on");
    b.style.left = `${e.clientX - 66}px`; b.style.top = `${e.clientY - 66}px`; b.style.bottom = "auto"; stickDraw(); });
  z.addEventListener("pointermove", e => { if (e.pointerId !== stick.id) return; const dx = e.clientX - stick.ox, dy = e.clientY - stick.oy, d = Math.hypot(dx, dy);
    if (d < STICK_R * 0.15) { stick.x = stick.y = 0; } else { const m = Math.min(1, d / (STICK_R * 0.7)); stick.x = dx / d * m; stick.y = dy / d * m; } stickDraw(dx, dy); });
  const up = e => { if (e.pointerId === stick.id) stickEnd(); };
  z.addEventListener("pointerup", up); z.addEventListener("pointercancel", up);
  $("touch").addEventListener("contextmenu", e => e.preventDefault());
}
document.querySelectorAll("#touch button[data-k]").forEach(b => {
  const k = b.dataset.k;
  b.addEventListener("pointerdown", e => { e.preventDefault(); capture(b, e.pointerId); if (mode !== "play") return;
    if (k === "grab" && !keys.grab) grabPressed = true; if (k === "fix" && !keys.fix) fixPressed = true; keys[k] = true; b.classList.add("on"); });
  ["pointerup", "pointercancel"].forEach(ev => b.addEventListener(ev, () => { keys[k] = false; b.classList.remove("on"); }));
});
$("t-pause").addEventListener("pointerdown", e => { e.preventDefault(); if (mode === "play" || mode === "paused") togglePause(); });

/* ==== Feedback ==== */
function toast(msg) {
  const el = document.createElement("div"); el.className = "toast"; el.textContent = msg;
  const box = $("toasts"); box.appendChild(el); while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), 4300);
}
const floats = [];
function fl(x, y, text, color) { floats.push({x, y, text, color, t: 0}); }
// delays on game time (pauses with the game, and steps with the test hook)
function later(sec, fn) { S.timers.push({t: sec, fn}); }
function tickTimers(dt) { const due = []; for (const x of S.timers) { x.t -= dt; if (x.t <= 0) due.push(x); } S.timers = S.timers.filter(x => x.t > 0); for (const x of due) if (!S.done) x.fn(); }
function tempSay(text, t = 3) { S.temp.say = text; S.temp.sayT = t; }

/* ==== Movement ==== */
function hitsWall(x, y, r) { for (const w of WALLS) { const cx = clamp(x, w.x, w.x + w.w), cy = clamp(y, w.y, w.y + w.h); if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true; }
  return x > DESK.x - r && x < DESK.x + DESK.w + r && y > DESK.y - r && y < DESK.y + DESK.h + 4; }
function moveP(dx, dy, r) {
  const P = S.p;
  if (!hitsWall(P.x + dx, P.y, r)) P.x += dx;
  if (!hitsWall(P.x, P.y + dy, r)) P.y += dy;
  P.x = clamp(P.x, r, W - r); P.y = clamp(P.y, r + 30, H - r);
}
function walkTo(o, tgt, speed, dt) { const d = dist(o, tgt); if (d < 2) { o.x = tgt.x; o.y = tgt.y; return true; } const s = Math.min(d, speed * dt); o.x += (tgt.x - o.x) / d * s; o.y += (tgt.y - o.y) / d * s; return false; }
// the temp walks through the doorway, never through walls
const pathTo = slot => { const s = SLOTS[slot]; return [{x: DOOR_R.x - 30, y: DOOR_R.y}, {x: DOOR_R.x + 24, y: DOOR_R.y}, {x: s.x - 30, y: s.y + 12}]; };
const pathHome = () => [{x: DOOR_R.x + 24, y: DOOR_R.y}, {x: DOOR_R.x - 30, y: DOOR_R.y}, {x: SEAT.x, y: SEAT.y}];
function followPath(o, dt) { while (o.path.length && walkTo(o, o.path[0], TEMP_SPEED, dt)) o.path.shift(); return !o.path.length; }

/* ==== What the player is pointing at ==== */
function target() {
  const P = S.p;
  if (P.x < 354) { // on-prem: the two unknown racks, or the ticket system once found
    let best = null, bd = REACH;
    for (const r of S.racks) { if (r.kind === "off" || r.kind === "wiki") continue; const d = dist(P, r); if (d < bd) { bd = d; best = r; } }
    return best ? {rack: best, x: best.x, y: best.y} : null;
  }
  if (P.x > 606) { let best = null, bd = 36; for (const b of S.servers) { const d = dist(P, b); if (d < bd) { bd = d; best = b; } } return best ? {server: best, x: best.x, y: best.y} : null; }
  if (!S.quit && dist(P, S.temp) < 48) return {temp: true, x: S.temp.x, y: S.temp.y};
  return null;
}
const atTsys = a => a && a.rack && a.rack.kind === "tsys";
const filtering = a => atTsys(a) && S.frozen && !S.handed && S.q.length;
function fixWord(a) {
  if (!a || S.done || S.held) return "";
  if (a.temp) return S.thankCD <= 0 ? "THANK" : "";
  if (a.server) { const b = a.server;
    if (b.down) return "REBOOT";
    if (b.fire > 0) return "DOUSE";
    if (b.flaw || b.origin === "sneak") return "SHUT";
    return patchable(b) && !b.covered ? "PATCH" : ""; }
  if (a.rack.kind === "unknown") return "PROBE";
  if (atTsys(a) && !S.frozen) return "FREEZE";
  if (filtering(a)) return "APPROVE";
  return "";
}
const HOLDS = {PROBE: PROBE_TIME, FREEZE: FREEZE_TIME, SHUT: SHUT_TIME, PATCH: PATCH_TIME, DOUSE: DOUSE_TIME, REBOOT: REBOOT_TIME};
const grabWord = a => !S.held && filtering(a) ? "DENY" : "";
function promptText(a) {
  if (S.held) return "…";
  const w = fixWord(a); if (!w) return "";
  const hold = t => TOUCH ? `Hold ${w}: ${t}` : `Hold E: ${t}`;
  if (w === "PROBE") return hold("investigate");
  if (w === "FREEZE") return hold("freeze it");
  if (w === "SHUT") return hold(a.server.breach ? "shut it down (breached)" : "shut it down");
  if (w === "PATCH") return hold("patch");
  if (w === "DOUSE") return hold("put it out");
  if (w === "REBOOT") return hold("bring it back");
  if (w === "THANK") return TOUCH ? "THANK him" : "E: thank him";
  return TOUCH ? "APPROVE or DENY" : "E: approve · Space: deny";
}

/* ==== Actions ==== */
function probe(r) {
  SFX.done();
  if (r.i === WIKI) { r.kind = "wiki"; fl(r.x, r.y - 42, "OLD WIKI · FINE", C.ok); return; }
  r.kind = "tsys"; S.found = true; S.cableT = 0; SFX.reveal(); clip("found");
  fl(r.x, r.y - 42, "TICKET SYSTEM", C.amber);
}
function freeze() {
  S.frozen = true; SFX.freeze(); clip("frozen");
  fl(T0.x, T0.y - 42, "❄ FROZEN", C.leak);
  tempSay("…Now what?", 4); S.temp.puzzled = 1;
}
function arrive() {
  const i = S.deck % DECK.length, rq = S.deck >= DECK.length && LATER[i] ? LATER[i] : DECK[i]; S.deck++;
  SFX.ding(); S.racks[TSYS].flick = 0.35;
  route(Object.assign({}, rq));
}
// where a request goes: down the wire to the temp, or into the queue at the frozen ticket system for you
function route(rq) {
  // Day 1's rule for his pile too: five waiting is full. Full takes nothing new (it escalates instead).
  const pileFull = () => S.jobs.length + S.wire.length >= QFULL;
  if (!S.frozen) { if (pileFull()) { fl(SEAT.x, SEAT.y - 70, "QUEUE FULL", C.danger); return; } return send(rq, "build"); }
  if (S.handed) return send(rq, rq.flaw ? "bounce" : "build");
  if (rq.flaw && S.learned[rq.flaw]) return send(rq, "bounce");
  if (!rq.flaw && S.learned.ok) return send(rq, "build");
  if (S.q.length >= QFULL) {   // Day 1's rule: a full queue takes nothing new. Real asks get built around you.
    S.gaveUp++;
    if (!rq.flaw) { later(1.5, () => sneakIn(rq)); clip("giveUp"); } else fl(T0.x, T0.y - 60, "GAVE UP", C.muted);
    return;
  }
  S.q.push(rq);
}
function send(rq, action) { S.wire.push({rq, action, t: 0}); }
function approve() {
  const rq = S.q.shift(); SFX.stamp(); fl(T0.x, T0.y - 60, "✔ APPROVED", C.ok);
  if (rq.flaw) clip("approveBad"); else if (!S.learned.ok) learn("ok");
  send(rq, "build");
}
function deny() {
  const rq = S.q.shift(); SFX.bzzt(); S.stamps.push({x: T0.x, y: T0.y - 66, t: 0, text: "DENIED"});
  // saying no has a cost in person: VPs come to argue, and so does every other requester
  S.denies++;
  if (rq.who === "🧑‍💼") { if (!S.people.some(p => p.vp)) spawnPerson(true, rq.who); }
  else if (S.denies % 2 === 0) spawnPerson(false, rq.who);
  if (rq.flaw) {
    S.bounced++;
    if (!S.learned[rq.flaw]) learn(rq.flaw);
  } else {
    S.legitDenied++; SFX.grumble(); clip("legitDenied");
    later(1.5, () => sneakIn(rq));
    tempSay("?", 1.5);
  }
}
function learn(f) {
  S.learned[f] = true; SFX.page(); clip("learn"); S.stress = Math.max(0, S.stress - 10);
  tempSay(LEARN_LINE[f], 3.2); fl(SEAT.x, SEAT.y - 56, `📕 +${FLAW_ICON[f]}`, C.amber);
  // what's already waiting with the same flaw goes to him now
  const fits = rq => f === "ok" ? !rq.flaw : rq.flaw === f;
  const mine = S.q.filter(fits); S.q = S.q.filter(rq => !fits(rq)); mine.forEach(rq => send(rq, f === "ok" ? "build" : "bounce"));
  if (learnedCount() === LESSONS.length) handOver();
}
function handOver() {
  S.handed = true; SFX.bell(); clip("handed");
  later(3.3, () => tempSay("I've got it from here.", 3.5));
  const rest = S.q; S.q = []; rest.forEach(rq => send(rq, rq.flaw ? "bounce" : "build"));
}
function sneakIn(rq) {
  const slot = freeSlot({x: 930, y: 500}); if (slot < 0) return;
  const b = mkServer(Object.assign({}, rq, {cost: rq.cost * 1.8}), slot, "sneak"); b.flaw = null;
  S.servers.push(b); S.sneaks++; SFX.sneak(); fl(b.x, b.y - 42, "BUILT AROUND YOU", C.danger);
}
/* ==== Day 1's floor: patches, escalations, fires, outages, breaches ==== */
function doHold(w, a) {
  const b = a.server;
  if (w === "PROBE") probe(a.rack);
  else if (w === "FREEZE") freeze();
  else if (w === "SHUT") shutDown(b, false);
  else if (w === "PATCH") { b.covered = true; SFX.done(); fl(b.x, b.y - 42, "✓ PATCHED", C.ok); }
  else if (w === "DOUSE") { b.fire = 0; SFX.done(); fl(b.x, b.y - 42, "PUT OUT", C.ok); if (b.hotT !== undefined) b.hotT = 45; }
  else if (w === "REBOOT") { b.down = false; SFX.done(); fl(b.x, b.y - 42, "BACK UP", C.ok); }
}
function escalate() {
  S.escalations++; S.stress = Math.min(QUIT_AT, S.stress + 10); clip("escalate");
  tone(392, .18, {type: "square", vol: .05}); tone(523, .25, {type: "square", vol: .05, at: .16});
  fl(SEAT.x, SEAT.y - 70, "🚨 ESCALATED", C.danger);
  const live = S.servers.filter(b => !b.flaw && !b.down && b.fire === 0); if (!live.length) return;
  const b = live[S.escI++ % live.length]; b.fire = 0.05;
}
function tickFloor(dt) {
  // escalation: Day 1's rule, a queue held full for 12 seconds. Pressure slows during incidents.
  const full = S.frozen && !S.handed ? S.q.length >= QFULL : S.jobs.length + S.wire.length >= QFULL;
  if (full) {
    const slow = S.servers.some(b => b.down || b.breach) ? 0.25 : S.servers.some(b => b.fire > 0) ? 0.5 : 1;
    S.escT += dt * slow; if (S.escT >= ESC_WAIT) { S.escT = 0; escalate(); }
  }
  for (const b of [...S.servers]) {
    if (b.hotT !== undefined && b.fire === 0) { b.hotT -= dt; if (b.hotT <= 0) { b.fire = 0.05; b.hotT = 45; clip("hot"); } }
    if (b.breachT !== undefined && !b.breach) { b.breachT -= dt; if (b.breachT <= 0) { b.breach = true; S.breaches++; SFX.grumble(); fl(b.x, b.y - 42, "BREACH", C.danger); clip("breach"); } }
    if (b.fire > 0 && !b.down) {
      if (b.fire < 0.06) clip("fire");
      b.fire += FIRE_GROW * dt;
      if (b.fire >= 1) {
        if (b.flaw) {   // junk burns out, and the fire jumps to the nearest real server
          S.servers = S.servers.filter(x => x !== b); fl(b.x, b.y - 42, "BURNT OUT", C.danger);
          const n = S.servers.filter(x => !x.flaw && !x.down && x.fire === 0).sort((p, q) => dist(p, b) - dist(q, b))[0];
          if (n) n.fire = 0.1;
        } else { b.fire = 0; b.down = true; S.outages++; SFX.grumble(); fl(b.x, b.y - 42, "OFFLINE", C.danger); clip("outage"); }
      }
    }
    if (patchable(b)) {
      b.left -= dt;
      if (b.left <= 0) {
        if (!b.covered) { S.spent += AUDIT_FINE; S.audits++; fl(b.x, b.y - 42, `AUDIT FAILED −$${AUDIT_FINE}`, C.danger); clip("audit"); }
        b.covered = false; b.left = b.cycle;
      }
    }
  }
  // the uptime budget: outages and breaches burn it; it recovers slowly when nothing's wrong
  const burn = S.servers.filter(b => b.down).length * OUT_BURN + S.servers.filter(b => b.breach).length * BREACH_BURN;
  S.uptime = burn ? S.uptime - burn * dt : Math.min(UPTIME, S.uptime + UP_REC * dt);
  if (S.uptime <= 0) finish(false, "uptime");
}

/* ==== The temp's nerves, and thanking him ==== */
function tickStress(dt) {
  if (S.quit) return;
  if (S.thankCD > 0) S.thankCD -= dt;
  const backlog = S.jobs.length + S.wire.length + (S.temp.job ? 1 : 0);
  const d = backlog > 2 ? (backlog - 2) * 0.6 : -4;
  S.stress = clamp(S.stress + (S.handed ? d - 1 : d) * dt, 0, QUIT_AT);
  if (S.stress > 60) clip("stress");
  if (S.stress >= QUIT_AT) quit();
}
function thank() {
  S.thankCD = THANK_CD; S.thanks++; S.stress = Math.max(0, S.stress - 25);
  tone(660, .12, {type: "triangle", vol: .05}); tone(990, .18, {type: "triangle", vol: .05, at: .1});
  fl(S.temp.x, S.temp.y - 40, "🙏", C.ok); tempSay(THANKS[(S.thanks - 1) % THANKS.length], 2.5); clip("thank");
}
function quit() {
  S.quit = true; const M = S.temp; M.job = null; M.state = "quit"; M.path = [{x: SEAT.x, y: 420}, HALL_IN];
  tempSay("I can't do this. I'm out.", 4); SFX.fail();
  later(3, () => finish(false, "quit"));
}

/* ==== People who come for you ==== */
function spawnPerson(vp, who) {
  S.people.push({x: HALL_IN.x, y: H - 8, vp, who: vp ? "🧑‍💼" : who, state: "in", t: 0, say: "", sayT: 0});
  clip(vp ? "vp" : "user");
}
function tickPeople(dt) {
  if (S.immune > 0) S.immune -= dt;
  for (const u of S.people) {
    u.t += dt; if (u.sayT > 0) u.sayT -= dt;
    if (u.state === "in") {
      walkTo(u, S.p, u.vp ? VP_SPEED : USER_SPEED, dt);
      if (u.t > 30) u.state = "out";   // they give up eventually
      else if (dist(u, S.p) < 26 && S.immune <= 0 && !S.held) {
        S.held = u; u.state = "hold"; u.hold = u.vp ? VP_HOLD : USER_HOLD; S.hold = null;
        u.say = u.vp ? VP_LINES[S.denies % VP_LINES.length] : ASKS[S.denies % ASKS.length]; u.sayT = u.hold;
      }
    } else if (u.state === "hold") {
      u.hold -= dt; if (u.hold <= 0) { S.held = null; S.immune = IMMUNE; u.state = "out"; }
    } else if (walkTo(u, HALL_IN, u.vp ? VP_SPEED : USER_SPEED, dt)) u.gone = true;
  }
  S.people = S.people.filter(u => !u.gone);
}

function shutDown(b, byTemp) {
  S.servers = S.servers.filter(x => x !== b); SFX.off();
  fl(b.x, b.y - 42, `−${money(b.cost)}/hr`, C.ok);
  if (byTemp) { S.swept++; return; }
  S.youShut++;
  if (!b.flaw) {   // it was in use: someone notices, and asks again
    S.oops++; SFX.grumble(); clip("shutLegit"); fl(b.x, b.y - 58, "😠", C.danger);
    later(2.5, () => route(Object.assign({}, b.rq, {cost: b.origin === "sneak" ? b.rq.cost / 1.8 : b.cost, flaw: null})));
  }
}

/* ==== The temp ==== */
function tickWire(dt) {
  for (const w of S.wire) w.t += dt;
  const arrived = S.wire.filter(w => w.t >= WIRE_TIME); S.wire = S.wire.filter(w => w.t < WIRE_TIME);
  for (const w of arrived) S.jobs.push(w);
}
function tickTemp(dt) {
  const M = S.temp;
  if (M.sayT > 0) M.sayT -= dt;
  if (M.stampT > 0) M.stampT -= dt;
  if (M.puzzled > 0 && S.jobs.length) M.puzzled = 0;
  switch (M.state) {
    case "desk":
      if (!walkTo(M, SEAT, TEMP_SPEED, dt)) return;
      if (S.jobs.length) { M.job = S.jobs.shift(); M.state = "read"; M.t = 0.45; return; }
      if (S.handed) { // between tickets he sweeps the floor with his rulebook
        const junk = S.servers.filter(b => b.flaw && b !== S.p.busy).sort((a, b) => dist(a, DOOR_R) - dist(b, DOOR_R))[0];
        if (junk) { M.sweep = junk; M.path = pathTo(junk.slot); M.state = "sweepWalk"; }
      }
      return;
    case "read": {
      M.t -= dt; if (M.t > 0) return;
      const {rq, action} = M.job;
      if (action === "bounce") { M.stampT = 0.3; SFX.bzzt(); S.stamps.push({x: SEAT.x + 50, y: SEAT.y - 46, t: 0, text: "BOUNCE"}); if (S.frozen) S.bounced++; M.job = null; M.state = "desk"; return; }
      const slot = freeSlot(DOOR_R); if (slot < 0) { M.t = 0.6; return; }   // no room: he waits with it
      M.tgt = slot; M.path = pathTo(slot); M.stampT = 0.3; SFX.stamp(); M.state = "walk"; return; }
    case "walk":
      if (!followPath(M, dt)) return;
      M.state = "spawn"; M.t = 0.35; return;
    case "spawn": {
      M.t -= dt; if (M.t > 0) return;
      const rq = M.job.rq, b = mkServer(rq, M.tgt, S.frozen ? "ticket" : "early");
      S.servers.push(b); S.built++; SFX.thunk(); fl(b.x, b.y - 42, `+${money(rq.cost)}/hr`, rq.flaw ? C.danger : C.amber);
      if (S.frozen) { if (rq.flaw) S.junkLet++; else S.served++; }
      M.job = null; M.tgt = null; M.path = pathHome(); M.state = "home"; return; }
    case "home":
      if (followPath(M, dt)) M.state = "desk"; return;
    case "sweepWalk":
      if (!S.servers.includes(M.sweep)) { M.sweep = null; M.path = pathHome(); M.state = "home"; return; }
      if (!followPath(M, dt)) return;
      M.state = "sweep"; M.t = 0.5; M.stampT = 0.3; SFX.stamp(); return;
    case "sweep":
      M.t -= dt; if (M.t > 0) return;
      if (S.servers.includes(M.sweep)) shutDown(M.sweep, true);
      M.sweep = null; M.path = pathHome(); M.state = "home"; return;
    case "quit":
      followPath(M, dt); return;
  }
}

/* ==== Simulation ==== */
function update(dt) {
  S.t += dt;
  const P = S.p;
  const stk = stick.on && (stick.x || stick.y);
  const mx = stk ? stick.x : (keys.r ? 1 : 0) - (keys.l ? 1 : 0), my = stk ? stick.y : (keys.d ? 1 : 0) - (keys.u ? 1 : 0), m = stk ? 1 : Math.hypot(mx, my) || 1;
  if (!S.held) moveP(mx / m * SPEED * dt, my / m * SPEED * dt, PR);

  const a = target();
  const w = fixWord(a);
  P.busy = null;
  if (keys.fix && HOLDS[w]) {
    const key = a.rack || a.server;
    if (!S.hold || S.hold.key !== key || S.hold.w !== w) S.hold = {key, a, w, t: 0, need: HOLDS[w]};
    S.hold.t += dt; if (a.server) P.busy = a.server;
    if (S.hold.t >= S.hold.need) { S.hold = null; keys.fix = false; doHold(w, a); }
  } else S.hold = null;
  if (fixPressed) { fixPressed = false; if (w === "APPROVE") approve(); else if (w === "THANK") thank(); }
  if (grabPressed) { grabPressed = false; if (grabWord(a) === "DENY") deny(); }
  S.prompt = promptText(a);

  S.nextReq -= dt;
  if (S.nextReq <= 0 && !S.quit) { S.nextReq = S.frozen ? ARRIVE_FROZEN : ARRIVE; arrive(); }
  tickTimers(dt); tickWire(dt); tickTemp(dt); tickFloor(dt); tickStress(dt); tickPeople(dt);
  if (S.found && S.cableT < 1) S.cableT = Math.min(1, S.cableT + dt / (RM ? 0.01 : 1.2));
  if (!S.found && S.t > 40) clip("hint");

  S.spent += rate() * dt;
  const r = rate();
  // like Day 1, an open incident blocks finishing
  if (S.handed && r <= TARGET && !incident()) { S.steady += dt; if (S.steady >= STEADY) finish(true); } else S.steady = 0;
  if (!S.done && S.spent >= CEILING) finish(false, "ceiling");

  for (const rk of S.racks) if (rk.flick > 0) rk.flick -= dt;
  for (const b of S.servers) if (b.glow > 0) b.glow -= dt;
  // real temporary servers end on their date; ∞ junk never does
  for (const b of S.servers.filter(b => b.rq.temp && !b.flaw && b.origin !== "sneak")) {
    b.age = (b.age || 0) + dt;
    if (b.age >= EXPIRE) { S.servers = S.servers.filter(x => x !== b); fl(b.x, b.y - 42, "⏳ ENDED", C.ok); }
  }
  for (const s of S.stamps) s.t += dt; S.stamps = S.stamps.filter(s => s.t < 0.9);
  if (S.clipT > 0) S.clipT -= dt;
  for (const f of floats) f.t += dt;
  while (floats.length && floats[0].t > 1.4) floats.shift();
}

/* ==== Drawing ==== */
function drawFloor() {
  // on-prem: dusty and mostly switched off since Day 1
  ctx.fillStyle = C.prem; ctx.fillRect(0, 0, 360, H);
  ctx.fillStyle = C["prem-2"]; for (let x = 0; x < 360; x += 40) for (let y = 0; y < H; y += 40) if (((x + y) / 40) % 2 === 0) ctx.fillRect(x, y, 40, 40);
  ctx.fillStyle = C.hall; ctx.fillRect(360, 0, 240, H);
  ctx.strokeStyle = C["hall-2"]; ctx.lineWidth = 2; for (let y = 0; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(360, y); ctx.lineTo(600, y); ctx.stroke(); }
  ctx.save(); ctx.beginPath(); ctx.rect(600, 0, 360, H); ctx.clip();
  ctx.fillStyle = C.sky; ctx.fillRect(600, 0, 360, H); ctx.fillStyle = C["sky-2"];
  for (let k = 0; k < 6; k++) { const cx = 600 + ((k * 131 + decoT() * (6 + k)) % 460) - 50, cy = 40 + k * 92; ctx.globalAlpha = .7;
    for (const [ox, oy, r] of [[0, 0, 26], [24, -8, 20], [46, 2, 22], [22, 10, 20]]) { ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, 0, 7); ctx.fill(); } }
  ctx.globalAlpha = 1; ctx.restore();
  ctx.fillStyle = C.wall; for (const w of WALLS) ctx.fillRect(w.x, w.y, w.w, w.h);
  tx("ON-PREM · SWITCHED OFF", 16, 22, 13, "#a88a5c", {font: DISP, align: "left", weight: 700});
  tx("CLOUD · CONVENIENCE FEE LTD.", 944, 22, 13, C["sky-ink"], {font: DISP, align: "right", weight: 700});
}
function drawRack(r) {
  const x = r.x - 34, y = r.y - 33;
  if (r.kind === "off" || r.kind === "wiki") {
    ctx.fillStyle = "#211b19"; rr(x, y, 68, 66, 6); ctx.fill(); ctx.strokeStyle = "#3a302c"; ctx.lineWidth = 1.5; rr(x, y, 68, 66, 6); ctx.stroke();
    tx(r.kind === "wiki" ? "WIKI" : "OFF", r.x, r.y, 9, r.kind === "wiki" ? "#6f8a6a" : "#5a4d47", {font: DISP, weight: 700});
    return;
  }
  if (r.kind === "unknown") {
    const lit = r.flick > 0;
    ctx.fillStyle = lit ? "#3b3326" : "#2c2522"; rr(x, y, 68, 66, 6); ctx.fill();
    ctx.setLineDash([3, 3]); ctx.strokeStyle = lit ? "#ffcf87" : "#6d5d52"; ctx.lineWidth = 1.5; rr(x, y, 68, 66, 6); ctx.stroke(); ctx.setLineDash([]);
    const busy = S.hold && S.hold.key === r;
    tx("?", r.x, r.y - 8 + (busy && !RM ? Math.sin(S.t * 10) * 2 : 0), 26, busy ? C.amber : lit ? "#ffe2b0" : "#a08c7c", {font: DISP, weight: 700});
    tx(busy ? "INVESTIGATING" : "unknown", r.x, r.y + 16, busy ? 8 : 9.5, busy ? C.amber : "#8a7a6d", {font: busy ? DISP : MONO, weight: busy ? 700 : 400, max: 62});
    if (lit && r.i === TSYS) { ctx.fillStyle = `rgba(255,207,135,${r.flick * 1.6})`; ctx.beginPath(); ctx.arc(r.x + 22, r.y - 22, 3, 0, 7); ctx.fill(); }
    return;
  }
  // the ticket system: a beige box with a blinking light; frosted blue once frozen
  ctx.fillStyle = S.frozen && !S.handed ? "#a9c6d6" : "#c8bfa6"; rr(x + 8, y + 4, 52, 58, 5); ctx.fill();
  ctx.strokeStyle = S.frozen && !S.handed ? C.leak : "#7d745e"; ctx.lineWidth = 2; rr(x + 8, y + 4, 52, 58, 5); ctx.stroke();
  ctx.fillStyle = "#6e6550"; for (let k = 0; k < 4; k++) ctx.fillRect(r.x - 16, y + 14 + k * 6, 32, 2);
  const blink = r.flick > 0 || (!S.frozen && (RM || Math.sin(S.t * 6) > 0.4));
  ctx.fillStyle = blink ? "#5fd38d" : "#235a3a"; ctx.beginPath(); ctx.arc(r.x + 16, y + 52, 3, 0, 7); ctx.fill();
  if (S.frozen && !S.handed) em("❄", r.x - 14, y + 50, 14);
  tx(S.handed ? "TICKETS · HIS" : S.frozen ? "TICKETS · FROZEN" : "TICKETS", r.x, y + 74, 8.5, S.frozen && !S.handed ? "#9fd6ff" : "#e8dcc0", {font: DISP, weight: 700});
}
function cablePoint(f) {
  // a point a fraction f of the way along the cable
  const segs = []; let total = 0;
  for (let i = 1; i < CABLE.length; i++) { const l = dist(CABLE[i - 1], CABLE[i]); segs.push(l); total += l; }
  let d = f * total;
  for (let i = 0; i < segs.length; i++) { if (d <= segs[i]) { const k = d / segs[i], a = CABLE[i], b = CABLE[i + 1]; return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k}; } d -= segs[i]; }
  return CABLE[CABLE.length - 1];
}
function drawCable() {
  if (!S.found) return;
  // drawn out from the ticket system to his desk when you find it
  const n = 40, upto = Math.round(n * S.cableT);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = S.frozen && !S.handed ? "rgba(69,174,252,.55)" : "rgba(255,181,71,.75)"; ctx.lineWidth = 4;
  ctx.beginPath(); for (let k = 0; k <= upto; k++) { const p = cablePoint(k / n); if (k) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); } ctx.stroke();
  ctx.lineCap = "butt";
  for (const w of S.wire) { const p = cablePoint(w.t / WIRE_TIME); ctx.fillStyle = w.action === "bounce" ? C.danger : "#fff4dc"; ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, 7); ctx.fill(); }
}
function drawDesk() {
  ctx.fillStyle = "#4a3d33"; rr(DESK.x, DESK.y, DESK.w, DESK.h, 4); ctx.fill();
  ctx.fillStyle = "#1c2328"; rr(SEAT.x - 22, DESK.y - 24, 44, 26, 3); ctx.fill();
  ctx.fillStyle = S.frozen && !S.handed && !S.jobs.length ? "#2a3a44" : "#8fd3ff"; ctx.fillRect(SEAT.x - 19, DESK.y - 21, 38, 19);
  const pile = Math.min(12, S.jobs.length + S.wire.length);
  for (let k = 0; k < pile; k++) { ctx.fillStyle = k % 2 ? "#e9e3cf" : "#f6f1de"; ctx.fillRect(DESK.x + 80 + (k % 3) - 1, DESK.y - 2 - k * 3, 24, 3); }
  if (learnedCount()) { ctx.fillStyle = "#8a2a20"; rr(DESK.x + 8, DESK.y + 6, 22, 16, 2); ctx.fill(); tx("📕", DESK.x + 19, DESK.y + 14, 11, "#fff"); }
}
function drawServer(b) {
  const x = b.x - 24, y = b.y - 29, w = 48, h = 58;
  ctx.fillStyle = "rgba(255,255,255,.9)"; rr(x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = b.origin === "sneak" ? C.danger : b.flaw ? "#c98a3a" : "#3d8fc4"; ctx.lineWidth = 2; rr(x, y, w, h, 10); ctx.stroke();
  em(b.icon, b.x, b.y - 12, 18);
  tx(b.name, b.x, b.y + 8, 8, C["sky-ink"], {max: w - 4, weight: 600});
  // the one icon that matters: what's wrong with it, or ✔
  const tag = b.origin === "sneak" ? "⚠" : b.flaw ? FLAW_ICON[b.flaw] : b.rq.temp ? "⏳" : "✔";
  tx(tag, b.x, b.y + (tag === "∞" ? 20 : 21), tag === "∞" ? 17 : 11, b.origin === "sneak" ? C.danger : b.flaw ? "#b5461f" : "#2c7a4b", {font: tag === "∞" ? DISP : EF, weight: 700});
  if (b.glow > 0) { ctx.strokeStyle = `rgba(255,181,71,${Math.min(1, b.glow)})`; ctx.lineWidth = 3; rr(x - 3, y - 3, w + 6, h + 6, 12); ctx.stroke(); }
  // Day 1's states: patch circle (only while uncovered), covered bar, fire, offline, breach
  if (patchable(b)) {
    const f = b.left / b.cycle;
    if (b.covered) { ctx.fillStyle = "rgba(29,64,88,.15)"; ctx.fillRect(x + 6, y + h + 3, w - 12, 3); ctx.fillStyle = C.ok; ctx.fillRect(x + 6, y + h + 3, (w - 12) * f, 3); tx("✓", x + w - 2, y + 2, 10, "#2c7a4b", {weight: 700}); }
    else if (f < 0.5) { const col = f < 0.25 ? C.danger : C.amber; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + w - 2, y + 2, 8, 0, 7); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + w - 2, y + 2, 6.5, -Math.PI / 2, -Math.PI / 2 + f * 2 * Math.PI); ctx.stroke(); }
  }
  if (b.fire > 0) {
    ctx.fillStyle = `rgba(255,93,77,${0.18 + b.fire * 0.35})`; rr(x, y, w, h, 10); ctx.fill();
    em("🔥", b.x + (RM ? 0 : Math.sin(S.t * 9 + b.id) * 1.5), y + 4, 14 + b.fire * 10);
    ctx.strokeStyle = C.danger; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, 32, -Math.PI / 2, -Math.PI / 2 + b.fire * 2 * Math.PI); ctx.stroke();
  }
  if (b.down) { ctx.fillStyle = "rgba(20,28,34,.82)"; rr(x, y, w, h, 10); ctx.fill(); tx("OFFLINE", b.x, b.y, 9, C.danger, {font: DISP, weight: 700}); }
  if (b.breach) { ctx.strokeStyle = `rgba(255,59,43,${0.5 + 0.5 * pulse(8)})`; ctx.lineWidth = 3; rr(x - 2, y - 2, w + 4, h + 4, 11); ctx.stroke(); tx("BREACH", b.x, y - 8, 8.5, C.danger, {font: DISP, weight: 700}); }
}
function drawPeople() {
  for (const u of S.people) {
    const col = u.vp ? C.danger : "#c9a66b";
    ctx.fillStyle = u.vp ? "rgba(255,93,77,.2)" : "rgba(201,166,107,.2)"; ctx.beginPath(); ctx.arc(u.x, u.y, 15, 0, 7); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(u.x, u.y, 15, 0, 7); ctx.stroke();
    em(u.who, u.x, u.y, 19); tx(u.vp ? "VP" : "REQUESTER", u.x, u.y + 23, 7.5, col, {font: DISP, weight: 700});
    if (u.state === "hold") { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(S.p.x, S.p.y, 22, -Math.PI / 2, -Math.PI / 2 + (u.hold / (u.vp ? VP_HOLD : USER_HOLD)) * 2 * Math.PI); ctx.stroke(); }
    if (u.sayT > 0) smallBubble(u.say, u.x, u.y - 22);
  }
}
function drawTicketCard() {
  if (!(S.frozen && !S.handed && S.q.length)) return;
  const rq = S.q[0], cx = T0.x + 20, cy = T0.y - 108, w = 196, h = 84, x = cx - w / 2, y = cy - h / 2;
  ctx.fillStyle = "rgba(246,241,222,.97)"; rr(x, y, w, h, 8); ctx.fill(); ctx.strokeStyle = "#b7a983"; ctx.lineWidth = 1.5; rr(x, y, w, h, 8); ctx.stroke();
  em(rq.who, x + 18, y + 18, 18); em(rq.icon, x + 42, y + 18, 16);
  tx(rq.what, x + 56, y + 18, 11, "#2b2618", {align: "left", weight: 600, max: w - 64});
  // the four checks, each an icon: good, or the flaw in red
  const cells = [
    ["owner", rq.flaw === "owner" ? "❓" : "👤"],
    ["budget", rq.flaw === "budget" ? "✖" : "💳"],
    ["end", rq.flaw === "end" ? "∞" : rq.temp ? "⏳" : "—"],
    ["admin", rq.flaw === "admin" ? "🔑" : "—"],
  ];
  cells.forEach(([f, ic], k) => {
    const bx = x + 10 + k * 46, by = y + 38, bad = rq.flaw === f;
    ctx.fillStyle = bad ? "#ffd9d2" : "#ece5cc"; rr(bx, by, 40, 34, 5); ctx.fill();
    if (bad) { ctx.strokeStyle = C.danger; ctx.lineWidth = 2; rr(bx, by, 40, 34, 5); ctx.stroke(); }
    const plain = ic === "—" || ic === "∞";
    tx(ic, bx + 20, by + (ic === "∞" ? 15 : 17), ic === "∞" ? 28 : ic === "—" ? 13 : 17, bad ? "#c0281b" : "#6e6550", {font: plain ? DISP : EF, weight: 700});
  });
  if (S.q.length > 1) tx(`+${S.q.length - 1}`, x + w - 6, y + 10, 10, "#8a7a5a", {align: "right", weight: 700});
}
function drawTemp() {
  const M = S.temp, sf = S.stress / QUIT_AT, worried = sf > 0.4;
  ctx.fillStyle = "rgba(79,209,197,.22)"; ctx.beginPath(); ctx.arc(M.x, M.y, 15, 0, 7); ctx.fill();
  ctx.strokeStyle = "#4fd1c5"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(M.x, M.y, 15, 0, 7); ctx.stroke();
  // his nerves, as a Day 1 circle: it fills, amber then red
  if (sf > 0.05 && !S.quit) { ctx.strokeStyle = sf > 0.7 ? C.danger : sf > 0.4 ? C.amber : "rgba(79,209,197,.6)"; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(M.x, M.y, 20, -Math.PI / 2, -Math.PI / 2 + sf * 2 * Math.PI); ctx.stroke(); }
  const shake = sf > 0.7 && !RM ? Math.sin(S.t * 30) * 1.4 : 0;
  em(S.quit ? "😩" : S.result && S.result.win ? "😌" : sf > 0.7 ? "😰" : S.handed ? "🙂" : M.puzzled ? "🤔" : worried ? "😟" : "😐", M.x + shake, M.y, 20);
  if (M.job) { ctx.fillStyle = M.job.action === "bounce" ? "#ffd9d2" : "#f6f1de"; ctx.fillRect(M.x + 10, M.y - 18, 12, 9); }
  if (M.stampT > 0) { ctx.fillStyle = "#8a2a20"; rr(M.x + 12, M.y - 4 - M.stampT * 20, 10, 10, 2); ctx.fill(); }
  tx("TEMP", M.x, M.y + 23, 8, "#4fd1c5", {font: DISP, weight: 700});
}
function smallBubble(text, x, y) {
  ctx.font = `600 10.5px ${MONO}`;
  const words = text.split(" "), lines = []; let line = "";
  for (const wd of words) { const t = line ? line + " " + wd : wd; if (ctx.measureText(t).width > 180 && line) { lines.push(line); line = wd; } else line = t; }
  lines.push(line);
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 14, h = lines.length * 13 + 8;
  const bx = clamp(x - w / 2, 4, W - w - 4), by = clamp(y - h - 6, 20, H - h - 4);
  ctx.fillStyle = "#f6f8fa"; rr(bx, by, w, h, 6); ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 1; rr(bx, by, w, h, 6); ctx.stroke();
  lines.forEach((l, k) => tx(l, bx + 7, by + 10 + k * 13, 10.5, "#14212b", {align: "left", weight: 600}));
}
function drawHoldRing() {
  const h = S.hold; if (!h) return;
  const f = h.t / h.need, a = h.a, r = a.server ? 34 : 42;
  ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, 7); ctx.stroke();
  ctx.strokeStyle = fixWord(a) === "FREEZE" ? C.leak : C.amber; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(a.x, a.y, r, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.stroke();
}
function drawPlayer() {
  const P = S.p;
  ctx.fillStyle = "rgba(255,181,71,.25)"; ctx.beginPath(); ctx.arc(P.x, P.y, 17, 0, 7); ctx.fill();
  ctx.strokeStyle = C.amber; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(P.x, P.y, 16, 0, 7); ctx.stroke();
  em(AVATAR, P.x, P.y, 22);
  const cx = P.x - 24, cy = P.y - 22 + (RM ? 0 : Math.sin(S.t * 2.2) * 2);
  em("📎", cx, cy, 16);
  if (S.prompt) { ctx.font = `600 11px ${MONO}`; const w = ctx.measureText(S.prompt).width + 14, px = clamp(P.x, w / 2 + 4, W - w / 2 - 4);
    ctx.fillStyle = "rgba(8,16,22,.86)"; rr(px - w / 2, P.y - 48, w, 18, 4); ctx.fill(); tx(S.prompt, px, P.y - 39, 11, C.ink, {weight: 600}); }
  if (S.clipT > 0 && S.clipText) drawBubble(S.clipText, cx, cy, Math.min(1, S.clipT * 2));
}
function drawBubble(text, x, y, alpha) {
  ctx.font = `600 11px ${MONO}`;
  const words = text.split(" "), lines = []; let line = "";
  for (const wd of words) { const t = line ? line + " " + wd : wd; if (ctx.measureText(t).width > 200 && line) { lines.push(line); line = wd; } else line = t; }
  lines.push(line);
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 16, h = lines.length * 14 + 10;
  const left = x - 14 - w >= 4, bx = left ? x - 14 - w : clamp(x + 62, 4, W - w - 4), by = clamp(y - h / 2, 34, H - h - 4);
  ctx.globalAlpha = alpha; ctx.fillStyle = "rgba(245,240,225,.96)"; rr(bx, by, w, h, 7); ctx.fill();
  ctx.strokeStyle = "#b7a983"; ctx.lineWidth = 1; rr(bx, by, w, h, 7); ctx.stroke();
  lines.forEach((l, k) => tx(l, bx + 8, by + 12 + k * 14, 11, "#2b2618", {align: "left", weight: 600}));
  ctx.globalAlpha = 1;
}
function drawStamps() {
  for (const s of S.stamps) { ctx.globalAlpha = 1 - s.t / 0.9; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(-0.18);
    ctx.strokeStyle = "#ff3b2b"; ctx.lineWidth = 2; ctx.strokeRect(-38, -11, 76, 22); tx(s.text, 0, 0, 13, "#ff3b2b", {font: DISP, weight: 700}); ctx.restore(); ctx.globalAlpha = 1; }
}
function drawFloats() {
  for (const f of floats) { const k = f.t / 1.4; ctx.globalAlpha = Math.max(0, 1 - k); tx(f.text, f.x, f.y - (RM ? 0 : k * 22), 12, f.color, {font: DISP, weight: 700}); }
  ctx.globalAlpha = 1;
}
function drawSteady() {
  if (S.steady <= 0 || S.done) return;
  const f = S.steady / STEADY;
  ctx.fillStyle = "rgba(8,16,22,.86)"; rr(W / 2 - 110, 40, 220, 26, 6); ctx.fill();
  ctx.fillStyle = C.ok; rr(W / 2 - 104, 58, 208 * f, 4, 2); ctx.fill();
  tx("UNDER TARGET · HE'S GOT IT", W / 2, 50, 11, C.ok, {font: DISP, weight: 700});
}
function draw() {
  ctx.clearRect(0, 0, W, H); if (!S) return;
  drawFloor();
  for (const r of S.racks) drawRack(r);
  drawCable(); drawDesk();
  for (const b of S.servers) drawServer(b);
  drawTemp(); drawPeople(); drawStamps();
  if (S.temp.sayT > 0) smallBubble(S.temp.say, S.temp.x, S.temp.y - 24);
  drawTicketCard(); drawHoldRing(); drawPlayer(); drawFloats(); drawSteady();
}

/* ==== HUD ==== */
const lcd = n => String(Math.max(0, Math.min(999, n))).padStart(3, "0");
function hud() {
  if (!S) return;
  $("c-q").hidden = !(S.frozen && !S.handed); $("h-q").textContent = lcd(S.q.length);
  $("c-book").hidden = !S.frozen;
  $("h-book").innerHTML = LESSONS.map(f => `<span class="${S.learned[f] ? "" : "off"}">${FLAW_ICON[f]}</span>`).join(" ");
  const r = rate(), fr = S.spent / CEILING;
  $("h-spent").textContent = big(S.spent); $("b-spent").style.width = `${clamp(1 - fr, 0, 1) * 100}%`;
  $("c-spent").className = `chip${fr > 0.8 ? " bad" : fr > 0.55 ? " warn" : ""}`;
  $("h-rate").textContent = `${money(r)}/hr`; $("h-target").textContent = `target ≤ ${money(TARGET)}`;
  $("c-rate").className = `chip${r > TARGET * 1.6 ? " bad" : r > TARGET ? " warn" : ""}`;
  const uf = S.uptime / UPTIME; $("b-uptime").style.width = `${clamp(uf, 0, 1) * 100}%`;
  $("c-up").className = `chip${uf < 0.3 ? " bad" : uf < 0.6 ? " warn" : ""}`;
  $("smiley").textContent = S.result ? (S.result.win ? "😎" : "😵") : fr > 0.8 ? "😬" : S.handed ? "😌" : "🙂";
  const a = mode === "play" ? target() : null, fw = fixWord(a), gw = grabWord(a);
  const fix = $("t-fix"), gb = $("t-grab");
  fix.textContent = fw || "FIX"; fix.classList.toggle("ready", !!fw); fix.style.fontSize = (fw || "").length > 6 ? "17px" : "";
  gb.textContent = gw || "DENY"; gb.classList.toggle("ready", !!gw);
}

/* ==== Screens ==== */
let AVATAR = "🧑‍💻";
try {
  const t = String(localStorage.getItem("liftshift-avatar") || "").trim();
  const g = t && (typeof Intl !== "undefined" && Intl.Segmenter ? [...new Intl.Segmenter(undefined, {granularity: "grapheme"}).segment(t)][0].segment : Array.from(t)[0]);
  if (g && /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(g)) AVATAR = g;
} catch (e) {}
function overlay(html, onReady) {
  const o = $("overlay"); o.innerHTML = html; o.hidden = false; o.scrollTop = 0;
  if (onReady) onReady(o);
  const b = o.querySelector("[data-focus]") || o.querySelector("button"); if (b) b.focus({preventScroll: true});
}
function hideOverlay() { $("overlay").hidden = true; $("overlay").innerHTML = ""; }
function intro() {
  mode = "intro";
  overlay(`<div class="card" role="dialog" aria-labelledby="t1">
    <h2>Day 2 · stage 1 · prototype 5</h2>
    <h1 id="t1">Convenience Fee Ltd.</h1>
    <p>They moved to the cloud on Day 1. Now the bill is too high, it's still climbing, and nobody knows where it's coming from.</p>
    <p>Get the hourly rate under <b>${money(TARGET)}</b> and keep it there. If they spend <b>${big(CEILING)}</b> first, they pull the contract.</p>
    <p>The usual still applies: patches come due, full queues escalate into fires, and outages burn your uptime. And keep an eye on the temp. He's close to quitting.</p>
    <p class="muted">A standalone prototype. Nothing is saved, and it doesn't touch the main game.</p>
    <div class="btns"><button class="btn" id="go" type="button">Start</button><a class="btn ghost" href="../../lift-and-shift.html">Back to the game</a></div>
  </div>`, o => o.querySelector("#go").addEventListener("click", start));
}
function start() { S = newRun(); floats.length = 0; hideOverlay(); mode = "play"; for (const k in keys) keys[k] = false; clip("start"); }
function togglePause() {
  if (mode === "play") {
    mode = "paused"; for (const k in keys) keys[k] = false;
    overlay(`<div class="card" role="dialog" aria-labelledby="tp"><h1 id="tp">Paused</h1><div class="btns"><button class="btn" id="res" type="button">Resume</button><button class="btn ghost" id="rst" type="button">Restart</button></div></div>`,
      o => { o.querySelector("#res").addEventListener("click", togglePause); o.querySelector("#rst").addEventListener("click", () => { hideOverlay(); start(); }); });
  } else if (mode === "paused") { hideOverlay(); mode = "play"; }
}
function finish(win, why = "") {
  if (S.done) return;
  S.done = true; S.result = {win, why}; S.hold = null;
  if (win) { SFX.bell(); tempSay("Same rules tomorrow. And the day after.", 99); }
  else SFX.fail();
  setTimeout(() => { if (mode === "play") (win ? showWin : showFail)(); }, 1600);
}
function showWin() {
  mode = "end";
  overlay(`<div class="card" role="dialog" aria-labelledby="te">
    <h2>A few months later…</h2>
    <h1 id="te">😌 He's still running it.</h1>
    <div class="later">The bell rings, the ticket system hums, and the temp checks every request against the rulebook before he builds anything. Nobody has called you.</div>
    <div class="stats">
      <span>Rate when you arrived</span><span>${money(S.rate0)}/hr</span>
      <span>Rate when you left</span><span>${money(rate())}/hr</span>
      <span>Spent while you were there</span><span>${big(S.spent)}</span>
      <span>Requests bounced</span><span>${S.bounced}</span>
      <span>Real requests served</span><span>${S.served}</span>
      <span>Junk servers he swept up</span><span>${S.swept}</span>
      <span>Built around you</span><span>${S.sneaks}</span>
    </div>
    <p>The temp packs his rulebook. He's coming with you.</p>
    <p class="muted">These aren't real-world numbers.</p>
    <div class="btns"><button class="btn" id="again" type="button">Play again</button><a class="btn ghost" href="../../lift-and-shift.html">Back to the game</a></div>
  </div>`, o => o.querySelector("#again").addEventListener("click", () => { hideOverlay(); start(); }));
}
function showFail() {
  mode = "end";
  const hint = !S.found ? "Listen for the ding. Every time it dings, a server shows up. Find what's dinging."
    : !S.frozen ? "Shutting servers down won't keep up while he builds everything he's sent. Stop the flow first."
    : !S.handed ? (S.learned.ok ? "Say no in front of him. Deny a request with a problem once, and he learns that stamp." : "He needs to see a yes, too. Approve a good request in front of him (no ❓ ✖ ∞ 🔑) and he learns what okay looks like.")
    : "He's got the rulebook. Help him clear the old junk: the servers marked ❓ ✖ ∞ 🔑.";
  const why = S.result.why;
  const head = why === "quit" ? ["He quit", "😩 The temp walked out. Day 1 all over again."]
    : why === "uptime" ? ["Fired", "😵 Too much downtime. The client walked you out."]
    : ["Contract pulled", `😵 They spent ${big(CEILING)} and called it.`];
  const tip = why === "quit" ? "He breaks when his pile gets too big. Stop the flood, and thank him when his circle goes amber." : hint;
  overlay(`<div class="card" role="dialog" aria-labelledby="tf">
    <h2>${head[0]}</h2>
    <h1 id="tf">${head[1]}</h1>
    <p><b>Hint:</b> ${tip}</p>
    <div class="btns"><button class="btn" id="again" type="button" data-focus>Try the stage again</button><a class="btn ghost" href="../../lift-and-shift.html">Back to the game</a></div>
  </div>`, o => o.querySelector("#again").addEventListener("click", () => { hideOverlay(); start(); }));
}

/* ==== Main loop ==== */
let S = null, last = performance.now(), hudT = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (mode === "play") update(dt);
  draw();
  if (now - hudT > 100) { hud(); hudT = now; }
  requestAnimationFrame(frame);
}
$("snd").textContent = AU.on ? "🔊 Sound on" : "🔇 Sound off"; $("snd").setAttribute("aria-pressed", String(AU.on));
S = newRun();
// test hook for browser checks: read state, act, and step the simulation by hand
window.__stage1 = {get S() { return S; }, get mode() { return mode; }, start, rate, probe, freeze, approve, deny, shutDown, target, doHold, thank, fixWord,
  step(sec, dt = 1 / 60) { for (let t = 0; t < sec; t += dt) if (mode === "play") update(dt); draw(); hud(); }};
intro(); requestAnimationFrame(frame);
})();
