#!/usr/bin/env node
/* probe-pacer.mjs — D3 lab helper: verifies the fast3g-proxy pacing shape.
 * Fetches N copies of a large asset in parallel and ignores nothing:
 * each stream must finish in ~size/200KBps + rtt + tick granularity.
 * 4x 57KB = 228KB / 200KBps ≈ 1.14s expected total when the shared bucket
 * is healthy (any result near 10s means the pacer is broken again). */
import http from "node:http";

const PORT = Number(process.argv[2] || 4180);
const PATH = process.argv[3] || "/assets/index-8iJWb3yW.js";
const N = Number(process.argv[4] || 4);

const t0 = Date.now();
const fetchOne = (i) =>
  new Promise((resolve) => {
    const t = Date.now();
    const req = http.get(
      { host: "localhost", port: PORT, path: `${PATH}?p=${i}`, headers: { "accept-encoding": "gzip" } },
      (r) => {
        let n = 0;
        r.on("data", (c) => { n += c.length; });
        r.on("end", () => resolve({ id: i, status: r.statusCode, bytes: n, enc: r.headers["content-encoding"] || "-", ms: Date.now() - t }));
      }
    );
    req.on("error", (e) => resolve({ id: i, error: e.message }));
  });

const rs = await Promise.all(Array.from({ length: N }, (_, i) => fetchOne(i)));
console.log(JSON.stringify(rs));
console.log(`total wall: ${Date.now() - t0} ms for ${N} streams (${(N * 57078) / 200000} s ideal at 200KB/s)`);
