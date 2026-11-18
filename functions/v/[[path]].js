// GET /v/...: play an older version of the game, served straight from git. No deployment per commit.
//   /v/versions.json   the commits on main that changed the game, newest first (the main menu's version picker reads it)
//   /v/<sha>/          the game as it was at that commit (7 to 40 hex characters); /v/<sha>/<file> its other files
// Only commits on main that changed lift-and-shift.html are served. GitHub's raw file host also answers for commits
// pushed to forks of the repo, so anything not in that list is refused; otherwise a stranger's page could be served
// from this domain. Old builds get three changes on the way out: their saved data uses its own per-version keys (so
// an old build can never overwrite your current records or settings), their pwa.js does nothing (so an old service
// worker never replaces the current one), and they load the current version-picker.js so you can get back.
export const REPO = "milagrofrost/lift-and-shift-game", GAME = "lift-and-shift.html";
export const LIST_TTL = 600; // seconds before the list is refreshed from GitHub; a stale copy is served if GitHub refuses
const PAGES = 5; // up to 500 game commits
const TYPES = {html: "text/html; charset=utf-8", js: "text/javascript; charset=utf-8", mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8", json: "application/json", webmanifest: "application/manifest+json", png: "image/png",
  jpg: "image/jpeg", svg: "image/svg+xml", ico: "image/x-icon", webp: "image/webp", mp3: "audio/mpeg", ogg: "audio/ogg",
  wav: "audio/wav", woff2: "font/woff2", txt: "text/plain; charset=utf-8", md: "text/plain; charset=utf-8"};
const NOINDEX = {"x-robots-tag": "noindex"};

async function github(env, path) {
  const headers = {"user-agent": "lift-and-shift-versions", accept: "application/vnd.github+json"};
  if (env && env.GITHUB_TOKEN) headers.authorization = `Bearer ${env.GITHUB_TOKEN}`; // optional: a higher rate limit
  const r = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {headers});
  if (!r.ok) throw new Error(`GitHub answered ${r.status}`);
  return r.json();
}

async function fetchVersions(env) {
  const versions = [];
  for (let page = 1; page <= PAGES; page++) {
    const batch = await github(env, `commits?sha=main&path=${GAME}&per_page=100&page=${page}`);
    for (const c of batch) versions.push({sha: c.sha, date: c.commit.committer.date, subject: c.commit.message.split("\n")[0].slice(0, 120)});
    if (batch.length < 100) break;
  }
  if (!versions.length) throw new Error("GitHub listed no versions");
  return versions;
}

// The list, cached at the edge. Refreshed every LIST_TTL seconds; if GitHub fails, the last good list is kept.
export async function listVersions(env, cache, origin, now = Date.now()) {
  const key = new Request(`${origin}/v/versions.json?cache`);
  const hit = await cache.match(key), old = hit ? await hit.json() : null;
  if (old && now - old.fetched < LIST_TTL * 1000) return old;
  try {
    const list = {fetched: now, versions: await fetchVersions(env)};
    await cache.put(key, new Response(JSON.stringify(list), {headers: {"content-type": "application/json", "cache-control": "public, max-age=2592000"}}));
    return list;
  } catch (e) {
    if (old) return old;
    throw e;
  }
}

// a script safe to put inside <script>: JSON with "<" escaped so "</script>" can't end it early
const js = v => JSON.stringify(v).replace(/</g, "\\u003c");
export function patchGame(html, v) {
  const prefix = `liftshift@${v.sha.slice(0, 8)}:`;
  const shim = `<script>/* Added by /v/: this is an older build. Its saved data gets its own keys. */
window.LAS_VERSION=${js({sha: v.sha, date: v.date})};
(()=>{const P=${js(prefix)},S=Storage.prototype;for(const m of["getItem","setItem","removeItem"]){const f=S[m];S[m]=function(k,...a){return f.call(this,P+k,...a);};}})();
</script>${/version-picker\.js/.test(html) ? "" : `\n<script src="./version-picker.js" defer></script>`}\n`;
  for (const at of [/<meta charset[^>]*>\s*/i, /<head[^>]*>\s*/i, /<html[^>]*>\s*/i]) {
    const m = html.match(at);
    if (m) return html.slice(0, m.index + m[0].length) + shim + html.slice(m.index + m[0].length);
  }
  return shim + html;
}

