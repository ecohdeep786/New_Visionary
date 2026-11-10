#!/usr/bin/env node
/* diag-encoding.mjs — check how vite preview (4173) and fast3g-proxy (4180)
 * answer various accept-encoding requests for the landing JS asset. */
import http from "node:http";

const probe = (port, path, enc) =>
  new Promise((resolve) => {
    const req = http.get(
      { host: "localhost", port, path, headers: enc ? { "accept-encoding": enc } : {} },
      (r) => {
        let n = 0;
        r.on("data", (c) => { n += c.length; });
        r.on("end", () => resolve({ port, enc: enc || "(none)", status: r.statusCode, bytes: n, cc: r.headers["content-encoding"] || "-", ct: (r.headers["content-type"] || "").slice(0, 30) }));
      }
    );
    req.on("error", (e) => resolve({ port, enc: enc || "(none)", error: e.message }));
  });

const jobs = [
  probe(4173, "/assets/index-8iJWb3yW.js", "gzip"),
  probe(4180, "/assets/index-8iJWb3yW.js?diag=a", "gzip"),
  probe(4180, "/assets/index-8iJWb3yW.js?diag=b", "gzip, deflate, br"),
  probe(4180, "/assets/index-8iJWb3yW.js?diag=c", ""),
];
console.log(JSON.stringify(await Promise.all(jobs), null, 1));
