import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createHmac } from 'node:crypto';

// Isolated middleware harness using the deployed dependency lock. No Firebase,
// credentials, customer records or payment provider connections are involved.
test('deployed parsers retain byte caps/raw signatures and survive malformed compressed input', { timeout: 60000 }, async () => {
  const runtimePackage = fileURLToPath(new URL('../runtime/package.json', import.meta.url));
  const source = `
    const req = require('node:module').createRequire(${JSON.stringify(runtimePackage)});
    const express = req('express'), { createHmac } = require('node:crypto');
    const app = express();
    app.use('/webhook', express.raw({type:'application/json',limit:'256kb'}));
    app.use(express.json({limit:'24kb'}));
    app.post('/json', (req,res) => res.json({ok:true}));
    app.post('/webhook', (req,res) => {
      const signature = createHmac('sha256','synthetic-only').update(req.body).digest('hex');
      res.status(signature === req.get('X-Signature') ? 200 : 403).json({raw:Buffer.isBuffer(req.body),bytes:req.body.length});
    });
    app.use((error,req,res,next) => res.status(error.status || 500).json({error:'bounded fixture rejection'}));
    const server = app.listen(0,'127.0.0.1', () => process.send({port:server.address().port}));
  `;
  const child = spawn(process.execPath, ['-e', source], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true });
  let diagnostics = '';
  child.stderr.on('data', value => { diagnostics = (diagnostics + value).slice(-4000); });
  const started = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Parser fixture startup timed out: ' + diagnostics)), 15000);
    child.once('message', value => { clearTimeout(timer); resolve(value); });
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(Error('Parser fixture exited: ' + code + ' ' + diagnostics)); });
  });
  try {
    const { port } = await started;
    const url = `http://127.0.0.1:${port}`;
    const body = bytes => JSON.stringify({ text: 'x'.repeat(bytes - 11) });
    const post = (route, value, headers = {}) => fetch(url + route, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: value,
      signal: AbortSignal.timeout(10000),
    });
    for (const offset of [-1, 0, 1]) {
      const response = await post('/json', body(24576 + offset));
      assert.equal(response.status, offset <= 0 ? 200 : 413);
      await response.arrayBuffer();
    }
    for (const offset of [-1, 0, 1]) {
      const wire = body(262144 + offset);
      const signature = createHmac('sha256', 'synthetic-only').update(wire).digest('hex');
      const response = await post('/webhook', wire, { 'X-Signature': signature });
      assert.equal(response.status, offset <= 0 ? 200 : 413);
      const result = await response.json();
      if (offset <= 0) { assert.equal(result.raw, true); assert.equal(result.bytes, 262144 + offset); }
    }
    const signed = '{ "fixture": true }';
    const signature = createHmac('sha256', 'synthetic-only').update(signed).digest('hex');
    const tampered = await post('/webhook', JSON.stringify(JSON.parse(signed)), { 'X-Signature': signature });
    assert.equal(tampered.status, 403);
    await tampered.arrayBuffer();

    // Expanded bytes, rather than the smaller compressed length, must hit 413.
    const expanded = await post('/json', gzipSync(body(24577)), { 'Content-Encoding': 'gzip' });
    assert.equal(expanded.status, 413);
    await expanded.arrayBuffer();

    // GHSA-27r3-jxmh-p828: trailing garbage must not leave a decoder error able
    // to crash the process after an otherwise successful compressed request.
    const trailing = Buffer.concat([gzipSync('{"fixture":true}'), Buffer.from('invalid trailing compressed bytes')]);
    try {
      const response = await post('/json', trailing, { 'Content-Encoding': 'gzip' });
      assert.ok([200, 400, 415].includes(response.status));
      await response.arrayBuffer();
    } catch (error) {
      assert.ok(error instanceof TypeError, 'Only a closed malformed request may reject the fetch');
    }
    // A subsequent request proves the isolated parser process remains alive.
    const healthy = await post('/json', '{}');
    assert.equal(healthy.status, 200, diagnostics);
    await healthy.arrayBuffer();
    assert.equal(child.exitCode, null, diagnostics);
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
  }
});