const page = (status, title, text) => new Response(`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Lift &amp; Shift</title>
<style>body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:24px 16px;box-sizing:border-box;background:#0e1a23;color:#e7eef3;font:16px/1.5 system-ui,sans-serif;text-align:center}a{background:#ffb547;color:#1a1206;font-weight:700;padding:12px 22px;border-radius:6px;text-decoration:none}p{margin:0;color:#8ea5b4;max-width:560px}</style>
<h1>${title}</h1><p>${text}</p><a href="/">Play the latest version</a></html>`,
  {status, headers: {"content-type": "text/html; charset=utf-8", "cache-control": "no-store", ...NOINDEX}});
const notFound = () => page(404, "No such version", "That isn't a version of the game on main. Pick one from the menu instead.");

// Bump when patchGame or what an older build is served with changes, so the copies cached at the edge are rebuilt.
export const BUILD = 1;
const EDGE_TTL = 31536000; // a commit never changes, so an older build can stay cached at the edge for a year
const forBrowser = (res, type) => new Response(res.body, {status: res.status, headers: {"content-type": type,
  "cache-control": `public, max-age=${/html/.test(type) ? 3600 : 86400}`, ...NOINDEX}});

export async function onRequestGet({request, env, waitUntil}) {
  const url = new URL(request.url), cache = caches.default;
  const parts = url.pathname.replace(/^\/v\/?/, "").split("/");
  if (!parts[0]) return Response.redirect(`${url.origin}/`, 302);
  const asList = parts[0] === "versions.json" && parts.length === 1;
  const hashed = /^[0-9a-f]{7,40}$/i.test(parts[0]) && parts.length > 1, file0 = parts.slice(1).join("/");
  // Same content for every build, nothing to check: an older build's pwa.js does nothing, and its picker is the current one.
  if (hashed && file0 === "pwa.js") return new Response("/* Older builds don't register a service worker. */\n", {headers: {"content-type": TYPES.js, "cache-control": "public, max-age=3600", ...NOINDEX}});
  if (hashed && file0 === "version-picker.js") return env.ASSETS.fetch(new URL("/version-picker.js", url.origin)); // never cached here
  // An older build that's been served before comes straight from the edge cache: no version list, no GitHub API call.
  // Only builds that passed the list check below are ever put there. The live game at / is a static file Pages serves
  // itself, and the list refreshes on its own, so a new push is never hidden by this cache.
  const buildKey = hashed ? new Request(`${url.origin}${url.pathname}?build=${BUILD}`) : null;
  if (buildKey) {
    const hit = await cache.match(buildKey);
    if (hit) return forBrowser(hit, hit.headers.get("content-type"));
  }
  let list;
  try { list = await listVersions(env, cache, url.origin); }
  catch (e) {
    // the picker just stays hidden on an empty list, with no failed request in the console
    if (asList) return new Response(js({versions: []}), {headers: {"content-type": "application/json", "cache-control": "no-store", ...NOINDEX}});
    return page(503, "Versions unavailable", "GitHub didn't answer just now, so older versions can't be loaded. Try again in a minute.");
  }
  if (asList) {
    return new Response(js({versions: list.versions}), {headers: {"content-type": "application/json", "cache-control": "public, max-age=300", ...NOINDEX}});
  }
  const id = parts[0].toLowerCase();
  if (!/^[0-9a-f]{7,40}$/.test(id)) return notFound();
  const matches = list.versions.filter(v => v.sha.startsWith(id));
  if (matches.length !== 1) return notFound();
  const v = matches[0];
  if (parts.length === 1) return Response.redirect(`${url.origin}/v/${parts[0]}/${url.search}`, 302); // relative paths need the slash
  let file = parts.slice(1).join("/") || GAME;
  if (file === "index.html" || file === "lift-and-shift") file = GAME;
  const ext = (file.match(/\.([a-z0-9]+)$/i) || [])[1];
  if (!ext || !TYPES[ext.toLowerCase()] || file.split("/").some(s => !s || s === "." || s === "..")) return notFound();
  const raw = await fetch(`https://raw.githubusercontent.com/${REPO}/${v.sha}/${file.split("/").map(encodeURIComponent).join("/")}`,
    {cf: {cacheTtl: 2592000, cacheEverything: true}}); // a commit never changes
  if (!raw.ok) return new Response("not found", {status: 404, headers: {"content-type": "text/plain", ...NOINDEX}});
  const type = TYPES[ext.toLowerCase()];
  const body = file === GAME ? patchGame(await raw.text(), v) : await raw.arrayBuffer();
  const stored = new Response(body, {headers: {"content-type": type, "cache-control": `public, max-age=${EDGE_TTL}`}});
  const keep = cache.put(buildKey, stored).catch(() => {}); // a cache miss next time is fine; never fail the page
  if (waitUntil) waitUntil(keep); else await keep;
  return forBrowser(new Response(body), type);
}
