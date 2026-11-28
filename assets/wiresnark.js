/* Lift & Shift · WireSnark: a packet capture of the floor, as a floating window. Type `wiresnark` (or `tcpdump`) in the
   terminal. "The world's most popular network protocol analyzer, now with opinions."

   It looks like the real thing (No., Time, Source, Destination, Protocol, Length, Info; the usual colouring rules; a
   packet details tree and a hex dump) and is about as easy to read, except the Info column and the hex dump's ASCII are
   snark. It reacts to what the floor shows:
   - baseline chatter scales with the machines on screen (known racks, live cloud apps, the people in the hallway);
   - outages: a wall of red (RST, retransmissions, ICMP unreachable, 503s);
   - fires: TTL exceeded and warm windows; leaks: exfiltration to 175.45.176.0/22 that grows with the leak;
   - breaches: SSH and big TLS from the same neighbourhood; migrations: rsync (zero window on a jammed lane);
   - investigating an unknown rack: ARP, LLDP and NetBIOS asking who it is (never its name or tier);
   - escalations in flight (target redacted), VPs hunting, full queues.
   Capture time is game time, so pausing the game pauses the capture; Stop does too, and Restart clears it.

   This file loads before the game. The game calls window.LasWireSnark(G) once with a read-only bridge and keeps the
   result as WS. It never touches S or the game's random rolls: its own generator picks the packets. It shows nothing
   the floor doesn't (no hidden servers' names, escalation targets, or anything still to come). */
