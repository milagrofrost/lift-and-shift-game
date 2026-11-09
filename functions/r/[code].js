// GET /r/<report code>: a shared report. Social networks read the tags; people see the card and a way to play.
import {parseCode, describe, CARD_W, CARD_H} from "../_lib/report.js";

const esc = t => String(t).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));

export function onRequestGet({params, request}) {
  const origin = new URL(request.url).origin, report = parseCode(params.code);
  if (!report) return Response.redirect(`${origin}/`, 302);
  const d = describe(report), title = esc(`${d.head} | Lift & Shift`), image = esc(`${origin}/card/${params.code}.png`), page = esc(`${origin}/r/${params.code}`);
  const desc = esc(`${d.clients} clients, ${d.migrated} apps migrated, ${d.money} IT spend. Can you do better? A browser game about cloud migration while everything else is on fire.`);
  return new Response(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lift &amp; Shift">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${page}">
<meta property="og:image" content="${image}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="${CARD_W}">
<meta property="og:image:height" content="${CARD_H}">
<meta property="og:image:alt" content="${esc(`${d.head}. ${d.sub}`)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${image}">
<style>body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:24px 16px;box-sizing:border-box;background:#0e1a23;color:#e7eef3;font:16px/1.5 system-ui,sans-serif;text-align:center}img{width:100%;max-width:720px;height:auto;border-radius:8px}a{background:#ffb547;color:#1a1206;font-weight:700;padding:12px 22px;border-radius:6px;text-decoration:none}p{margin:0;color:#8ea5b4;max-width:560px}</style>
</head>
<body>
<img src="${image}" width="${CARD_W}" height="${CARD_H}" alt="${esc(`${d.head}. ${d.sub}`)}">
<p>Someone survived a cloud migration, or at least says they did. Your turn.</p>
<a href="/lift-and-shift.html">Play Lift &amp; Shift</a>
</body>
</html>`, {headers: {"content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600"}});
}
