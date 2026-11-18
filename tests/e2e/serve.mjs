// A tiny static server for the repo root that behaves like Cloudflare Pages' pretty URLs, so the tests need nothing
// but Node and Playwright and the service worker meets the same 308 redirects it does in production:
// /lift-and-shift.html → 308 /lift-and-shift, /index.html → 308 /, and the extensionless path serves the .html file.
// Pages under /tests/ are served as they are. Usage: node tests/e2e/serve.mjs [port]
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {extname, join, normalize, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url)).replace(/[\\/]$/, '');
const PORT = +(process.argv[2] || process.env.PORT || 8808);
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8'};
const VERSIONS = [
  {sha: '2421d2f1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', date: '2026-11-17T18:00:00Z', subject: 'Newest game change'},
  {sha: 'ae5fe76a5e7ad6f5ebbbbbbbbbbbbbbbbbbbbbbb', date: '2026-11-12T15:00:00Z', subject: 'An older one'},
  {sha: '2e810f3ccccccccccccccccccccccccccccccccc', date: '2026-11-08T12:00:00Z', subject: 'Save original Lift and Shift game'},
];
const isFile = async f => { try { return (await stat(f)).isFile(); } catch { return false; } };

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x'), path = decodeURIComponent(url.pathname);
    // the older-versions list that functions/v/[[path]].js answers in production, so the menu's picker shows up
    if (path === '/v/versions.json') {
      res.writeHead(200, {'content-type': 'application/json', 'cache-control': 'no-cache'}).end(JSON.stringify({versions: VERSIONS})); return;
    }
    if (path.endsWith('.html') && !path.startsWith('/tests/')) {
      res.writeHead(308, {location: (path === '/index.html' ? '/' : path.slice(0, -5)) + url.search}).end(); return;
    }
    let file = normalize(join(ROOT, path === '/' ? 'index.html' : path));
    if (!file.startsWith(ROOT + sep)) { res.writeHead(403).end(); return; }
    if (!(await isFile(file)) && (await isFile(file + '.html'))) file += '.html';
    if (!(await isFile(file))) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, {'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache'});
    res.end(await readFile(file));
  } catch (e) { res.writeHead(500).end(String(e)); }
}).listen(PORT, '127.0.0.1', () => console.log(`serving ${ROOT} on http://127.0.0.1:${PORT}`));