(() => {
"use strict";
window.LasWireSnark = G => {
let seed = 0x5eed1e55; // its own generator, so it never shifts the game's rolls
const rnd = () => {seed += 0x6D2B79F5; let r = Math.imul(seed ^ seed >>> 15, 1 | seed); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296;};
const pick = a => a[Math.floor(rnd() * a.length)], ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
// rows kept (in the table and in memory: rotated-out packets are dropped from both); packets per game second at most;
// how often the table is redrawn (the capture itself runs every 100 ms)
const MAX_ROWS = 150, MAX_RATE = 45, PAINT_MS = 250;

/* ==== Hosts (made up; 175.45.176.0/22 is the one block everyone recognises) ==== */
const GW = "10.0.0.1", ME = "192.168.1.42", AGENT = "10.0.0.99", DNS = "10.0.0.53", VP = "192.168.1.250";
const prem = i => `10.0.1.${10 + i}`, cloud = i => `172.31.0.${20 + i}`, user = k => `192.168.1.${100 + k}`, kp = () => `175.45.176.${ri(1, 254)}`;
const port = () => ri(49152, 65535), hx = n => Array.from({length: n}, () => ri(0, 255).toString(16).padStart(2, "0")).join("");
const seq = () => ri(1, 4294967295), win = () => pick([0, 512, 1024, 8192, 29200, 64240, 65535]);

/* ==== What each kind of trouble sounds like on the wire ([proto, colour, info, payload snark]) ==== */
const tcpf = (sp, dp, f, extra = "") => `${sp} → ${dp} [${f}] Seq=${seq()} Ack=${seq()} Win=${win()} Len=0${extra}`;
const BASE = [
  (s, d) => ["TCP", "tcp", tcpf(port(), 443, "ACK"), "keepalive. still here. barely."],
  (s, d) => ["DNS", "udp", `Standard query 0x${hx(2)} A is-it-dns.internal`, "it's not DNS. there's no way it's DNS."],
  (s, d) => ["DNS", "udp", `Standard query response 0x${hx(2)} A prod.internal CNAME prod-old.internal CNAME prod-old-final.internal`, "CNAME chain longer than the approval chain"],
  (s, d) => ["HTTP", "http", pick(["GET /api/v1/blame HTTP/1.1", "GET /status HTTP/1.1 (it says it's fine)", "POST /tickets HTTP/1.1  (application/x-www-form-panicked)", "HTTP/1.1 200 OK  (text/html; charset=optimism)", "GET /favicon.ico HTTP/1.1 (the only thing that always works)", "HTTP/1.1 418 I'm a teapot"]), "per my last request"],
  (s, d) => ["TLSv1.3", "tcp", `Application Data, Application Data`, "encrypted. you wouldn't understand it anyway."],
  (s, d) => ["ARP", "arp", `Who has ${GW}? Tell ${s}`, "has anyone seen the gateway? it was here a minute ago"],
  (s, d) => ["SMB2", "smb", pick(["Create Request File: resume_final_v7_REAL.docx", "Read Request Len:65536 File: passwords.txt", "Create Request File: do_not_delete\\prod_backup_FINAL.tar.gz", "Close Request File: budget_Q4_v2(1).xlsx"]), "who shares a drive in 2026"],
  (s, d) => ["LDAP", "tcp", pick(["bindRequest(1) \"cn=Linda,ou=Lunch\" simple", "searchRequest(2) \"ou=People\" wholeSubtree (everyone, again)", "bindResponse(1) invalidCredentials (password expired 90 days ago)"]), "linda is at lunch"],
  (s, d) => ["NTP", "udp", "NTP Version 4, client  (it's always Q4)", "what time is it? Q4."],
  (s, d) => ["SSDP", "udp", "NOTIFY * HTTP/1.1  (the printer wants attention)", "PC LOAD LETTER"],
  (s, d) => ["QUIC", "udp", `Protected Payload (KP0), DCID=${hx(8)}`, "we went UDP so nobody could see us struggle"],
  (s, d) => ["SNMP", "udp", `get-response 1.3.6.1.2.1.1.3.0 sysUpTime=it depends`, "define uptime"],
  (s, d) => ["TCP", "tcp", tcpf(port(), 3389, "SYN", " MSS=1460 SACK_PERM"), "someone left RDP open. it was me."],
];
const DOWN = [
  (ip) => ["TCP", "rst", tcpf(port(), 443, "RST, ACK"), "connection reset by peer (peer is on fire, or off)"],
  (ip) => ["TCP", "bad", `[TCP Retransmission] ${tcpf(port(), 443, "SYN")}`, "hello? hello? HELLO?"],
  (ip) => ["TCP", "bad", `[TCP Dup ACK ${ri(100, 999)}#${ri(2, 9)}] ${tcpf(443, port(), "ACK")}`, "nobody is listening"],
  (ip) => ["ICMP", "icmperr", `Destination unreachable (Host unreachable)`, "it's not you, it's the server. it's gone."],
  (ip) => ["HTTP", "rst", "HTTP/1.1 503 Service Unavailable  (Retry-After: never)", "we are aware of the issue and have chosen inaction"],
  (ip) => ["TCP", "bad", `[TCP Previous segment not captured] ${tcpf(port(), 443, "PSH, ACK")}`, "previous segment also not on the status page"],
];
const FIRE = [
  (ip) => ["ICMP", "icmperr", "Time-to-live exceeded (Time to live exceeded in transit)", "smoke on the wire"],
  (ip) => ["TCP", "bad", `[TCP Window Full] ${tcpf(port(), 443, "ACK")}`, "it's getting warm in here"],
  (ip) => ["SNMP", "udp", `trap 1.3.6.1.4.1.9.9.13 envMonTemperatureStatus=critical(3) temp=yes`, "this is fine"],
];
const LEAK = [
  (ip) => ["TLSv1.2", "tcp", `Application Data  [TCP segment of a reassembled PDU] customers_FULL.csv`, "totally normal outbound traffic. nothing to see."],
  (ip) => ["DNS", "udp", `Standard query 0x${hx(2)} TXT ${hx(12)}.${hx(10)}.exfil-cdn.kp`, "base64 in a subdomain. very stealthy. very normal."],
  (ip) => ["TCP", "tcp", `${port()} → 8443 [PSH, ACK] Seq=${seq()} Ack=${seq()} Win=64240 Len=1460 (GeoIP: KP)`, "backup to an offsite location. very offsite."],
];
const BREACH = [
  (ip) => ["SSHv2", "rst", "Server: Protocol (SSH-2.0-OpenSSH_definitely_legit)", "we would like to report a security enhancement event"],
  (ip) => ["SSHv2", "rst", `Client: Encrypted packet (len=1337)`, "they are in. they are in the mainframe."],
  (ip) => ["TCP", "rst", `${port()} → 4444 [PSH, ACK] Len=1460  (GeoIP: KP)`, "port 4444. classic."],
];
const MIGRATE = [
  (ip) => ["RSYNC", "tcp", `Client Initialisation (Version: 31.0)  sending incremental file list`, "lifting. shifting. hoping."],
  (ip) => ["TCP", "tcp", `${port()} → 873 [PSH, ACK] Len=65160  (it's a whole server)`, "moving a whole server through a straw"],
];
const JAM = [(ip) => ["TCP", "bad", `[TCP ZeroWindow] 873 → ${port()} [ACK] Win=0 Len=0`, "the pipeline is jammed. it's always the pipeline."]];
const PROBE = [
  (ip) => ["ARP", "arp", `Who has ${ip}? Tell ${ME}`, "who even is this server"],
  (ip) => ["LLDP", "arp", `NoS = ????  TTL = 120  SysName = <not documented>`, "nobody wrote this one down"],
  (ip) => ["NBNS", "udp", `Name query NBSTAT *<00><00><00>  (no response)`, "it was here before any of us"],
  (ip) => ["CDP", "arp", `Device ID: ???  Port ID: under Gary's desk`, "asset inventory: vibes"],
];
const ESC = [() => ["SNMP", "rst", `trap ticketEscalated severity=angry target=<redacted, ask in Slack>`, "somebody waited too long"]];
const VPX = [() => ["SMTP", "smb", pick(["C: DATA  Subject: RE: RE: FW: per my last email", "C: RCPT TO:<you@lift-and-shift.example>  (read receipt requested)", "S: 250 OK  (they know you saw it)"]), "did you see my email? just following up."]];
const QFULL = [() => ["HTTP", "bad", "HTTP/1.1 429 Too Many Requests  (ticket queue full)", "please hold. your ticket is important to us."]];

/* ==== Reading the floor (known things only) ==== */
const S = () => G.S;
const prevDisc = new WeakMap(); // weak, so a finished client's racks can be freed
function scene() {
  const s = S(); if (!s || !s.racks) return null;
  const known = [], down = [], fire = [], probe = [];
  s.racks.forEach((a, i) => {
    if (!a) return;
    if (a.hidden) {const d = a.disc || 0, was = prevDisc.get(a) || 0; prevDisc.set(a, d); if (d > was) probe.push(prem(i)); return;}
    known.push(prem(i)); if (a.down) down.push(prem(i)); else if (a.fire > 0) fire.push(prem(i));
  });
  const live = [], leak = [], breach = [];
  (s.cloud || []).forEach((c, i) => {
    if (!c || c.staged) return; live.push(cloud(i));
    if (c.breach) breach.push(cloud(i)); else if (c.down || c.out) down.push(cloud(i)); else if (c.fire > 0) fire.push(cloud(i)); else if (c.leakOn) leak.push([cloud(i), (c.leak || 0) / 100]);
  });
  const moving = (s.carry ? 1 : 0) + (s.bots || []).filter(b => b.carry).length + (s.pipe || []).length;
  const jammed = (s.pipe || []).filter(j => j.brk != null && j.t >= j.brk * j.dur).length;
  const users = (s.users || []).length, hunting = (s.users || []).some(u => u.hunter && !u.leaving);
  return {known, live, down, fire, probe, leak, breach, moving, jammed, users, hunting, esc: (s.atk || []).length, qfull: (s.tk || []).length >= G.ticketLimit(), alert: !!s.alert};
}

/* ==== Capture state (outside S) ==== */
const cap = {on: true, t: 0, n: 0, rows: [], pending: [], last: null, lastS: null, budget: 0, filter: "", sel: null, shown: 0};
function rate(sc) {
  const pcs = sc.known.length + sc.live.length + sc.users + 1; // the machines on screen (and you)
  let r = pcs * 1.1 + sc.down.length * 7 + sc.fire.length * 3 + sc.breach.length * 8 + sc.probe.length * 3 + sc.moving * 2 + sc.esc * 2;
  for (const [, f] of sc.leak) r += 2 + 10 * f; // the exfiltration grows with the leak
  if (sc.alert) r *= 1.4;
  return Math.min(MAX_RATE, r);
}
function packet(sc) {
  // weighted: trouble crowds out the chatter
  const opts = [[BASE, 4, () => pick([...sc.known, ...sc.live, ME])]];
  if (sc.down.length) opts.push([DOWN, 6 * sc.down.length, () => pick(sc.down)]);
  if (sc.fire.length) opts.push([FIRE, 2.5 * sc.fire.length, () => pick(sc.fire)]);
  if (sc.leak.length) opts.push([LEAK, sc.leak.reduce((n, [, f]) => n + 1 + 6 * f, 0), () => pick(sc.leak)[0]]);
  if (sc.breach.length) opts.push([BREACH, 6 * sc.breach.length, () => pick(sc.breach)]);
  if (sc.probe.length) opts.push([PROBE, 3, () => pick(sc.probe)]);
  if (sc.moving) opts.push([sc.jammed ? [...MIGRATE, ...JAM, ...JAM] : MIGRATE, 1.5 * sc.moving, () => pick([...sc.known, ...sc.live, GW])]);
  if (sc.esc) opts.push([ESC, 1.2 * sc.esc, () => GW]);
  if (sc.hunting) opts.push([VPX, 1.2, () => VP]);
  if (sc.qfull) opts.push([QFULL, 1, () => GW]);
  let w = rnd() * opts.reduce((n, o) => n + o[1], 0), o = opts[0];
  for (const x of opts) if ((w -= x[1]) <= 0) {o = x; break;}
  const host = o[2](), [proto, cls, info, snark] = pick(o[0])(host, GW);
  const out = o[0] === LEAK || o[0] === BREACH, inbound = o[0] === BREACH && rnd() < 0.5;
  const src = inbound ? kp() : o[0] === PROBE ? ME : host, dst = out && !inbound ? kp() : o[0] === PROBE ? "ff:ff:ff:ff:ff:ff" : o[0] === BASE ? pick([GW, DNS, AGENT, ...sc.live.slice(0, 3)].filter(Boolean)) : host === GW ? ME : GW;
  const len = /Len=14|1460|65160|1337|reassembled/.test(info) ? ri(1200, 1514) : ri(54, 342);
  cap.n++;
  return {no: cap.n, t: cap.t, src: o[0] === BREACH && !inbound ? host : src, dst: o[0] === BREACH && !inbound ? kp() : dst, proto, len, info, cls, snark};
}
function tick() {
  if (el.hidden) {cap.last = null; return;} // closed: no work at all
  const s = S(), sc = scene();
  if (!s || !sc) {cap.lastS = null; return;}
  if (cap.lastS !== s || cap.last === null || s.time < cap.last) {cap.lastS = s; cap.last = s.time; return;}
  const dt = Math.max(0, s.time - cap.last); cap.last = s.time; // game time: a paused game captures nothing
  if (!cap.on || el.hidden || G.mode !== "play" || !dt) return;
  cap.t += dt; cap.budget += rate(sc) * dt;
  let n = 0, fresh = [];
  while (cap.budget >= 1 && n < 40) {cap.budget--; n++; fresh.push(packet(sc));}
  if (fresh.length) {cap.rows.push(...fresh); if (cap.rows.length > MAX_ROWS) cap.rows.splice(0, cap.rows.length - MAX_ROWS); cap.pending.push(...fresh);}
}

/* ==== The window ==== */
const css = `
#wiresnark{position:fixed;z-index:38;right:16px;bottom:16px;width:min(760px,calc(100vw - 24px));height:min(520px,calc(100vh - 24px));display:flex;flex-direction:column;
  background:#f3f3f3;color:#111;border:1px solid #8a8a8a;border-radius:6px;box-shadow:0 12px 36px rgba(0,0,0,.55);font:12px/1.3 "Segoe UI",system-ui,sans-serif;overflow:hidden}
#wiresnark[hidden]{display:none}
#wiresnark:focus{outline:none}
#wiresnark .ws-bar{display:flex;align-items:center;gap:8px;padding:4px 6px 4px 10px;background:linear-gradient(#e9e9e9,#d6d6d6);border-bottom:1px solid #b5b5b5;cursor:move;touch-action:none;user-select:none;-webkit-user-select:none}
#wiresnark .ws-bar b{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
#wiresnark button{font:inherit;cursor:pointer;color:#111;background:#fdfdfd;border:1px solid #a5a5a5;border-radius:3px;min-width:24px;min-height:22px;padding:0 6px}
#wiresnark button:focus-visible,#wiresnark input:focus-visible{outline:2px solid #2f6fdf;outline-offset:1px}
#wiresnark .ws-tools{display:flex;gap:4px;padding:4px 6px;border-bottom:1px solid #cfcfcf;align-items:center}
#wiresnark .ws-tools .fin{color:#1d6fd6;font-weight:700}#wiresnark .ws-tools .stop{color:#c62828;font-weight:700}#wiresnark .ws-tools .re{color:#2e7d32;font-weight:700}
#wiresnark .ws-tools input{flex:1;min-width:0;font:12px var(--f-mono,ui-monospace,monospace);padding:2px 6px;border:1px solid #a5a5a5;border-radius:3px;background:#fff}
#wiresnark .ws-tools input.ok{background:#afffaf}#wiresnark .ws-tools input.none{background:#ffafaf}
#wiresnark .ws-list{flex:1 1 60%;min-height:60px;overflow:auto;contain:strict;background:#fff;font:11.5px/1.35 var(--f-mono,ui-monospace,monospace)}
#wiresnark table{border-collapse:collapse;width:100%;table-layout:fixed}
#wiresnark th{position:sticky;top:0;background:#ececec;text-align:left;font-weight:600;border-bottom:1px solid #bbb;padding:1px 4px;white-space:nowrap}
#wiresnark td{padding:0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#wiresnark tr{cursor:default}
#wiresnark tr.tcp{background:#e7e6ff}#wiresnark tr.udp{background:#daeeff}#wiresnark tr.http{background:#e4ffc7}#wiresnark tr.arp{background:#faf0d7}
#wiresnark tr.smb{background:#feffd0}#wiresnark tr.icmperr{background:#12272e;color:#b7f774}#wiresnark tr.bad{background:#12272e;color:#f78787}
#wiresnark tr.rst{background:#a40000;color:#fffc9c}
#wiresnark tr.sel{outline:2px solid #2f6fdf;outline-offset:-2px}
#wiresnark tr.hide{display:none}
#wiresnark .ws-detail{flex:1 1 40%;min-height:0;display:grid;grid-template-rows:auto 1fr;border-top:3px double #b5b5b5;background:#fff;overflow:auto;font:11.5px/1.35 var(--f-mono,ui-monospace,monospace)}
#wiresnark .ws-tree{padding:3px 6px;border-bottom:1px solid #ddd;white-space:pre}
#wiresnark .ws-hex{padding:3px 6px;white-space:pre;color:#333}
#wiresnark .ws-hex b{background:#cfe3ff;font-weight:400}
#wiresnark .ws-status{display:flex;gap:14px;padding:2px 8px;border-top:1px solid #b5b5b5;background:#e9e9e9;color:#333;font-size:11px;white-space:nowrap;overflow:hidden}
#wiresnark .ws-status .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#2e7d32;margin-right:4px}
#wiresnark .ws-status .dot.off{background:#c62828}
@media (max-height:520px){#wiresnark .ws-detail{display:none}}`;
const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);
const el = document.createElement("section");
el.id = "wiresnark"; el.hidden = true; el.tabIndex = -1; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "WireSnark packet capture");
el.innerHTML = `<div class="ws-bar"><b>Capturing from eth0 (the floor) — WireSnark</b><button data-ws="close" aria-label="Close WireSnark" title="Close (Esc)">×</button></div>
<div class="ws-tools"><button class="fin" data-ws="start" title="Start capturing packets" aria-label="Start capture">◢</button><button class="stop" data-ws="stop" title="Stop capturing packets" aria-label="Stop capture">■</button><button class="re" data-ws="restart" title="Restart the capture" aria-label="Restart capture">↻</button>
<input type="text" spellcheck="false" autocomplete="off" aria-label="Display filter" placeholder="Apply a display filter … <Ctrl-/>"></div>
<div class="ws-list"><table><colgroup><col style="width:6ch"><col style="width:10ch"><col style="width:16ch"><col style="width:16ch"><col style="width:9.5ch"><col style="width:7.5ch"><col></colgroup>
<thead><tr><th>No.</th><th>Time</th><th>Source</th><th>Destination</th><th>Protocol</th><th>Length</th><th>Info</th></tr></thead><tbody></tbody></table></div>
<div class="ws-detail"><div class="ws-tree">Select a packet to see what it really meant.</div><div class="ws-hex"></div></div>
<div class="ws-status"><span><span class="dot"></span><span class="ws-state">Capturing</span></span><span class="ws-count"></span><span>Profile: Default (Snark)</span></div>`;
document.body.appendChild(el);
if (G.resizable) G.resizable(el, {minW: 320, minH: 180});
const q = s => el.querySelector(s), tbody = q("tbody"), list = q(".ws-list"), input = q("input");
const esc = t => String(t).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"})[c]);
const match = r => !cap.filter || `${r.proto} ${r.src} ${r.dst} ${r.info}`.toLowerCase().includes(cap.filter);
function rowHtml(r) {return `<tr class="${r.cls}${match(r) ? "" : " hide"}" data-no="${r.no}"><td>${r.no}</td><td>${r.t.toFixed(6)}</td><td>${r.src}</td><td>${r.dst}</td><td>${r.proto}</td><td>${r.len}</td><td>${esc(r.info)}</td></tr>`;}
// the table catches up a few times a second, in one go: read the scroll position, then write
function paint() {
  if (!cap.pending.length) return;
  const fresh = cap.pending.slice(-MAX_ROWS); cap.pending = [];
  const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 24;
  tbody.insertAdjacentHTML("beforeend", fresh.map(rowHtml).join(""));
  for (let extra = tbody.rows.length - MAX_ROWS; extra > 0; extra--) tbody.deleteRow(0);
  if (atBottom) list.scrollTop = 1e9;
}
const setText = (sel, t) => {const e = q(sel); if (e.textContent !== t) e.textContent = t;}; // only touch the page when it changed
function status() {
  const shown = cap.filter ? cap.rows.filter(match).length : cap.rows.length;
  setText(".ws-count", `Packets: ${cap.n} · Displayed: ${shown} (${cap.rows.length ? (100 * shown / cap.rows.length).toFixed(1) : "0.0"}%) · Dropped: 0 (that you know of)`);
  setText(".ws-state", !cap.on ? "Stopped" : G.mode === "play" ? "Capturing" : "Capture paused (so is the game)");
  q(".ws-status .dot").classList.toggle("off", !cap.on || G.mode !== "play");
  input.classList.toggle("ok", !!cap.filter && shown > 0); input.classList.toggle("none", !!cap.filter && !shown);
}
function detail(r) {
  const mac = () => `${hx(1)}:${hx(1)}:${hx(1)}:${hx(1)}:${hx(1)}:${hx(1)}`;
  q(".ws-tree").textContent = [
    `▸ Frame ${r.no}: ${r.len} bytes on wire (${r.len * 8} bits), ${r.len} bytes captured (${r.len * 8} bits) on interface eth0`,
    `▸ Ethernet II, Src: Dell_${mac().slice(9)}, Dst: Cisco_ca:fe:${hx(1)}`,
    `▸ Internet Protocol Version 4, Src: ${r.src}, Dst: ${r.dst}`,
    `▸ ${r.proto === "TCP" || /^(TLS|HTTP|SSH|SMB|LDAP|RSYNC|SMTP)/.test(r.proto) ? `Transmission Control Protocol, Src Port: ${port()}, Dst Port: ${port()}` : "User Datagram Protocol, or something like it"}`,
    `▾ ${r.proto}`,
    `    [Expert Info (${/rst|bad|icmperr/.test(r.cls) ? "Error" : "Chat"}/Sequence): ${r.snark}]`,
  ].join("\n");
  const bytes = [...`${hx(14)}`.match(/../g), ...Array.from(r.snark, c => c.charCodeAt(0) & 255).map(b => b.toString(16).padStart(2, "0"))];
  const lines = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16), asc = chunk.map(b => {const c = parseInt(b, 16); return c >= 32 && c < 127 ? String.fromCharCode(c) : ".";}).join("");
    lines.push(`${i.toString(16).padStart(4, "0")}  ${chunk.join(" ").padEnd(47)}   ${esc(asc)}`);
  }
  q(".ws-hex").innerHTML = lines.join("\n");
}
el.addEventListener("click", e => {
  const b = e.target.closest("button");
  if (b) {
    const a = b.dataset.ws;
    if (a === "close") close();
    else if (a === "stop") cap.on = false;
    else if (a === "start") cap.on = true;
    else if (a === "restart") {cap.rows = []; cap.pending = []; cap.n = 0; cap.t = 0; cap.budget = 0; tbody.innerHTML = ""; q(".ws-tree").textContent = "Select a packet to see what it really meant."; q(".ws-hex").textContent = ""; cap.on = true;}
    status(); return;
  }
  const tr = e.target.closest("tbody tr"); if (!tr) return;
  const r = cap.rows.find(x => x.no === +tr.dataset.no); if (!r) return;
  tbody.querySelectorAll("tr.sel").forEach(x => x.classList.remove("sel")); tr.classList.add("sel"); detail(r);
});
input.addEventListener("input", () => {
  cap.filter = input.value.trim().toLowerCase();
  for (const tr of tbody.rows) {const r = cap.rows.find(x => x.no === +tr.dataset.no); tr.classList.toggle("hide", !!r && !match(r));}
  status();
});
el.addEventListener("keydown", e => {
  e.stopPropagation(); // its keys are its own while it has focus
  if (e.key === "Escape") {e.preventDefault(); if (e.target === input && input.value) {input.value = ""; input.dispatchEvent(new Event("input"));} else close();}
  else if (e.key === "/" && e.ctrlKey) {e.preventDefault(); input.focus();}
});
el.addEventListener("pointerdown", e => {if (!e.target.closest("button,input")) el.focus({preventScroll: true});});

