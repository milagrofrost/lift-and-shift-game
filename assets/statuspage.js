/* Lift & Shift · Status page: the client's public status page, as a floating window. Type `curl status` in the terminal.

   Like every status page, its headline says "All Systems Operational" until it really can't any more: it owns up to
   "Degraded performance" only after an incident has gone on for 45 seconds of game time (10 with the Status Page
   upgrade), and it never says "outage". The component list below it is honest straight away, so the headline can sit
   green over a red row, as real ones do. It reads the floor's known servers and cloud apps only, never hidden ones:
   offline, on fire, migrating (carried, on the pipeline, stuck on a jammed lane, or a failed blue-green copy), cutover
   failed or rolling back, and breached. A migration with nothing broken reads as maintenance. With the upgrade, a red
   alert reads as scheduled maintenance, with the hallway's users as its visitors (that's the upgrade: they check the
   page instead of grabbing you). Redefine "Uptime" rounds the uptime figure up to 100%.

   Before the upgrade the page is a BETA (status-beta.…) nobody was told about; buying it promotes it to PROD.

   This file loads before the game. The game calls window.LasStatus(G) once with a read-only bridge and keeps the result
   as SP. It never touches S or the game's random rolls (it uses none), and it shows nothing the floor doesn't. */
(() => {
"use strict";
window.LasStatus = G => {
const LAG = 45, LAG_UPGRADE = 10, UPDATE_AFTER = 120; // seconds of game time

/* ==== Reading the floor (known things only) ==== */
const S = () => G.S;
const has = id => !!(S() && S().upgrades && S().upgrades[id]);
function incidents() {
  const s = S(); if (!s || !s.racks) return [];
  const out = [];
  for (const a of s.racks) if (a && !a.hidden && (a.down || a.fire > 0)) out.push(a.name);
  for (const c of s.cloud || []) if (c && !c.staged && (c.down || c.out || c.fire > 0 || c.breach)) out.push(c.name);
  return out;
}

// every known server and app, with what the floor shows for it right now ([label, colour]: g green, b blue, y amber, r red)
function components() {
  const s = S(), moving = new Map();
  const mv = (a, st) => {if (a && !a.hidden && !moving.has(a)) moving.set(a, st);};
  mv(s.carry, ["Migrating", "b"]);
  for (const b of s.bots || []) mv(b.carry, ["Migrating", "b"]);
  for (const j of s.pipe || []) mv(j.a, j.brk != null && j.t >= j.brk * j.dur ? ["Migrating · stuck on the pipeline", "y"] : ["Migrating", "b"]);
  for (const c of s.cloud || []) if (c && c.staged) mv(c.orig, ["Migrating · cloud copy failed, on-prem still up", "y"]);
  const rackSt = a => a.down ? ["Offline", "r"] : a.fire > 0 ? ["On fire", "r"] : moving.has(a) ? [`${moving.get(a)[0]} (still up on-prem)`, moving.get(a)[1]] : ["Operational", "g"];
  const cloudSt = c => c.breach ? ["Breached", "r"] : c.out ? ["Offline · burned out", "r"] : c.fire > 0 ? ["On fire", "r"] : c.down ? (c.rb > 0 ? ["Rolling back", "y"] : c.downT != null ? ["Down · cutover failed", "r"] : ["Offline", "r"]) : ["Operational", "g"];
  const onRack = s.racks.filter(a => a && !a.hidden);
  return {
    prem: onRack.map(a => [a.name, ...rackSt(a)]),
    moving: [...moving].filter(([a]) => !onRack.includes(a)).map(([a, st]) => [a.name, ...st]),
    cloud: (s.cloud || []).filter(c => c && !c.staged).map(c => [c.name, ...cloudSt(c)]),
  };
}

/* ==== The page's own memory: when it noticed, and what it has since "resolved" (outside S) ==== */
const trk = {s: null, sprint: null, since: null, past: [], subscribed: false};
function track() {
  const s = S(); if (!s || G.mode !== "play") return;
  if (trk.sprint !== s.sprint) {trk.past = []; trk.since = null;} // a new client, a new page
  if (trk.since !== null && s.time < trk.since) trk.since = null; // restored from backup to before it noticed
  trk.s = s; trk.sprint = s.sprint;
  const bad = incidents().length > 0 || s.alert;
  if (bad && trk.since === null) trk.since = s.time;
  else if (!bad && trk.since !== null) {
    // only incidents it owned up to make the history; a second of play reads as a minute (status page time)
    if (s.time - trk.since >= lag()) trk.past.unshift({at: s.time, mins: Math.max(1, Math.round(s.time - trk.since))});
    trk.since = null;
  }
}
const lag = () => has("statuspage") ? LAG_UPGRADE : LAG;
setInterval(() => {track(); if (!el.hidden) render();}, 500);

/* ==== The window ==== */
const css = `
#statuspage{position:fixed;z-index:39;left:16px;top:64px;width:min(440px,calc(100vw - 24px));max-height:min(calc(100vh - 24px),600px);display:flex;flex-direction:column;
  background:#fff;color:#1f2933;border:1px solid #9aa5b1;border-radius:8px;box-shadow:0 12px 36px rgba(0,0,0,.55);font:13px/1.4 "IBM Plex Sans","Segoe UI",system-ui,sans-serif;overflow:hidden}
#statuspage[hidden]{display:none}
#statuspage:focus{outline:none}
#statuspage .sp-bar{display:flex;align-items:center;gap:8px;padding:5px 6px 5px 10px;background:#e4e7eb;border-bottom:1px solid #cbd2d9;cursor:move;touch-action:none;user-select:none;-webkit-user-select:none}
#statuspage .sp-url{flex:1;min-width:0;background:#fff;border:1px solid #cbd2d9;border-radius:12px;padding:1px 10px;color:#52606d;font:12px var(--f-mono,ui-monospace,monospace);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#statuspage button{font:inherit;cursor:pointer}
#statuspage .sp-x{min-width:24px;min-height:22px;background:#fff;border:1px solid #9aa5b1;border-radius:4px;color:#1f2933;padding:0 6px}
#statuspage .sp-x:focus-visible,#statuspage .sp-sub:focus-visible{outline:2px solid #2f6fdf;outline-offset:2px}
#statuspage .sp-body{overflow:auto;padding:14px 16px 12px;display:flex;flex-direction:column;gap:12px}
#statuspage .sp-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
#statuspage .sp-head b{font-size:16px}
#statuspage .sp-env{display:inline-block;vertical-align:2px;margin-left:4px;padding:1px 6px;border-radius:9px;font-size:10.5px;font-weight:700;letter-spacing:.06em}
#statuspage .sp-env.beta{background:#fff3c4;color:#8a5a00;border:1px solid #e3a008}#statuspage .sp-env.prod{background:#e3f9e5;color:#1f7a3f;border:1px solid #3fb96b}
#statuspage .sp-sub{background:#2f6fdf;color:#fff;border:0;border-radius:4px;padding:5px 10px;font-weight:600;white-space:nowrap}
#statuspage .sp-banner{border-radius:6px;padding:10px 12px;color:#fff;font-weight:600;font-size:15px}
#statuspage .sp-banner small{display:block;font-weight:400;font-size:12.5px;margin-top:3px;opacity:.95}
#statuspage .ok{background:#2f9e5a}#statuspage .warn{background:#c98a0b}#statuspage .maint{background:#2f6fdf}
#statuspage .sp-up{display:flex;justify-content:space-between;color:#52606d;font-size:12px}
#statuspage .sp-days{display:flex;gap:2px;height:22px}
#statuspage .sp-days i{flex:1;border-radius:2px;background:#3fb96b}#statuspage .sp-days i.w{background:#e3a008}
#statuspage h4{margin:4px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#52606d}
#statuspage ul{list-style:none;margin:0;padding:0;border:1px solid #e4e7eb;border-radius:6px}
#statuspage li{display:flex;justify-content:space-between;gap:10px;padding:6px 10px;border-top:1px solid #e4e7eb}
#statuspage li:first-child{border-top:0}
#statuspage li span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#statuspage li .g,#statuspage li .b,#statuspage li .y,#statuspage li .r{white-space:nowrap;text-align:right}
#statuspage li .g{color:#2f9e5a}#statuspage li .b{color:#2f6fdf}#statuspage li .y{color:#a86f00}#statuspage li .r{color:#c92a2a;font-weight:600}
#statuspage .sp-inc p{margin:0 0 6px}#statuspage .sp-inc b{display:block}
#statuspage .sp-note,#statuspage .sp-foot{color:#616e7c;font-size:12px}
#statuspage .sp-foot{border-top:1px solid #e4e7eb;padding-top:8px;text-align:center}`;
const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);
const el = document.createElement("section");
el.id = "statuspage"; el.hidden = true; el.tabIndex = -1; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Status page");
el.innerHTML = `<div class="sp-bar"><span class="sp-url"></span><button class="sp-x" data-sp="close" aria-label="Close the status page" title="Close (Esc)">×</button></div><div class="sp-body" aria-live="polite"></div>`;
document.body.appendChild(el);
if (G.resizable) G.resizable(el, {minW: 260, minH: 160});
const q = s => el.querySelector(s), esc = t => String(t).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]);

