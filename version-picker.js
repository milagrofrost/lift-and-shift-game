/* Version picker: a dropdown at the top right of the main menu, level with "A cloud migration game", that opens the
   game as it was at an earlier commit (functions/v/[[path]].js serves those from git). "Latest" is the newest
   commit on main that changed the game; older ones are listed by date and short hash, newest first.
   Older builds load this same, current file, so the picker is always there to bring you back. It reads
   window.LAS_VERSION, which /v/ sets on older builds, to know which one is open.
   Without /v/versions.json (a plain static server, file://, GitHub down) nothing is shown. It only adds markup to
   the menu and navigates when you pick a version; it never touches the game or its run. */
(() => {
  if (window.top !== window.self || !/^https?:$/.test(location.protocol)) return; // not in test frames or file://
  const here = window.LAS_VERSION && window.LAS_VERSION.sha;
  const short = sha => sha.slice(0, 8);
  const day = iso => new Date(iso).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});
  let versions = null;

  const style = document.createElement("style");
  style.textContent = `.vpick-row{display:flex;align-items:center;justify-content:space-between;gap:8px 12px;flex-wrap:wrap}
.vpick{font:12.5px var(--f-mono,ui-monospace,Consolas,monospace);color:var(--ink,#e7eef3);background:var(--panel-2,#1c3243);
border:1px solid var(--line,#2a4558);border-radius:6px;padding:0 8px;min-height:32px;max-width:100%;cursor:pointer}
.vpick:hover{border-color:var(--amber,#ffb547)}
.vpick:focus-visible{outline:2px solid var(--leak,#45aefc);outline-offset:2px}
.vpick.old{border-color:var(--amber,#ffb547);color:var(--amber,#ffb547)}
@media (pointer:coarse){.vpick{min-height:44px}}`;

  function build() {
    const sel = document.createElement("select");
    sel.className = "vpick";
    sel.setAttribute("aria-label", "Game version");
    const latest = versions[0], current = here && here !== latest.sha ? here : "";
    const add = (value, label, title) => {
      const o = new Option(label, value, false, value === current);
      if (title) o.title = title;
      sel.add(o);
    };
    add("", `Latest (${short(latest.sha)})`, latest.subject);
    for (const v of versions.slice(1)) add(v.sha, `${day(v.date)} (${short(v.sha)})`, v.subject);
    if (current && !versions.some(v => v.sha === current)) add(current, `This version (${short(current)})`);
    if (current) sel.classList.add("old");
    sel.addEventListener("change", () => { location.href = sel.value ? `/v/${short(sel.value)}/` : "/"; });
    return sel;
  }

  // The menu is rebuilt every time it's shown, so put the picker back each time.
  function place() {
    if (!versions) return;
    for (const eb of document.querySelectorAll("#overlay .eyebrow")) {
      if (!/cloud migration game/i.test(eb.textContent) || eb.parentNode.classList.contains("vpick-row")) continue;
      const row = document.createElement("div");
      row.className = "vpick-row";
      eb.replaceWith(row);
      row.append(eb, build());
    }
  }

  function start() {
    const overlay = document.getElementById("overlay");
    if (!overlay) return;
    document.head.appendChild(style);
    new MutationObserver(place).observe(overlay, {childList: true, subtree: true});
    place();
  }

  fetch("/v/versions.json", {headers: {accept: "application/json"}})
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (!d || !Array.isArray(d.versions) || !d.versions.length) return;
      versions = d.versions;
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
    })
    .catch(() => {});
})();