/* drag it by the title bar, kept wholly on screen */
let drag = null; const bar = q(".ws-bar");
bar.addEventListener("pointerdown", e => {
  if (e.target.closest("button")) return;
  const r = el.getBoundingClientRect(); drag = {dx: e.clientX - r.left, dy: e.clientY - r.top}; bar.setPointerCapture(e.pointerId);
  Object.assign(el.style, {left: `${r.left}px`, top: `${r.top}px`, right: "auto", bottom: "auto"});
});
bar.addEventListener("pointermove", e => {
  if (!drag) return;
  const x = Math.min(Math.max(0, e.clientX - drag.dx), innerWidth - el.offsetWidth), y = Math.min(Math.max(0, e.clientY - drag.dy), Math.max(0, innerHeight - el.offsetHeight));
  Object.assign(el.style, {left: `${x}px`, top: `${y}px`});
});
const end = () => {drag = null;}; bar.addEventListener("pointerup", end); bar.addEventListener("pointercancel", end);
addEventListener("resize", () => {if (el.hidden || !el.style.left) return; const r = el.getBoundingClientRect();
  if (r.right > innerWidth) el.style.left = `${Math.max(0, innerWidth - r.width)}px`; if (r.bottom > innerHeight) el.style.top = `${Math.max(0, innerHeight - r.height)}px`;});

let paintAt = 0;
setInterval(() => {tick(); if (el.hidden) return; const now = performance.now(); if (now - paintAt >= PAINT_MS) {paintAt = now; paint(); status();}}, 100);
function open() {el.hidden = false; cap.last = null; status(); el.focus({preventScroll: true});}
function close() {el.hidden = true;}

return {open, close, tick, scene, rate, cap, isOpen: () => !el.hidden, rows: () => cap.rows};
};
})();
