/* Lift & Shift · Gitamp: a retro desktop music player for the soundtrack. Type `gitamp` in the terminal.
   It really whips the vendor's SaaS.

   A small floating window that plays any of Matt's songs, with a playlist, prev/play/pause/stop/next, shuffle, repeat
   and a spectrum meter. It stays open over play, pause and the menus. While it's playing it picks the song; Stop (or
   closing it) hands the music back to the game. Its mood is AUTO by default: the game's own mood (Normal, Tense, On fire,
   Red alert, from what's going on) on Gitamp's song. A mood button pins that mood to preview it, until you're back in the
   game (a click or key outside Gitamp, PacketDrop and the terminal), which returns it to AUTO.

   This file loads before the game. The game calls window.LasGitamp(G) once with a bridge to its music internals and
   keeps the result as GA. Rules kept from the game: it never touches S or the game's random rolls (shuffle uses the
   sound generator, sndRand), and it only ever changes the music. */
(() => {
"use strict";
window.LasGitamp = G => {
const {AU,MUS,MOODS,SONGS,SONG_SETS,DONUT_SET,EMAIL,audio,setMood,setMusic,sndRand,RM} = G;

/* ==== The playlist: Matt's songs, Day 1 rotation first (the menu and victory loops aren't on it: they have no moods) ==== */
const BAND = "Dreams Are For Sleep";
const songSecs = (M,bars) => {const s = M.song, N = s.steps || 16; return bars * N * 60 / M.bpm / (s.beat || N/4);};
const TRACKS = [];
const rotation = SONG_SETS.map(set => set[0].slice(5));
for (const k of [...rotation, ...Object.keys(SONGS).filter(k => !rotation.includes(k))]) {
  const set = k === "bitLove" ? DONUT_SET : ["work:"+k,"tense:"+k,"alert:"+k];
  if (!set.every(m => MOODS[m])) continue;
  const M = MOODS[set[0]], bars = M.song.form.reduce((n,key) => n + M.song[key].chords.length, 0) * 2; // the form, twice
  const note = k === "bitLove" ? "the donut shop" : k === "dreamOn" ? "Day 2's night shift" : "";
  TRACKS.push({title: SONGS[k].title || k, artist: BAND, set, bars, secs: songSecs(M,bars), note});
}
const MOOD_NAMES = [["auto","Auto"],["normal","Normal"],["tense","Tense"],["hot","On fire"],["alert","Red alert"]];

/* ==== State: all outside the game's S ==== */
// mood: "auto" or a pinned one; own: the mood the game wants for its own song right now (it tells us every half bar)
// repeat starts on, like the game: a client's song plays until the client is done
const st = {open: false, state: "stop", i: 0, mood: "auto", own: "calm", shuffle: false, repeat: true, bars: 0, t0: 0, played: 0};
const ownLevel = () => st.own.startsWith("alert") ? 2 : st.own.startsWith("tense") ? 1 : 0;
const level = () => st.mood === "auto" ? ownLevel() : st.mood === "alert" ? 2 : st.mood === "normal" ? 0 : 1;
const keyOf = () => TRACKS[st.i].set[level()];
const moodLabel = () => st.mood !== "auto" ? MOOD_NAMES.find(m => m[0] === st.mood)[1].toUpperCase()
  : "AUTO · " + ["NORMAL", MUS.heat >= 2 ? "ON FIRE" : "TENSE", "RED ALERT"][ownLevel()];
const now = () => performance.now() / 1000;
const elapsed = () => st.played + (st.state === "play" ? now() - st.t0 : 0);
const mmss = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;

/* ==== The window ==== */
const css = `
#gitamp{position:fixed;z-index:40;top:64px;right:12px;width:min(300px,calc(100vw - 32px));font:12px/1.2 var(--f-mono,ui-monospace,monospace);color:#c9d1d9;
  background:linear-gradient(#3b4048,#262a30);border:1px solid #11141a;border-radius:6px;box-shadow:0 10px 30px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.12);user-select:none;-webkit-user-select:none;touch-action:none}
#gitamp[hidden]{display:none}
#gitamp .ga-bar{display:flex;align-items:center;gap:6px;padding:4px 6px;cursor:move;border-bottom:1px solid #11141a;
  background:repeating-linear-gradient(0deg,#4a505a 0 1px,#30353d 1px 3px);border-radius:6px 6px 0 0}
#gitamp .ga-bar b{background:#262a30;padding:0 6px;letter-spacing:.25em;font-size:11px;color:#f0b429}
#gitamp .ga-bar i{flex:1}
#gitamp button{font:inherit;color:#c9d1d9;background:linear-gradient(#4a505a,#2f343b);border:1px solid #11141a;border-radius:3px;box-shadow:inset 0 1px 0 rgba(255,255,255,.15);cursor:pointer;min-width:26px;min-height:24px;padding:2px 6px}
#gitamp button:active{background:linear-gradient(#2a2e35,#3a3f47)}
#gitamp button:focus-visible{outline:2px solid #f0b429;outline-offset:1px}
#gitamp button[aria-pressed="true"]{color:#0b0f0b;background:linear-gradient(#7ee787,#3fb950);font-weight:700}
#gitamp button.ga-alert[aria-pressed="true"]{background:linear-gradient(#ff8080,#e5484d);color:#fff}
#gitamp button.ga-hot[aria-pressed="true"]{background:linear-gradient(#ffb066,#f0883e)}
#gitamp button:disabled{opacity:.4;cursor:default}
#gitamp .ga-x{min-width:20px;min-height:18px;padding:0 4px;line-height:1}
#gitamp .ga-body{padding:8px}
#gitamp .ga-lcd{display:grid;grid-template-columns:auto 1fr;gap:4px 8px;align-items:center;background:#050805;border:1px solid #000;border-radius:3px;padding:6px 8px;color:#3fef3f;box-shadow:inset 0 0 8px rgba(63,239,63,.15)}
#gitamp .ga-time{font-size:22px;letter-spacing:.04em;text-shadow:0 0 6px rgba(63,239,63,.5);font-variant-numeric:tabular-nums}
#gitamp .ga-title{overflow:hidden;white-space:pre;grid-column:1/-1;color:#3fef3f}
#gitamp .ga-meta{grid-column:1/-1;display:flex;justify-content:space-between;color:#2fae2f;font-size:10.5px}
#gitamp canvas{width:100%;height:28px;display:block}
#gitamp .ga-row{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}
#gitamp .ga-row button{flex:1}
#gitamp .ga-list{margin:6px 0 0;padding:0;list-style:none;max-height:min(190px,32vh);overflow:auto;background:#050805;border:1px solid #000;border-radius:3px}
#gitamp .ga-list button{all:unset;box-sizing:border-box;display:flex;gap:6px;width:100%;padding:3px 6px;color:#3fef3f;cursor:pointer;font-size:11.5px}
#gitamp .ga-list button:hover{background:#102410}
#gitamp .ga-list button:focus-visible{outline:1px solid #f0b429;outline-offset:-1px}
#gitamp .ga-list button[aria-current="true"]{background:#1d5a1d;color:#fff}
#gitamp .ga-list span:nth-child(2){flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#gitamp .ga-list small{color:#2fae2f}
#gitamp .ga-tip{margin-top:5px;color:#8b949e;font-size:10.5px;text-align:center}
@media (max-height:520px){#gitamp{top:6px}#gitamp .ga-list{max-height:max(60px,calc(100vh - 215px))}#gitamp .ga-tip{display:none}}`;
const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);
const el = document.createElement("section");
el.id = "gitamp"; el.hidden = true; el.setAttribute("aria-label","Gitamp music player");
el.innerHTML = `<div class="ga-bar"><b>GITAMP</b><i></i><button class="ga-x" data-ga="vis" aria-label="Open PacketDrop, the visualizer" title="PacketDrop visualizer">VIS</button><button class="ga-x" data-ga="close" aria-label="Close Gitamp" title="Close (the game gets its music back)">×</button></div>
<div class="ga-body">
  <div class="ga-lcd"><span class="ga-time" aria-hidden="true">0:00</span><canvas width="160" height="28" aria-hidden="true"></canvas>
    <div class="ga-title" aria-live="polite"></div><div class="ga-meta"><span class="ga-mood"></span><span class="ga-state"></span></div></div>
  <div class="ga-row" role="group" aria-label="Playback">
    <button data-ga="prev" aria-label="Previous track" title="Previous">⏮</button><button data-ga="play" aria-label="Play" title="Play">▶</button>
    <button data-ga="pause" aria-label="Pause" title="Pause">⏸</button><button data-ga="stop" aria-label="Stop" title="Stop (the game gets its music back)">⏹</button>
    <button data-ga="next" aria-label="Next track" title="Next">⏭</button>
    <button data-ga="shuffle" aria-pressed="false" title="Shuffle">SHUF</button><button data-ga="repeat" aria-pressed="false" title="Repeat this track">REP</button></div>
  <div class="ga-row" role="group" aria-label="Mood">${MOOD_NAMES.map(([k,n]) => `<button data-mood="${k}" class="ga-${k}" aria-pressed="false">${n}</button>`).join("")}</div>
  <ol class="ga-list" aria-label="Playlist">${TRACKS.map((t,i) => `<li><button data-track="${i}" title="${t.note ? `Plays in ${t.note}` : "A client's song"}"><span>${i+1}.</span><span>${t.artist === BAND ? "" : `${t.artist} - `}${t.title}</span><small>${mmss(t.secs)}</small></button></li>`).join("")}</ol>
  <div class="ga-tip">It really whips the vendor's SaaS.</div>
</div>`;
document.body.appendChild(el);
const q = s => el.querySelector(s), cv = q("canvas"), g2 = cv.getContext("2d");

let scroll = 0, ticker = null, raf = 0, an = null, bins = null;
// a client wrapping up plays the game's victory tune over Gitamp's song, and says so
const VICTORY = {title: "Victory", artist: "Lift & Shift OST"};
const victory = () => st.own === "victory" && st.state !== "stop";
const nowTrack = () => victory() ? VICTORY : TRACKS[st.i];
const titleText = () => {const t = nowTrack(); return victory() ? `${t.artist} - ${t.title}` : `${st.i+1}. ${t.artist} - ${t.title}`;};
function render() {
  const full = `${titleText()}  ***  `, w = 34;
  q(".ga-title").textContent = RM || full.length - 7 <= w ? titleText() : (full + full).slice(scroll % full.length, scroll % full.length + w);
  q(".ga-time").textContent = mmss(elapsed());
  q(".ga-mood").textContent = victory() ? "VICTORY" : moodLabel();
  q(".ga-state").textContent = !AU.on ? "SOUND OFF (M)" : st.state === "play" ? "PLAYING" : st.state === "pause" ? "PAUSED" : "STOPPED · GAME MUSIC";
  el.querySelectorAll("[data-mood]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mood === st.mood)));
  el.querySelectorAll("[data-track]").forEach(b => b.setAttribute("aria-current", String(+b.dataset.track === st.i)));
  q('[data-ga="shuffle"]').setAttribute("aria-pressed", String(st.shuffle));
  q('[data-ga="repeat"]').setAttribute("aria-pressed", String(st.repeat));
  q('[data-ga="play"]').setAttribute("aria-pressed", String(st.state === "play"));
  q('[data-ga="pause"]').setAttribute("aria-pressed", String(st.state === "pause"));
}
// the spectrum: what the music bus is playing right now (draw only)
function meter() {
  raf = st.open ? requestAnimationFrame(meter) : 0;
  const W = cv.width, H = cv.height; g2.clearRect(0,0,W,H);
  if (!an && MUS.bus && AU.ctx) {an = AU.ctx.createAnalyser(); an.fftSize = 64; an.smoothingTimeConstant = 0.7; MUS.bus.connect(an); bins = new Uint8Array(an.frequencyBinCount);}
  const n = 16, bw = W / n;
  if (an) an.getByteFrequencyData(bins);
  for (let i = 0; i < n; i++) {
    const v = an && st.state === "play" ? bins[1 + i] / 255 : 0, h = Math.max(1, Math.round(v * H));
    for (let y = 0; y < h; y += 3) {g2.fillStyle = y > H * 0.7 ? "#e5484d" : y > H * 0.45 ? "#f0b429" : "#3fef3f"; g2.fillRect(i * bw + 1, H - y - 2, bw - 2, 2);}
  }
}

/* ==== Playback ==== */
function go(i) {
  st.i = (i + TRACKS.length) % TRACKS.length; st.bars = 0; st.played = 0; st.t0 = now(); scroll = 0;
  if (st.state === "stop") st.state = "play";
  if (MUS.started) setMood(keyOf()); // a new song starts from its top
  render(); if (!pd.hidden) pdText();
}
function nextIndex(dir) {
  if (!st.shuffle || TRACKS.length < 2) return st.i + dir;
  let j = st.i; while (j === st.i) j = Math.floor(sndRand() * TRACKS.length); return j;
}
function play() {
  audio(); if (!MUS.on) setMusic(true);
  if (st.state === "pause") {st.t0 = now(); st.state = "play";}
  else if (st.state === "stop") {st.state = "play"; go(st.i); return;}
  render();
}
function act(a) {
  if (a === "play") play();
  else if (a === "pause") {if (st.state === "play") {st.played = elapsed(); st.state = "pause";} else if (st.state === "pause") play(); render();}
  else if (a === "stop") {st.state = "stop"; st.played = 0; st.bars = 0; render();}
  else if (a === "next" || a === "prev") {audio(); go(nextIndex(a === "next" ? 1 : -1));}
  else if (a === "shuffle") {st.shuffle = !st.shuffle; render();}
  else if (a === "repeat") {st.repeat = !st.repeat; render();}
  else if (a === "vis") pdOpen();
  else if (a === "close") close();
}
el.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (e.detail > 0) b.blur(); // a mouse click: the keys go back to the game
  if (b.dataset.ga) act(b.dataset.ga);
  else if (b.dataset.mood) {st.mood = b.dataset.mood; if (st.state === "stop") play(); else {if (MUS.started) setMood(keyOf()); render();}}
  else if (b.dataset.track) {audio(); if (!MUS.on) setMusic(true); st.state = "play"; go(+b.dataset.track);}
});
el.addEventListener("keydown", e => {e.stopPropagation(); if (e.key === "Escape" && document.activeElement) document.activeElement.blur();}); // Space on a focused button is the button's, not the game's; Esc lets go of Gitamp
// back in the game (a click or a key anywhere but Gitamp, PacketDrop or the terminal): a pinned mood goes back to AUTO
function backToGame(e) {
  if (st.mood === "auto" || (e.target.closest && e.target.closest("#gitamp,#packetdrop,#devterm"))) return;
  st.mood = "auto"; if (MUS.started && st.state !== "stop") setMood(keyOf()); render();
}
addEventListener("pointerdown", backToGame, true); addEventListener("keydown", backToGame, true);

/* drag it by the title bar, kept on screen */
let drag = null;
q(".ga-bar").addEventListener("pointerdown", e => {
  if (e.target.closest("button")) return;
  const r = el.getBoundingClientRect(); drag = {dx: e.clientX - r.left, dy: e.clientY - r.top}; q(".ga-bar").setPointerCapture(e.pointerId);
});
q(".ga-bar").addEventListener("pointermove", e => {
  if (!drag) return;
  const x = Math.min(Math.max(0, e.clientX - drag.dx), innerWidth - el.offsetWidth), y = Math.min(Math.max(0, e.clientY - drag.dy), innerHeight - 30);
  Object.assign(el.style, {left: `${x}px`, top: `${y}px`, right: "auto"});
});
q(".ga-bar").addEventListener("pointerup", () => {drag = null;});


/* ==== PacketDrop 2.0: the visualizer, a parody of the trippy full-screen kind. Now with 40% more loss. ====
   Last frame fed back zoomed and turned (the swirl), a waveform ring, spectrum spokes, and packets spiralling into the
   cloud on the beat; any that reach it while the kick drum hits are dropped and fall out (the cloud's busy). It shows whatever the music bus plays (Gitamp's or the
   game's). Draw only; its randomness comes from sndRand. Reduced motion: one still frame. */
// The packets are the game's own icons, no text: its work (email is the inbox's own types, EMAIL, so they can't drift
// apart), its incidents, the helpers (the AI agent's 🧠, Mr Paperclip, the bots, the temp) and the hallway's pickups.
// w is how often each shows up: work most, incidents and helpers less, pickups least.
const PD_KINDS = [
  {g: "🎫", w: 5},
  ...Object.values(EMAIL || {}).map(e => ({g: e.icon, w: 5 * e.w / 100})),
  {g: "🩹", w: 3}, {g: "🖥️", w: 2}, {g: "📦", w: 2},
  {g: "$", gf: "800 sans-serif", gc: "#3fcf7f", gs: 1.5, w: 2}, // the FinOps flag
  {g: "🔥", w: 1}, {g: "💧", w: 1}, {g: "🚨", w: 1}, {g: "💀", w: 0.5},
  {g: "🧠", w: 1.2}, {g: "📎", w: 1}, {g: "🤖", w: 1}, {g: "🦾", w: 0.8}, {g: "🧑‍💼", w: 0.6}, {g: "🧯", w: 0.6}, {g: "❄️", w: 0.5},
  {g: "☕", w: 0.6}, {g: "🍩", w: 0.6}, {g: "🍕", w: 0.5}, {g: "🎧", w: 0.4},
];
const PD_W = PD_KINDS.reduce((n, k) => n + k.w, 0);
const pdKind = () => {let r = sndRand() * PD_W; for (const k of PD_KINDS) if ((r -= k.w) <= 0) return k; return PD_KINDS[0];};
const PD_STILL = ["🎫", "🧠", "🖥️", "📦", "🔥", "$", "📎", "🤖"].map(g => PD_KINDS.find(k => k.g === g)); // the still frame's ring
const pdCanFull = () => !!document.documentElement.requestFullscreen;
const pd = document.createElement("section");
pd.id = "packetdrop"; pd.hidden = true; pd.setAttribute("role","dialog"); pd.setAttribute("aria-label","PacketDrop visualizer");
pd.innerHTML = `<div class="pd-bar"><b>PACKETDROP 2.0</b><span>now with 40% more loss</span><i></i>${pdCanFull() ? `<button data-pd="full" aria-label="Full screen" title="Full screen">⛶</button>` : ""}<button data-pd="close" aria-label="Close PacketDrop" title="Close (Esc)">×</button></div>
<canvas aria-hidden="true"></canvas><div class="pd-foot"><span class="pd-now"></span><span class="pd-drop"></span></div>`;
style.textContent += `
#packetdrop{position:fixed;z-index:41;left:50%;top:50%;transform:translate(-50%,-50%);width:min(760px,calc(100vw - 32px));height:min(520px,calc(100vh - 32px));display:flex;flex-direction:column;
  background:#000;border:1px solid #11141a;border-radius:6px;box-shadow:0 14px 40px rgba(0,0,0,.7);font:12px/1.2 var(--f-mono,ui-monospace,monospace);color:#c9d1d9;overflow:hidden}
#packetdrop[hidden]{display:none}
#packetdrop:focus{outline:none}
#packetdrop:fullscreen{width:100vw;height:100vh;transform:none!important;left:0!important;top:0!important;border-radius:0}
#packetdrop .pd-bar{display:flex;align-items:center;gap:8px;padding:4px 6px;cursor:move;touch-action:none;background:repeating-linear-gradient(0deg,#4a505a 0 1px,#30353d 1px 3px);border-bottom:1px solid #11141a}
#packetdrop .pd-bar b{background:#262a30;padding:0 6px;letter-spacing:.2em;font-size:11px;color:#f0b429;white-space:nowrap}
#packetdrop .pd-bar span{color:#c9d1d9;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#packetdrop .pd-bar i{flex:1}
#packetdrop button{font:inherit;color:#c9d1d9;background:linear-gradient(#4a505a,#2f343b);border:1px solid #11141a;border-radius:3px;cursor:pointer;min-width:24px;min-height:22px;padding:0 6px}
#packetdrop button:focus-visible{outline:2px solid #f0b429;outline-offset:1px}
#packetdrop canvas{flex:1;min-height:0;width:100%;display:block}
#packetdrop .pd-foot{display:flex;justify-content:space-between;gap:8px;padding:3px 8px;background:#050805;color:#3fef3f;font-size:11px;border-top:1px solid #11141a}
#packetdrop .pd-foot span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`;
document.body.appendChild(pd);
const pcv = pd.querySelector("canvas"), pc = pcv.getContext("2d");
const pdS = {raf: 0, an: null, f: null, t: null, last: 0, hue: 200, pk: [], drops: 0, ct: 0, trickle: 0, still: false};
const PD_MAX = 60, PD_KICK = 0.14;
// Text is the expensive part (emoji most of all, ~120 a frame at 4K), so each glyph or label is drawn once into a small
// canvas and stamped from then on. Keyed by text, size, font and colour; label hues are rounded to 12° so they reuse.
const pdSpr = new Map();
function pdSprite(txt, px, font, color) {
  const key = txt + "|" + px + "|" + font + "|" + color; let s = pdSpr.get(key); if (s) return s;
  if (pdSpr.size > 500) pdSpr.clear(); // a resize changes every size: start over
  s = document.createElement("canvas"); const x = s.getContext("2d"), f = /^\d/.test(font) ? font.replace(" ", ` ${px}px `) : `${px}px ${font}`; // a weight goes before the size
  x.font = f; s.width = Math.ceil(x.measureText(txt).width) + 4; s.height = Math.ceil(px * 1.4) + 4;
  x.font = f; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = color; x.fillText(txt, s.width / 2, s.height / 2);
  pdSpr.set(key, s); return s;
}
function pdStamp(c, txt, px, font, color, x, y, k = 1) {
  const s = pdSprite(txt, px, font, color), w = s.width * k, h = s.height * k; c.drawImage(s, x - w / 2, y - h / 2, w, h);
}
const PD_EMOJI = "sans-serif", PD_MONO = "ui-monospace,monospace";
function pdOpen() {
  audio(); pd.hidden = false; pdS.last = performance.now(); pdS.still = false; pdText();
  if (!pdS.raf) pdS.raf = requestAnimationFrame(pdLoop);
  const b = pd.querySelector('[data-pd="close"]'); if (b) b.focus({preventScroll: true});
}
function pdClose() {
  if (pd.hidden) return; pd.hidden = true;
  if (document.fullscreenElement === pd && document.exitFullscreen) document.exitFullscreen().catch(() => {});
}
function pdText() {
  const t = nowTrack();
  pd.querySelector(".pd-now").textContent = st.state !== "stop" ? `▶ ${t.artist} - ${t.title}` : "▶ the game's own music";
  pd.querySelector(".pd-drop").textContent = `packets dropped: ${pdS.drops}${RM ? " · still frame (reduced motion)" : ""}`;
}
function pdLoop(now) {
  pdS.raf = pd.hidden ? 0 : requestAnimationFrame(pdLoop);
  if (!pd.hidden) pdFrame(now);
}
function pdFrame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - pdS.last) / 1000)); pdS.last = now;
  if (RM && pdS.still) return;
  // the canvas follows its box (a resize clears it, which is fine: the swirl rebuilds in a second)
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5), cw = Math.max(2, Math.round(pcv.clientWidth * dpr)), ch = Math.max(2, Math.round(pcv.clientHeight * dpr));
  if (pcv.width !== cw || pcv.height !== ch) {pcv.width = cw; pcv.height = ch;}
  if (!pdS.an && MUS.bus && AU.ctx) {pdS.an = AU.ctx.createAnalyser(); pdS.an.fftSize = 512; pdS.an.smoothingTimeConstant = 0.75; MUS.bus.connect(pdS.an); pdS.f = new Uint8Array(256); pdS.t = new Uint8Array(512);}
  const F = pdS.f || new Uint8Array(256), T = pdS.t || new Uint8Array(512).fill(128);
  if (pdS.an) {pdS.an.getByteFrequencyData(F); pdS.an.getByteTimeDomainData(T);}
  const avg = (a,b) => {let n = 0; for (let i = a; i < b; i++) n += F[i]; return n / (b - a) / 255;};
  const bass = avg(1,6), mid = avg(8,40), high = avg(40,120);
  const w = pcv.width, h = pcv.height, cx = w/2, cy = h/2, R = Math.min(w,h)/2, c = pc;
  // the kick drum, from the music's own schedule (MUS.kicks, audio time): a burst of packets as it lands, and while it
  // rings (PD_KICK) the cloud is too busy to take any
  const ct = AU.ctx ? AU.ctx.currentTime : 0, kicks = MUS.kicks || [];
  const beat = kicks.some(k => k > pdS.ct && k <= ct), busy = kicks.some(k => ct >= k && ct - k < PD_KICK); pdS.ct = ct;
  if (RM) {c.fillStyle = "#000"; c.fillRect(0,0,w,h);}
  else { // the swirl: the last frame, zoomed in and turned a touch, slowly fading
    c.save(); c.globalAlpha = 0.93; c.translate(cx,cy); c.rotate(0.004 + mid * 0.025 + (beat ? 0.03 : 0)); const z = 1.012 + bass * 0.035;
    c.scale(z,z); c.drawImage(pcv,-cx,-cy); c.restore();
    c.fillStyle = "rgba(0,0,0,0.075)"; c.fillRect(0,0,w,h);
  }
  pdS.hue = (pdS.hue + dt * (18 + mid * 90)) % 360;
  const hue = pdS.hue;
  // spectrum spokes
  c.lineWidth = Math.max(1, R * 0.012);
  for (let i = 0; i < 48; i++) {
    const v = F[2 + i * 2] / 255, a = i / 48 * Math.PI * 2 + hue / 90, r0 = R * 0.42, r1 = r0 + v * R * 0.5;
    c.strokeStyle = `hsla(${(hue + i * 7) % 360},100%,${45 + v * 25}%,${0.35 + v * 0.6})`;
    c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.stroke();
  }
  // the waveform as a ring
  c.lineWidth = Math.max(1.5, R * 0.01); c.strokeStyle = `hsl(${(hue + 180) % 360},100%,65%)`; c.beginPath();
  for (let i = 0; i <= 128; i++) {
    const v = (T[(i * 4) % 512] - 128) / 128, a = i / 128 * Math.PI * 2, r = R * (0.3 + bass * 0.1) + v * R * 0.2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (i) c.lineTo(x,y); else c.moveTo(x,y);
  }
  c.closePath(); c.stroke();
  // the cloud the packets are heading for
  const core = R * (0.16 + bass * 0.08);
  const g = c.createRadialGradient(cx,cy,0,cx,cy,core * 1.6); g.addColorStop(0,busy ? "rgba(255,70,70,.95)" : `hsla(${hue},100%,80%,.9)`); g.addColorStop(1,"rgba(0,0,0,0)");
  c.fillStyle = g; c.beginPath(); c.arc(cx,cy,core * 1.6,0,Math.PI * 2); c.fill();
  const cloudPx = Math.max(8, Math.round(R * 0.264)); // the cloud at its biggest (bass 1), scaled down to the beat
  pdStamp(c, "☁️", cloudPx, PD_EMOJI, "#fff", cx, cy, core * 1.1 / cloudPx);
  pdStamp(c, busy ? "503 BUSY" : "us-east-1", Math.max(9, Math.round(R * 0.045)), PD_MONO, busy ? "#ff5a5f" : "#fff", cx, cy + core * 0.95);
  // packets: a trickle, and a burst on every beat
  if (!RM) {
    pdS.trickle -= dt;
    const add = (beat ? 2 + Math.floor(bass * 4) : 0) + (pdS.trickle <= 0 && bass + mid > 0.05 ? 1 : 0);
    if (pdS.trickle <= 0) pdS.trickle = 0.45;
    for (let k = 0; k < add && pdS.pk.length < PD_MAX; k++)
      pdS.pk.push({a: sndRand() * Math.PI * 2, r: R * (1.05 + sndRand() * 0.25), s: 0.6 + sndRand() * 0.8,
        k: pdKind(), drop: false});
  }
  const fs = Math.max(12, Math.round(R * 0.075));
  pdS.pk = pdS.pk.filter(p => {
    if (!p.drop) {
      p.r -= dt * R * 0.33 * p.s * (1 + bass * 1.5); p.a += dt * (0.9 + mid * 2.5) * p.s;
      if (p.r < core * 1.1) {
        if (!busy) return false; // delivered
        p.drop = true; pdS.drops++; pdText(); // ...or bounced off on the kick
        p.x = cx + Math.cos(p.a) * p.r; p.y = cy + Math.sin(p.a) * p.r; p.vx = -Math.sin(p.a) * R * 0.6; p.vy = -R * 0.3;
      }
    } else {p.vy += dt * R * 1.6; p.x += p.vx * dt; p.y += p.vy * dt; if (p.y > h + fs * 2) return false;}
    const x = p.drop ? p.x : cx + Math.cos(p.a) * p.r, y = p.drop ? p.y : cy + Math.sin(p.a) * p.r;
    c.globalAlpha = p.drop ? 1 : Math.min(1, 0.35 + (1 - p.r / R) * 1.2); pdStamp(c, p.k.g, fs, p.k.gf || PD_EMOJI, p.k.gc || "#fff", x, y, p.k.gs); c.globalAlpha = 1;
    return true;
  });
  if (RM) for (let i = 0; i < 8; i++) { // the still frame: a fixed ring of packets, one of them not making it
    const a = i / 8 * Math.PI * 2 - Math.PI / 2, r = R * 0.72, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r, drop = i === 3;
    const k = PD_STILL[i]; pdStamp(c, k.g, fs, k.gf || PD_EMOJI, k.gc || "#fff", x, drop ? y + fs : y, k.gs);
  }
  if (high > 0.3 && !RM) {c.fillStyle = `hsla(${hue},100%,90%,${(high - 0.3) * 0.25})`; c.fillRect(0,0,w,h);} // cymbal shimmer
  if (RM) pdS.still = true;
}
pd.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.pd === "close") pdClose();
  else if (b.dataset.pd === "full") {if (document.fullscreenElement === pd) document.exitFullscreen().catch(() => {}); else pd.requestFullscreen().catch(() => {});}
});
pd.addEventListener("keydown", e => e.stopPropagation());
/* drag it by the title bar like Gitamp, kept on screen (not while full screen). It opens centred; once dragged it stays put. */
let pdDrag = null; const pdBar = pd.querySelector(".pd-bar");
pdBar.addEventListener("pointerdown", e => {
  if (e.target.closest("button") || document.fullscreenElement === pd) return;
  const r = pd.getBoundingClientRect(); pdDrag = {dx: e.clientX - r.left, dy: e.clientY - r.top}; pdBar.setPointerCapture(e.pointerId);
});
pdBar.addEventListener("pointermove", e => {
  if (!pdDrag) return;
  const x = Math.min(Math.max(0, e.clientX - pdDrag.dx), innerWidth - pd.offsetWidth), y = Math.min(Math.max(0, e.clientY - pdDrag.dy), innerHeight - 30);
  Object.assign(pd.style, {left: `${x}px`, top: `${y}px`, transform: "none"});
});
pdBar.addEventListener("pointerup", () => {pdDrag = null;}); pdBar.addEventListener("pointercancel", () => {pdDrag = null;});
// Esc closes it while it has focus (it takes focus when opened or clicked); otherwise Esc is the game's pause
pd.tabIndex = -1; pd.addEventListener("pointerdown", e => {if (!e.target.closest("button")) pd.focus({preventScroll: true});});
addEventListener("keydown", e => {if (e.key === "Escape" && !pd.hidden && e.target.closest && e.target.closest("#packetdrop")) {e.preventDefault(); e.stopImmediatePropagation(); pdClose();}}, true);