function render() {
  const s = S(), playing = s && s.racks && G.mode !== "title";
  let c = null; try {c = playing ? G.client() : null;} catch (e) {c = null;}
  const name = c ? c.name : G.CO().trade, slug = (c ? c.short || c.name : "lift-and-shift").toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  // before the Status Page upgrade it is a beta nobody was told about; buying it promotes it to prod
  const prod = has("statuspage"), env = `<span class="sp-env ${prod ? "prod" : "beta"}" title="${prod ? "Promoted to production by the Status Page upgrade" : "The Status Page upgrade promotes it to production"}">${prod ? "PROD" : "BETA"}</span>`;
  q(".sp-url").textContent = `https://status${prod ? "" : "-beta"}.${slug}.example`;
  if (!playing) {
    q(".sp-body").innerHTML = `<div class="sp-head"><b>${esc(name)} Status ${env}</b></div>
      <div class="sp-banner ok">✅ All Systems Operational<small>No active engagement. Nothing can be down if nothing is up.</small></div>
      <div class="sp-foot">Powered by ${esc(G.CO().legal)} · Uptime is a state of mind</div>`;
    return;
  }
  const comp = components(), bad = incidents(), long = trk.since !== null && s.time - trk.since >= lag();
  const maint = s.alert && has("statuspage"), degraded = long && !maint;
  const banner = maint ? `<div class="sp-banner maint">🔧 Scheduled maintenance in progress<small>We're making improvements. Thank you for your patience. Visitors right now: ${(s.users || []).length}.</small></div>`
    : degraded ? `<div class="sp-banner warn">🟡 Degraded performance<small>Some users may be experiencing issues. We are investigating.${s.time - trk.since >= UPDATE_AFTER ? " Update: we are continuing to investigate." : ""}</small></div>`
    : comp.moving.length && !bad.length ? `<div class="sp-banner maint">🔧 Migration in progress<small>Some services are moving to the cloud. Brief interruptions are planned. Probably.</small></div>`
    : `<div class="sp-banner ok">✅ All Systems Operational</div>`;
  const spin = G.lvl("spin") > 0, ratio = Math.max(0, Math.min(1, s.err / (s.errMax || 1)));
  const uptime = spin ? "100.00%*" : `${(99 + ratio * 0.99).toFixed(2)}%`; // always 99-point-something; only spin rounds it up
  const days = Array.from({length: 30}, (_, i) => `<i${i === 29 && degraded ? ' class="w"' : ""}></i>`).join("");
  const row = ([n, label, col]) => `<li><span>${esc(n)}</span><span class="${col}">● ${esc(label)}</span></li>`;
  const ss = s.ss || {}, inc = [];
  if (ss.lost) inc.push(`<p><b>Unplanned maintenance${ss.lost > 1 ? ` × ${ss.lost}` : ""}</b>Resolved. A planned degradation event affected some users. Root cause: under investigation (permanently).</p>`);
  if (ss.breaches) inc.push(`<p><b>Security enhancement event${ss.breaches > 1 ? ` × ${ss.breaches}` : ""}</b>Resolved. No customer data was affected. We checked one row.</p>`);
  if (ss.audits) inc.push(`<p><b>Compliance window${ss.audits > 1 ? ` × ${ss.audits}` : ""}</b>Resolved. The auditors have been thanked for their feedback.</p>`);
  for (const p of trk.past) inc.push(`<p><b>Degraded performance</b>Resolved after ${p.mins} min${p.mins > 1 ? "s" : ""}. We have implemented a fix and are monitoring the results.</p>`);
  q(".sp-body").innerHTML = `<div class="sp-head"><b>${esc(name)} Status ${env}</b><button class="sp-sub" data-sp="sub">${trk.subscribed ? "Subscribed ✓" : "Subscribe to updates"}</button></div>
    ${trk.subscribed ? `<div class="sp-note">You're subscribed. Updates will be sent whenever we feel like it.</div>` : ""}
    ${banner}
    <div><div class="sp-up"><span>30 days ago</span><span>Uptime ${uptime}</span><span>Today</span></div><div class="sp-days">${days}</div>
    ${spin ? `<div class="sp-note">*Planned degradation events excluded. All of them were planned.</div>` : ""}</div>
    <h4>On-prem · ${esc(c.short || c.name)}</h4><ul>${comp.prem.map(row).join("") || "<li><span>Nothing here any more</span><span class=\"g\">● Migrated</span></li>"}</ul>
    ${comp.moving.length ? `<h4>Migrating</h4><ul>${comp.moving.map(row).join("")}</ul>` : ""}
    ${comp.cloud.length ? `<h4>Cloud · us-east-1</h4><ul>${comp.cloud.map(row).join("")}</ul>` : ""}
    <h4>Past incidents</h4><div class="sp-inc">${inc.join("") || "<p>No incidents reported. (We didn't look.)</p>"}</div>
    <div class="sp-foot">Powered by ${esc(G.CO().legal)} · ${has("statuspage") ? `Visitors today: ${Math.max((s.users || []).length, 1)}` : "Visitors today: 0. Nobody knows this page exists."}</div>`;
}

el.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.sp === "close") close();
  else if (b.dataset.sp === "sub") {trk.subscribed = true; render();}
});
el.addEventListener("keydown", e => {e.stopPropagation(); if (e.key === "Escape") {e.preventDefault(); close();}}); // Esc closes it while it has focus
el.addEventListener("pointerdown", e => {if (!e.target.closest("button")) el.focus({preventScroll: true});});

/* drag it by the title bar, kept wholly on screen; it moves up if it grows past the bottom */
let drag = null; const bar = q(".sp-bar");
bar.addEventListener("pointerdown", e => {
  if (e.target.closest("button")) return;
  const r = el.getBoundingClientRect(); drag = {dx: e.clientX - r.left, dy: e.clientY - r.top}; bar.setPointerCapture(e.pointerId);
});
bar.addEventListener("pointermove", e => {
  if (!drag) return;
  const x = Math.min(Math.max(0, e.clientX - drag.dx), innerWidth - el.offsetWidth), y = Math.min(Math.max(0, e.clientY - drag.dy), Math.max(0, innerHeight - el.offsetHeight));
  Object.assign(el.style, {left: `${x}px`, top: `${y}px`});
});
const end = () => {drag = null;}; bar.addEventListener("pointerup", end); bar.addEventListener("pointercancel", end);
const keepIn = () => {
  if (el.hidden) return; const r = el.getBoundingClientRect();
  if (r.bottom > innerHeight) el.style.top = `${Math.max(0, innerHeight - r.height)}px`;
  if (r.right > innerWidth) el.style.left = `${Math.max(0, innerWidth - r.width)}px`;
};
if (window.ResizeObserver) new ResizeObserver(keepIn).observe(el); addEventListener("resize", keepIn);

function open() {track(); render(); el.hidden = false; el.focus({preventScroll: true}); keepIn();}
function close() {el.hidden = true;}

return {open, close, render, track, incidents, components, st: trk, isOpen: () => !el.hidden, LAG, LAG_UPGRADE};
};
})();
