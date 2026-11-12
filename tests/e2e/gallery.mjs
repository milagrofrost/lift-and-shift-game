// Builds a static gallery of a CI run's screenshots, play videos and Playwright reports, for Cloudflare Pages.
// Usage: node tests/e2e/gallery.mjs <in> <out> [--title T] [--run URL] [--pr N] [--sha SHA]
//   <in>: a folder holding the run's downloaded artifacts (screenshots-*/<project>/<scene>.png,
//         report-*/test-results/**/video.webm, report-*/playwright-report/), or tests/e2e/out locally.
//   <out>: the site to publish; also writes <out>/gallery.json (what's in it, for the PR comment).
import {readdirSync, statSync, mkdirSync, copyFileSync, writeFileSync, existsSync, cpSync} from 'node:fs';
import {join, basename, dirname, relative, sep} from 'node:path';

const [IN, OUT] = process.argv.slice(2);
const arg = k => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : ''; };
if (!IN || !OUT) { console.error('Usage: node tests/e2e/gallery.mjs <in> <out>'); process.exit(2); }
const walk = d => existsSync(d) ? readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; }) : [];
const files = walk(IN);
mkdirSync(OUT, {recursive: true});

// screenshots: the parent folder is the Playwright project, the file name is the scene
const shots = {};
for (const f of files.filter(f => f.endsWith('.png') && !f.includes(`${sep}playwright-report${sep}`) && !f.includes(`${sep}test-results${sep}`))) {
  const project = basename(dirname(f)), scene = basename(f, '.png');
  if (!/^(desktop|phone|tablet|live)-/.test(project)) continue;
  mkdirSync(join(OUT, 'shots', project), {recursive: true});
  copyFileSync(f, join(OUT, 'shots', project, `${scene}.png`));
  (shots[project] ||= []).push(scene);
}
const projects = Object.keys(shots).sort((a, b) => order(a) - order(b) || a.localeCompare(b));
function order(p) { return p.startsWith('desktop') ? 0 : p.startsWith('phone-portrait') ? 2 : p.startsWith('phone') ? 1 : 3; }
// set-up scenes first (01-…), then the play session stills in time order
const sceneKey = s => (/^\d/.test(s) ? '0' : s.startsWith('play-') ? '1' : '2') + s.replace(/play-(\d+)s/, (m, n) => `play-${n.padStart(3, '0')}`);
const scenes = [...new Set(projects.flatMap(p => shots[p]))].sort((a, b) => sceneKey(a).localeCompare(sceneKey(b)));

// play videos: Playwright names the folder after the test and the project
const videos = [];
// (only from play sessions that ran: a skipped test still leaves a blank video, and the report keeps its own copies)
for (const f of files.filter(f => f.endsWith('.webm') && !f.includes(`${sep}playwright-report${sep}`) && /-play-/.test(basename(dirname(f))))) {
  const dir = basename(dirname(f)).replace(/-retry\d+$/, '');
  const project = projects.find(p => dir.endsWith(p));
  if (!project || !shots[project].includes('play-02s')) continue;
  const name = `${project}${videos.some(v => v.project === project) ? `-${videos.length}` : ''}.webm`;
  mkdirSync(join(OUT, 'videos'), {recursive: true});
  copyFileSync(f, join(OUT, 'videos', name));
  videos.push({project, file: `videos/${name}`});
}

// Playwright HTML reports, one per job
const reports = [];
for (const d of [...new Set(files.filter(f => f.endsWith(`playwright-report${sep}index.html`)).map(dirname))]) {
  const group = basename(dirname(d)).replace(/^report-/, '') || 'report';
  cpSync(d, join(OUT, 'reports', group), {recursive: true});
  reports.push({group, href: `reports/${group}/index.html`});
}

