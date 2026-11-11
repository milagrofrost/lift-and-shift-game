/* Shared by the /r/ report page and the /card/ preview image. A report code holds only numbers and fixed choices,
   never free text, so nobody can put their own words on an image served from this domain.
   TITLES and VERDICTS mirror the game; tests/regression.html fails if they drift apart. */
export const TITLES = ["Junior Consultant (pretending)", "Consultant", "Senior Consultant", "Principal Consultant", "Distinguished Consultant", "Partner", "Senior Partner", "Managing Partner", "Living Legend"];
export const VERDICTS = ["Meets expectations", "Needs improvement", "Performance improvement plan", "Escorted out by security", "Legendary disaster"];
const FIRED = {u: "SLA blown", c: "Failed compliance", b: "Breached"};
const FINE = ["Results not audited. The auditors have been through enough.", "Self-assessed with admin access.", "Restored from backup. It was planned, apparently."];

// outcome_role_clients_rating×10_migrated_spend_fineprint_verdict, e.g. r_3_2_35_23_-412_0_0
export function parseCode(code) {
  const m = /^([rucbqox])_(\d)_(\d{1,3})_(\d{1,2})_(\d{1,4})_(-?\d{1,7})_([0-2])_([0-4])$/.exec(String(code));
  if (!m) return null;
  const [, outcome, role, n, avg, mig, spend, fine, verdict] = m;
  if (+role >= TITLES.length || +avg > 50) return null;
  return {outcome, role: +role, n: +n, avg: +avg / 10, mig: +mig, spend: +spend, fine: +fine, verdict: +verdict};
}

export function describe(r) {
  let head, sub;
  if (r.outcome === "r") { head = `Retired as ${TITLES[r.role]}`; sub = "Nobody ever found out about the resume."; }
  else if (r.outcome === "o") { head = "Replaced by AI"; sub = "Automated myself out of a job. That was the job."; }
  else if (r.outcome === "x") { head = "Outsourced"; sub = "Automated the job down to a checklist. The checklist got outsourced."; }
  else if (r.outcome === "q") { head = "Pursuing other opportunities"; sub = `Exit interview: ${VERDICTS[r.verdict]}.`; }
  else { head = "Open to work"; sub = `Official reason: ${FIRED[r.outcome]}. Nobody needs to know that part.`; }
  const money = `${r.spend < 0 ? "-" : ""}$${Math.abs(r.spend)}k`;
  return {head, sub, money, clients: String(r.n), migrated: String(r.mig), rating: r.n ? `${r.avg.toFixed(1)}/5` : "N/A", fine: FINE[r.fine]};
}

/* ---------- preview image: a dependency-free indexed PNG drawn with a 5×7 pixel font ---------- */
export const CARD_W = 1200, CARD_H = 630;
const PALETTE = [[14, 26, 35], [255, 181, 71], [231, 238, 243], [142, 165, 180], [28, 50, 67]];
const BG = 0, AMBER = 1, INK = 2, MUTED = 3, TILE = 4;
const GLYPHS = {" ": "0000000000", "!": "00005f0000", "$": "242a7f2a12", "&": "3649562050", "'": "0008070300", "(": "001c224100", ")": "0041221c00", ",": "0080703000", "-": "0808080808", ".": "0000606000", "/": "2010080402", ":": "0000140000", "?": "0201590906",
  0: "3e5149453e", 1: "00427f4000", 2: "7249494946", 3: "2141494d33", 4: "1814127f10", 5: "2745454539", 6: "3c4a494931", 7: "4121110907", 8: "3649494936", 9: "464949291e",
  A: "7c1211127c", B: "7f49494936", C: "3e41414122", D: "7f4141413e", E: "7f49494941", F: "7f09090901", G: "3e41415173", H: "7f0808087f", I: "00417f4100", J: "2040413f01", K: "7f08142241", L: "7f40404040", M: "7f021c027f", N: "7f0408107f", O: "3e4141413e", P: "7f09090906", Q: "3e4151215e", R: "7f09192946", S: "2649494932", T: "03017f0103", U: "3f4040403f", V: "1f2040201f", W: "3f4038403f", X: "6314081463", Y: "0304780403", Z: "6151494543"};

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc32(bytes) { let c = 0xffffffff; for (const b of bytes) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const out = new Uint8Array(12 + data.length), view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
const textWidth = (text, s) => text.length * 6 * s - s;
function wrap(text, s, max) {
  const lines = []; let line = "";
  for (const w of text.split(" ")) { const t = line ? `${line} ${w}` : w; if (line && textWidth(t, s) > max) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}

export async function renderCard(d) {
  const W = CARD_W, H = CARD_H, M = 60, stride = W + 1, raw = new Uint8Array(stride * H); // each row starts with a zero filter byte
  const rect = (x, y, w, h, c) => { for (let r = y; r < y + h; r++) raw.fill(c, r * stride + 1 + x, r * stride + 1 + x + w); };
  const text = (str, x, y, s, c) => {
    for (const ch of str.toUpperCase()) {
      const g = GLYPHS[ch] || GLYPHS["?"];
      for (let col = 0; col < 5; col++) { const bits = parseInt(g.substr(col * 2, 2), 16); for (let row = 0; row < 8; row++) if (bits >> row & 1) rect(x + col * s, y + row * s, s, s, c); }
      x += 6 * s;
    }
  };
  rect(0, 0, W, 12, AMBER);
  text("Lift & Shift Consulting", M, 44, 5, INK);
  text("End-of-career performance review", M, 94, 3, MUTED);
  let s = 11, lines; do { s--; lines = wrap(d.head, s, W - M * 2); } while ((lines.length > 2 || Math.max(...lines.map(l => textWidth(l, s))) > W - M * 2) && s > 3);
  const lh = s * 9; let y = 150; for (const l of lines) { text(l, M, y, s, AMBER); y += lh; }
  y += 8; for (const l of wrap(d.sub, 3, W - M * 2).slice(0, 2)) { text(l, M, y, 3, INK); y += 30; }
  const tiles = [["Clients", d.clients], ["Migrated", d.migrated], ["Rating", d.rating], ["IT spend", d.money]], gap = 20, tw = Math.floor((W - M * 2 - gap * 3) / 4), top = 420;
  tiles.forEach(([k, v], i) => {
    const x = M + i * (tw + gap); rect(x, top, tw, 124, TILE);
    text(k, x + 18, top + 18, 3, MUTED);
    let vs = 6; while (textWidth(v, vs) > tw - 36 && vs > 2) vs--;
    text(v, x + 18, top + 62, vs, INK);
  });
  text(d.fine, M, 578, 2, MUTED);
  const site = "las.milagrofrost.com"; text(site, W - M - textWidth(site, 3), 572, 3, AMBER);

  const head = new Uint8Array(13), hv = new DataView(head.buffer);
  hv.setUint32(0, W); hv.setUint32(4, H); head[8] = 8; head[9] = 3; // 8-bit, palette
  const idat = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate"))).arrayBuffer());
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", head), chunk("PLTE", new Uint8Array(PALETTE.flat())), chunk("IDAT", idat), chunk("IEND", new Uint8Array(0))];
  const png = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let at = 0;
  for (const p of parts) { png.set(p, at); at += p.length; }
  return png;
}
