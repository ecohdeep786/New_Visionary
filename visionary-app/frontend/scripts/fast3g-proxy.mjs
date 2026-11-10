#!/usr/bin/env node
/**
 * fast3g-proxy.mjs — dependency-free throttling reverse proxy in front of the
 * production preview server, used by D3 to measure LCP under a Fast 3G
 * connection model (same shape as the Lighthouse "Fast 3G" preset:
 * ~1.6 Mbps down, ~150 ms RTT). No npm dependencies; node:http/node:net only.
 *
 * Usage:
 *   node scripts/fast3g-proxy.mjs --port 4180 --target http://localhost:4173
 *       [--down-bps 1600000] [--rtt-ms 150] [--up-name "host:port"]
 *
 * Model per request:
 *   1. proxy forwards the request to the target immediately
 *   2. first response byte is delayed by rttMs (per request — mimics the
 *      per-request round trips a real network serializes)
 *   3. body bytes are streamed at down-bps bytes/sec from the first byte
 * The proxy buffers each response (preview artifacts are small) so it can
 * emit an honest content-length and pace the write side.
 */
import http from "node:http";
import { URL } from "node:url";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = Number(arg("--port", "4180"));
const TARGET = arg("--target", "http://localhost:4173");
const DOWN_BPS = Number(arg("--down-bps", "1600000")); // 1.6 Mbps (Fast 3G)
const RTT_MS = Number(arg("--rtt-ms", "150"));

const targetUrl = new URL(TARGET);
/* Upstream connections stay short-lived: vite preview restarted underneath a
 * long-lived agent's pooled sockets produces intermittent ECONNRESETs (seen
 * as stray 502s). One fresh socket per request is dirt-cheap next to the
 * 1.6 Mbps wire we are simulating. */
const agent = new http.Agent({ keepAlive: false });

const TICK_MS = 20;
/* DOWN_BPS is BITS per second (Fast 3G ≈ 1.6 Mbps) — wire pacing needs
   bytes, so divide by 8 first: 200,000 B/s -> 4,000 B per 20ms tick. */
const BYTES_PER_TICK = Math.ceil((DOWN_BPS / 8 / 1000) * TICK_MS);

/* Shared token bucket, real-time-corrected. NOTE: this sandbox's event loop
 * is heavily loaded (observed setInterval(20ms) gaps of 230-1700ms), so a
 * fixed "4000 B per tick" pacer under-delivers by ~10-15x. Instead, each
 * wake distributes the bytes OWED since the previous wake, computed from
 * elapsed wall time. Sparse wakes deliver proportionally larger bursts and
 * the AVERAGE stays at down-bps regardless of timer starvation. Credit is
 * capped so an idle period cannot bank a giant instantaneous burst. */
const queue = [];
/* CREDIT_CAP growth (2026-10-26): the first cap of 250ms worth of credit was
 * still too small for THIS sandbox — ticks starve up to ~1,700ms, and a cap
 * that small throws the starved gap's credit away, collapsing measured
 * throughput to ~27KB/s after the first heavy assets land. Real Fast 3G
 * backlogs the cell during a stall and bursts the backlog on recovery, so
 * the bucket now banks >=2000ms worth of credit: any observed wake gap and
 * more is repaid in full, while a single-request burst stays bounded (a
 * browser cannot reach the cap unless it idled >=2s inside an active
 * response — which is exactly a stalled network, faithfully reproduced). */
const CREDIT_CAP = Math.max(BYTES_PER_TICK, Math.ceil((DOWN_BPS / 8000) * 2000)); // ≥2000ms worth
let lastTick = Date.now();
let credit = 0;
let deliverBytes = 0;

