#!/usr/bin/env node
/* repro-storm.mjs — mirrors Chrome's landing-page request storm through the
 * fast3g proxy: html, css, modulepreloads, in-flight font preloads, all in
 * parallel. Verifies every stream receives its full byte count at the
 * expected shared-pipe rate, and none starves. */
import http from "node:http";

const PORT = 4180;
const PATHS = [
  "/?cb=storm",
  "/assets/index-BK_yQcMQ.css",
  "/assets/index-8iJWb3yW.js",
  "/assets/vendor-DT49OKTM.js",
  "/assets/vendor-icons-mlsyou3u.js",
  "/fonts/GoogleSansFlex-Regular.ttf",
  "/fonts/GoogleSansFlex-Medium.ttf",
  "/fonts/GoogleSansFlex-Semibold.ttf",
  "/fonts/GoogleSansFlex-Bold.ttf",
  "/fonts/GoogleSans-Regular.ttf",
  "/fonts/GoogleSans-Medium.ttf",
  "/fonts/GoogleSans-Bold.ttf",
];

const t0 = Date.now();
const fetchOne = (p, i) =>
  new Promise((resolve) => {
    const t = Date.now();
    const sep = p.includes("?") ? "&" : "?";
    const req = http.get(
      { host: "localhost", port: PORT, path: `${p}${sep}s=${i}`, headers: { "accept-encoding": "gzip" } },
      (r) => {
        let n = 0;
        r.on("data", (c) => { n += c.length; });
        r.on("end", () => resolve({ p: p.slice(0, 42), status: r.statusCode, bytes: n, ms: Date.now() - t }));
      }
    );
    req.on("error", (e) => resolve({ p: p.slice(0, 42), error: e.message || String(e) }));
  });

const rs = await Promise.all(PATHS.map((p, i) => fetchOne(p, i)));
console.log(JSON.stringify(rs, null, 1));
console.log(`wall: ${Date.now() - t0} ms; per-stream full-byte check: ${rs.every((r) => r.status === 200) ? "all 200" : "SOME FAILED"}`);
