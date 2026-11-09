// GET /card/<report code>.png: the 1200×630 link-preview image for one report.
import {parseCode, describe, renderCard} from "../_lib/report.js";

export async function onRequestGet(context) {
  const {params, request} = context;
  const report = parseCode(String(params.code).replace(/\.png$/, ""));
  if (!report) return new Response("Not found", {status: 404});
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const hit = cache && await cache.match(request);
  if (hit) return hit;
  const res = new Response(await renderCard(describe(report)), {headers: {"content-type": "image/png", "cache-control": "public, max-age=31536000, immutable"}});
  if (cache) context.waitUntil(cache.put(request, res.clone()));
  return res;
}