setInterval(() => {
  const now = Date.now();
  if (queue.length === 0) {
    lastTick = now; // no debt accrues while the wire is idle
    credit = 0;
    return;
  }
  credit = Math.min(credit + Math.ceil(((DOWN_BPS / 8000) * (now - lastTick)) / 1), CREDIT_CAP);
  lastTick = now;
  let guard = queue.length;
  while (credit > 0 && guard-- > 0) {
    const item = queue.shift();
    if (item.res.destroyed || item.res.writableEnded) { itemLog(item, "dead-drop"); continue; } // dead client — drop
    if (now < item.readyAt) { queue.push(item); continue; } // inside its RTT delay — stay queued
    const slice = item.body.subarray(item.cursor, item.cursor + credit);
    const took = slice.length;
    item.cursor += took;
    credit -= took;
    deliverBytes += took;
    item.res.write(slice);
    if (item.cursor >= item.body.length) {
      itemLog(item, "finish");
      item.res.end();
    } else {
      if (item.cursor === took) itemLog(item, "first-slice", `took=${took}`);
      queue.push(item); // round-robin: other responses get their share
    }
  }
}, TICK_MS);
setInterval(() => {
  console.log(`[fast3g] 2s-window: delivered=${(deliverBytes * 8 / 1000).toFixed(0)} kbps total queue=${queue.length}`);
}, 2000);

/* per-stream trace: each item logs first-slice, last-slice, drop and origin */
const itemLog = (item, ev, extra) => {
  console.log(
    `[fast3g-item] ${ev} ${String(item.path).split("?")[0].slice(-42)} bytes=${item.body.length} status=${item.status} cursor=${item.cursor}${extra ? " " + extra : ""}`
  );
};
const qpush = (item) => {
  queue.push(item);
  itemLog(item, "queue");
};

const server = http.createServer(async (req, res) => {
  const pathOnly = String(req.url).split("?")[0];
  /* D3 font-reuse forensics: log the request fingerprint for font URLs so a
     preload-vs-css mismatch is provable from the trace instead of guessed. */
  if (/\.ttf$/.test(pathOnly)) {
    console.log(
      `[fast3g-req] ${pathOnly} accept=${JSON.stringify(String(req.headers.accept || ""))} dest=${String(req.headers["sec-fetch-dest"] || "-")} mode=${String(req.headers["sec-fetch-mode"] || "-")} origin=${req.headers.origin ? "present" : "absent"} cors=${String(req.headers["access-control-request-headers"] || "-")}`
    );
  }
  const proxied = http.request(
    {
      hostname: targetUrl.hostname,
      port: targetUrl.port || 80,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `${targetUrl.hostname}:${targetUrl.port || 80}` },
      agent,
    },
    (up) => {
      const chunks = [];
      up.on("data", (c) => chunks.push(c));
      up.on("end", () => {
        const body = Buffer.concat(chunks);
        if (res.destroyed) return; // client vanished — do not queue
        const headers = { ...up.headers };
        delete headers["transfer-encoding"]; // buffered body — we emit our own content-length
        /* NOTE: content-encoding is intentionally KEPT. vite preview serves
           gzip/br per Accept-Encoding; Fast3G pacing must model the REAL
           wire, so compression savings stay honest in the measured LCP. */
        headers["content-length"] = String(body.length); // restore framing for the buffered body
        /* Lab determinism: serve every request as if cold — Lighthouse lab
           equivalence. Validators + cache directives of the dev preview must
           not make later tab loads skip the wire (that would fake LCP). */
        delete headers.etag;
        delete headers["last-modified"];
        headers["cache-control"] = "no-store";
        headers["x-fast3g-proxy"] = `rtt=${RTT_MS}ms down=${DOWN_BPS}bps`;
        res.writeHead(up.statusCode, headers);
        /* RTT is enforced by readyAt inside the shared tick loop — the loop
         * distributes no bytes to an item before its delay elapses. A starved
         * setTimeout(RTT_MS) fired 300-800ms late in this environment. */
        qpush({ res, body, cursor: 0, readyAt: Date.now() + RTT_MS, path: pathOnly, status: up.statusCode });
      });
    }
  );
  proxied.on("error", (err) => {
    res.writeHead(502, { "x-fast3g-proxy-error": String(err.message) });
    res.end(`fast3g-proxy upstream error: ${err.message}`);
  });
  req.pipe(proxied);
});

server.listen(PORT, () => {
  console.log(
    `[fast3g-proxy] listening :${PORT} -> ${TARGET} | rtt=${RTT_MS}ms down=${DOWN_BPS}bps (${BYTES_PER_TICK}B/${TICK_MS}ms)`
  );
});