function open() {
  st.open = true; el.hidden = false; render();
  if (!ticker) ticker = setInterval(() => {scroll++; render();}, 300);
  if (!raf) raf = requestAnimationFrame(meter);
}
function close() {pdClose(); st.open = false; el.hidden = true; st.state = "stop"; st.played = 0; clearInterval(ticker); ticker = null;}

return {
  TRACKS, open, close, act, st,
  vis: {open: pdOpen, close: pdClose, frame: pdFrame, kinds: PD_KINDS, state: () => ({open: !pd.hidden, drops: pdS.drops, packets: pdS.pk.length})},
  toggle: () => (st.open ? close() : open()),
  // what the music should play while Gitamp has it (null: the game decides). own is the game's mood for its own song,
  // which AUTO plays on Gitamp's song. heat null: the game's own (AUTO follows its fires too).
  mood: own => {
    const was = victory(); if (own) st.own = own;
    if (victory() !== was) {render(); if (!pd.hidden) pdText();}
    return st.state === "stop" ? null : victory() ? "victory" : keyOf();
  },
  // a new client: select the song the game would play for it (it plays now if Gitamp is playing, or is ready on Play)
  client: set => {
    const i = TRACKS.findIndex(t => set && t.set[0] === set[0]); if (i < 0 || i === st.i) return;
    if (st.state === "stop") {st.i = i; render();} else go(i);
  },
  heat: () => st.state === "stop" || st.mood === "auto" ? null : st.mood === "hot" ? 2 : 0,
  silent: () => st.state === "pause",
  // a bar went by: after the track's length, on to the next (or round again on repeat)
  bar: () => {if (st.state !== "play" || victory()) return; if (++st.bars >= TRACKS[st.i].bars) {if (st.repeat) {st.bars = 0;} else go(nextIndex(1));}},
};
};
})();