const title = arg('title') || 'Lift & Shift test screenshots', run = arg('run'), pr = arg('pr'), sha = arg('sha');
const label = p => p.replace(/^(desktop|phone|tablet|live)-/, '').replace(/-(chromium|webkit|firefox)$/, ' · $1').replace(/-/g, ' ');
const group = p => p.startsWith('desktop') ? 'Desktop' : p.startsWith('tablet') ? 'Tablet' : 'Phone';
const sceneLabel = s => s.replace(/^\d+-/, '').replace(/-/g, ' ');
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const img = (p, s) => shots[p].includes(s)
  ? `<a class="shot" href="shots/${p}/${s}.png" data-cap="${esc(`${sceneLabel(s)} — ${group(p)} ${label(p)}`)}"><img loading="lazy" src="shots/${p}/${s}.png" alt="${esc(`${sceneLabel(s)} on ${label(p)}`)}"></a>`
  : '<span class="none">—</span>';

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<style>
:root{--bg:#0d1820;--panel:#16232d;--line:#2a3a46;--ink:#e8eef2;--muted:#8fa3b1;--amber:#ffb547;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
header{padding:20px 16px 8px;max-width:1600px;margin:auto}
h1{margin:0 0 4px;font-size:20px}
h2{font-size:16px;margin:28px 0 10px}
.meta{color:var(--muted);font-size:13px}
.meta a,a{color:var(--amber)}
main{padding:0 16px 40px;max-width:1600px;margin:auto}
.tabs{display:flex;gap:6px;margin:14px 0 6px;flex-wrap:wrap}
.tabs button{background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:6px 12px;font:inherit;cursor:pointer}
.tabs button[aria-pressed=true]{border-color:var(--amber);color:var(--amber)}
.wrap{overflow-x:auto;border:1px solid var(--line);border-radius:8px}
table{border-collapse:collapse;min-width:100%}
th,td{border-bottom:1px solid var(--line);padding:6px;vertical-align:top;text-align:left}
thead th{position:sticky;top:0;background:var(--panel);font-weight:600;font-size:12px;white-space:nowrap;z-index:1}
th.row{position:sticky;left:0;background:var(--panel);font-weight:600;font-size:12px;white-space:nowrap;z-index:1}
td img{display:block;height:120px;width:auto;border-radius:4px;border:1px solid var(--line)}
.none{color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.grid figure{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px}
.grid img{width:100%;height:auto;display:block;border-radius:4px}
figcaption{font-size:12px;color:var(--muted);margin-top:6px}
video{width:100%;border-radius:6px;background:#000}
[hidden]{display:none!important}
dialog{border:0;padding:0;background:transparent;max-width:none;max-height:none;width:100vw;height:100vh}
dialog::backdrop{background:rgba(0,0,0,.9)}
.lb{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px;padding:12px}
.lb img{max-width:100%;max-height:calc(100vh - 80px);object-fit:contain}
.lb .bar{display:flex;gap:8px;align-items:center;color:var(--ink);flex-wrap:wrap;justify-content:center}
.lb button{background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:6px 12px;font:inherit;cursor:pointer}
</style>
</head>
<body>
<header>
<h1>${esc(title)}</h1>
<div class="meta">${pr ? `Pull request <a href="https://github.com/milagrofrost/lift-and-shift-game/pull/${esc(pr)}">#${esc(pr)}</a> · ` : ''}${sha ? `commit <code>${esc(sha.slice(0, 7))}</code> · ` : ''}${run ? `<a href="${esc(run)}">run log</a> · ` : ''}${projects.length} screens, ${scenes.length} scenes${videos.length ? `, ${videos.length} play video${videos.length > 1 ? 's' : ''}` : ''}${reports.length ? ` · reports: ${reports.map(r => `<a href="${r.href}">${esc(r.group)}</a>`).join(', ')}` : ''}</div>
<div class="tabs" role="group" aria-label="View">
<button type="button" data-view="scene" aria-pressed="true">By scene</button>
<button type="button" data-view="device" aria-pressed="false">By device</button>
${videos.length ? '<button type="button" data-view="video" aria-pressed="false">Play videos</button>' : ''}
</div>
</header>
<main>
<section data-panel="scene">
<p class="meta">Each row is one scene on every screen. Click a picture to see it full size; arrow keys step through.</p>
<div class="wrap"><table>
<thead><tr><th class="row">Scene</th>${projects.map(p => `<th>${group(p)}<br>${esc(label(p))}</th>`).join('')}</tr></thead>
<tbody>${scenes.map(s => `<tr><th class="row">${esc(sceneLabel(s))}</th>${projects.map(p => `<td>${img(p, s)}</td>`).join('')}</tr>`).join('\n')}</tbody>
</table></div>
</section>
<section data-panel="device" hidden>
${projects.map(p => `<h2>${group(p)} · ${esc(label(p))}</h2><div class="grid">${scenes.filter(s => shots[p].includes(s)).map(s => `<figure>${img(p, s)}<figcaption>${esc(sceneLabel(s))}</figcaption></figure>`).join('')}</div>`).join('\n')}
</section>
${videos.length ? `<section data-panel="video" hidden><div class="grid">${videos.map(v => `<figure><video controls preload="metadata" src="${v.file}"></video><figcaption>${esc(`${group(v.project)} ${label(v.project)}`)}</figcaption></figure>`).join('')}</div></section>` : ''}
</main>
<dialog id="lb" aria-label="Screenshot"><div class="lb"><img alt=""><div class="bar"><button type="button" data-step="-1" aria-label="Previous">◀</button><span id="cap"></span><button type="button" data-step="1" aria-label="Next">▶</button><button type="button" data-close>Close</button></div></div></dialog>
<script>
const tabs=document.querySelectorAll("[data-view]"),panels=document.querySelectorAll("[data-panel]");
const pick=v=>{tabs.forEach(t=>t.setAttribute("aria-pressed",t.dataset.view===v));panels.forEach(p=>p.hidden=p.dataset.panel!==v);try{localStorage.setItem("gallery-view",v)}catch(e){}};
tabs.forEach(t=>t.addEventListener("click",()=>pick(t.dataset.view)));
try{const v=localStorage.getItem("gallery-view");if(v&&document.querySelector('[data-view="'+v+'"]'))pick(v)}catch(e){}
const lb=document.getElementById("lb"),big=lb.querySelector("img"),cap=document.getElementById("cap");let list=[],at=0;
const showAt=i=>{at=(i+list.length)%list.length;const a=list[at];big.src=a.href;big.alt=a.dataset.cap;cap.textContent=a.dataset.cap;};
document.addEventListener("click",e=>{const a=e.target.closest("a.shot");if(!a)return;e.preventDefault();
  list=[...a.closest("section").querySelectorAll("a.shot")];showAt(list.indexOf(a));lb.showModal();});
lb.addEventListener("click",e=>{const s=e.target.closest("[data-step]");if(s)showAt(at+ +s.dataset.step);else if(e.target.closest("[data-close]")||e.target===lb||e.target.classList.contains("lb"))lb.close();});
document.addEventListener("keydown",e=>{if(!lb.open)return;if(e.key==="ArrowRight")showAt(at+1);if(e.key==="ArrowLeft")showAt(at-1);});
</script>
</body>
</html>`;
writeFileSync(join(OUT, 'index.html'), html);
writeFileSync(join(OUT, 'gallery.json'), JSON.stringify({projects, scenes, videos: videos.length, reports: reports.map(r => r.group)}));
console.log(`Gallery: ${projects.length} screens × ${scenes.length} scenes, ${videos.length} videos, ${reports.length} reports → ${relative(process.cwd(), OUT) || OUT}`);
