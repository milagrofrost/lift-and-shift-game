/* Lift & Shift · Gitamp: a retro desktop music player for the soundtrack. Type `gitamp` in the terminal.
   It really whips the vendor's SaaS.

   A small floating window that plays any of the game's songs in any mood (Normal, Tense, On fire, Red alert), with a
   playlist, prev/play/pause/stop/next, shuffle, repeat and a spectrum meter. It stays open over play, pause and the menus.
   While it's playing it decides the music; Stop (or closing it) hands the music back to the game.

   This file loads before the game. The game calls window.LasGitamp(G) once with a bridge to its music internals and
   keeps the result as GA. Rules kept from the game: it never touches S or the game's random rolls (shuffle uses the
   sound generator, sndRand), and it only ever changes the music. */
(() => {
"use strict";
window.LasGitamp = G => {
const {AU,MUS,MOODS,SONGS,SONG_SETS,DONUT_SET,audio,setMood,setMusic,sndRand,RM} = G;

/* ==== The playlist: Matt's songs (Day 1 rotation first), then the game's own loops ==== */
const BAND = "Dreams Are For Sleep", OST = "Lift & Shift OST";
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
for (const [m,title,note] of [["calm","Menu","the main menu"],["victory","Victory","between clients"]]) if (MOODS[m]) {
  const bars = 16; TRACKS.push({title, artist: OST, set: [m,m,m], bars, secs: bars * 4 * 60 / MOODS[m].bpm, note, loop: true});
}
const MOOD_NAMES = [["normal","Normal"],["tense","Tense"],["hot","On fire"],["alert","Red alert"]];

/* ==== State: all outside the game's S ==== */
const st = {open: false, state: "stop", i: 0, mood: "normal", shuffle: false, repeat: false, bars: 0, t0: 0, played: 0};
const keyOf = () => {const set = TRACKS[st.i].set; return st.mood === "alert" ? set[2] : st.mood === "normal" ? set[0] : set[1];};
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
el.innerHTML = `<div class="ga-bar"><b>GITAMP</b><i></i><button class="ga-x" data-ga="close" aria-label="Close Gitamp" title="Close (the game gets its music back)">×</button></div>
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
const titleText = () => {const t = TRACKS[st.i]; return `${st.i+1}. ${t.artist} - ${t.title}`;};
function render() {
  const t = TRACKS[st.i], single = !!t.loop;
  const full = `${titleText()}  ***  `, w = 34;
  q(".ga-title").textContent = RM || full.length - 7 <= w ? titleText() : (full + full).slice(scroll % full.length, scroll % full.length + w);
  q(".ga-time").textContent = mmss(elapsed());
  q(".ga-mood").textContent = single ? "LOOP" : MOOD_NAMES.find(m => m[0] === st.mood)[1].toUpperCase();
  q(".ga-state").textContent = !AU.on ? "SOUND OFF (M)" : st.state === "play" ? "PLAYING" : st.state === "pause" ? "PAUSED" : "STOPPED · GAME MUSIC";
  el.querySelectorAll("[data-mood]").forEach(b => {b.setAttribute("aria-pressed", String(!single && b.dataset.mood === st.mood)); b.disabled = single;});
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
  render();
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
  else if (a === "close") close();
}
el.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (e.detail > 0) b.blur(); // a mouse click: the keys go back to the game
  if (b.dataset.ga) act(b.dataset.ga);
  else if (b.dataset.mood) {st.mood = b.dataset.mood; if (st.state === "stop") play(); else {if (MUS.started) setMood(keyOf()); render();}}
  else if (b.dataset.track) {audio(); if (!MUS.on) setMusic(true); st.state = "play"; go(+b.dataset.track);}
});
el.addEventListener("keydown", e => e.stopPropagation()); // Space on a focused button is the button's, not the game's

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

function open() {
  st.open = true; el.hidden = false; render();
  if (!ticker) ticker = setInterval(() => {scroll++; render();}, 300);
  if (!raf) raf = requestAnimationFrame(meter);
}
function close() {st.open = false; el.hidden = true; st.state = "stop"; st.played = 0; clearInterval(ticker); ticker = null;}

return {
  TRACKS, open, close, act, st,
  toggle: () => (st.open ? close() : open()),
  // what the music should play while Gitamp has it (null: the game decides)
  mood: () => st.state === "stop" ? null : keyOf(),
  heat: () => st.state === "stop" ? null : st.mood === "hot" ? 2 : 0,
  silent: () => st.state === "pause",
  // a bar went by: after the track's length, on to the next (or round again on repeat)
  bar: () => {if (st.state !== "play") return; if (++st.bars >= TRACKS[st.i].bars) {if (st.repeat) {st.bars = 0;} else go(nextIndex(1));}},
};
};
})();
