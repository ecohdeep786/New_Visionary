#!/usr/bin/env node
/* diag-vendor.mjs — ground truth for the vendor chunk path through 4173 and 4180. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const here = path.dirname(url.fileURLToPath(import.meta.url));
const dist = path.resolve(here, "../dist/assets");

const stock = fs
  .readdirSync(dist)
  .filter((f) => /^(vendor|index)-.*\.js$/.test(f))
  .map((f) => ({ f, kb: Math.round(fs.statSync(path.join(dist, f)).size / 1024 * 10) / 10 }));

const probe = (port, p, enc) =>
  new Promise((resolve) => {
    const t = Date.now();
    const req = http.get(
      { host: "localhost", port, path: p, headers: enc ? { "accept-encoding": enc } : {} },
      (r) => {
        let n = 0;
        r.on("data", (c) => { n += c.length; });
        r.on("end", () => resolve({ port, path: p.slice(0, 44), status: r.statusCode, bytes: n, enc: r.headers["content-encoding"] || "-", ms: Date.now() - t }));
      }
    );
    req.on("error", (e) => resolve({ port, path: p.slice(0, 44), error: e.message }));
  });

const jobs = [probe(4173, "/assets/vendor-DT49OKTM.js", "gzip"), probe(4180, "/assets/vendor-DT49OKTM.js?d=1", "gzip"), probe(4173, "/", "gzip")];
console.log(JSON.stringify(await Promise.all(jobs), null, 1));
console.log("dist assets:", JSON.stringify(stock));
