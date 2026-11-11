// Checks every outside link the game shows: the Learn more readings (LEARN) and the author links (AUTHOR_LINKS).
// Run with: node tests/check-links.mjs
// It needs the internet, so it's separate from tests/regression.html (which runs offline, and which can't read
// another site's status from a browser anyway). Exits 1 if any link is broken. Sites that block scripts (LinkedIn's
// 999, a 403 or a 429) are reported as unverified, not broken: open those by hand if in doubt.
import { readFile } from "node:fs/promises";

const src = await readFile(new URL("../lift-and-shift.html", import.meta.url), "utf8");
const block = (start, end) => {
  const i = src.indexOf(start);
  if (i < 0) throw new Error(`couldn't find ${start} in lift-and-shift.html`);
  return src.slice(i, src.indexOf(end, i));
};
const urls = [...new Set([block("const LEARN={", "\n};"), block("const AUTHOR_LINKS=[", "\n")]
  .flatMap(b => b.match(/https:\/\/[^"'\s]+/g) || []))];

const BLOCKED = new Set([403, 429, 999]);
async function check(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {"user-agent": "Mozilla/5.0 (link check for the Lift & Shift game)", "accept": "text/html,*/*"},
      signal: AbortSignal.timeout(20000),
    });
    res.body?.cancel();
    const moved = res.url && res.url.replace(/\/$/, "") !== url.replace(/\/$/, "") ? ` -> ${res.url}` : "";
    if (res.ok) return {url, state: "ok", note: `${res.status}${moved}`};
    if (BLOCKED.has(res.status)) return {url, state: "unverified", note: `${res.status} (the site blocks scripts)`};
    return {url, state: "broken", note: `${res.status}${moved}`};
  } catch (e) {
    return {url, state: "broken", note: e.cause?.code || e.name || String(e)};
  }
}

const results = await Promise.all(urls.map(check));
const mark = {ok: "ok  ", unverified: "??  ", broken: "FAIL"};
for (const r of results) console.log(`${mark[r.state]} ${r.url}  ${r.note}`);
const broken = results.filter(r => r.state === "broken").length, unverified = results.filter(r => r.state === "unverified").length;
console.log(`\n${results.length} links: ${results.length - broken - unverified} ok, ${unverified} unverified, ${broken} broken`);
process.exitCode = broken ? 1 : 0;
