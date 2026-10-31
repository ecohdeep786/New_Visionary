import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { createServer } from 'node:net';

const rootArgument = process.argv.indexOf('--root');
const root = rootArgument < 0 ? resolve(dirname(fileURLToPath(import.meta.url)), '..') : resolve(process.argv[rootArgument + 1] || '');
if (rootArgument >= 0 && !/visionary-production-check-[^/\\]+$/.test(root)) throw Error('Explicit test root must be the owned production-check fixture.');
// Official Firebase CLI downloadableEmulatorInfo.json, version1.22.0.
const name = 'cloud-firestore-emulator-v1.22.0.jar';
const checksum = '9b6498b7f62714d67f48f59b3818883cd682dbcd46b9f59511de81c97bb5166c';
const jar = resolve(process.env.DATA_FIRESTORE_EMULATOR_JAR || join(homedir(), '.cache', 'visionary-emulators', name));
await mkdir(dirname(jar), { recursive: true });
if (!await stat(jar).catch(() => null)) {
  const response = await fetch('https://storage.googleapis.com/firebase-preview-drop/emulator/' + name, { signal: AbortSignal.timeout(120000) });
  if (!response.ok || Number(response.headers.get('content-length')) !== 136707194) throw Error('Official Firestore emulator download failed size admission.');
  await pipeline(Readable.fromWeb(response.body), createWriteStream(jar, { flags: 'wx' }));
}
if ((await stat(jar)).size !== 136707194) throw Error('Firestore emulator size mismatch.');
const digest = createHash('sha256'); for await (const bytes of createReadStream(jar)) digest.update(bytes);
if (digest.digest('hex') !== checksum) throw Error('Firestore emulator SHA256 mismatch.');
const javaHome = process.env.JAVA_HOME_21_X64 || process.env.JAVA_HOME;
const java = process.env.DATA_FIRESTORE_JAVA || (javaHome ? join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java');
const version = spawnSync(java, ['-version'], { encoding: 'utf8', timeout: 10000, windowsHide: true });
if (version.status !== 0 || !/version "(?:2[1-9]|[3-9][0-9])[.]/.test(version.stderr + version.stdout)) throw Error('Java21+ is required for the pinned Firestore emulator.');
const reservation = createServer(); await new Promise((ok, fail) => { reservation.once('error', fail); reservation.listen(0, '127.0.0.1', ok); });
const port = reservation.address().port; await new Promise(ok => reservation.close(ok));
const socketTemp = resolve(process.env.DATA_FIRESTORE_SOCKET_TEMP || join(homedir(), 'Visionary-local', 'kan38-sockets'));
await mkdir(socketTemp, { recursive: true });
// Windows Java's default AF_UNIX temporary pathname can exceed its local limit.
// A short task-local directory fixes that transport issue without public binds.
const args = ['-XX:ActiveProcessorCount=2', '-Xmx512m', '-Djdk.net.unixdomain.tmpdir=' + socketTemp,
  '-jar', jar, '--host=127.0.0.1', '--port=' + port, '--project_id=demo-visionary-kan38'];
let tail = '', exited = false, testChild, interrupted = false;
const emulator = spawn(java, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
emulator.on('error', error => { tail = String(error); exited = true; });
emulator.on('exit', () => { exited = true; });
for (const stream of [emulator.stdout, emulator.stderr]) stream.on('data', bytes => { tail = (tail + String(bytes)).slice(-8000); });
const stop = () => { if (testChild && testChild.exitCode === null && testChild.signalCode === null) testChild.kill('SIGTERM'); if (!exited) emulator.kill('SIGTERM'); };
const interrupt = () => { interrupted = true; stop(); };
process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
try {
  const deadline = Date.now() + 60000; let ready = false;
  while (!exited && Date.now() < deadline) {
    try { const response = await fetch('http://127.0.0.1:' + port, { signal: AbortSignal.timeout(1000) }); await response.arrayBuffer(); ready = true; break; } catch {}
    await new Promise(ok => setTimeout(ok, 250));
  }
  if (!ready) throw Error('Local Firestore emulator failed readiness.');
  const result = await new Promise((ok, fail) => {
    testChild = spawn(process.execPath, ['--test', '--test-reporter=tap', 'backend/tests/contracts/data-03/provisioning.test.mjs'], {
      cwd: root, env: { ...process.env, FIRESTORE_EMULATOR_HOST: '127.0.0.1:' + port }, stdio: 'inherit', windowsHide: true });
    const timeout = setTimeout(() => testChild.kill('SIGTERM'), 120000);
    testChild.once('error', error => { clearTimeout(timeout); fail(error); });
    testChild.once('exit', code => { clearTimeout(timeout); ok(code); });
  });
  if (result !== 0 || interrupted) throw Error('Real SQL/Firestore provisioning checks failed or were interrupted.');
  console.log('PASS: real PostgreSQL and pinned local Firestore provisioning, recovery, concurrency and HTTP authority checks.');
} catch (error) { console.error(tail); throw error; }
finally {
  stop();
  if (testChild?.pid && testChild.exitCode === null && testChild.signalCode === null) {
    await Promise.race([new Promise(ok => testChild.once('exit', ok)), new Promise(ok => setTimeout(ok, 5000))]);
    if (testChild.exitCode === null && testChild.signalCode === null) testChild.kill('SIGKILL');
  }
  if (!exited) await Promise.race([new Promise(ok => emulator.once('exit', ok)), new Promise(ok => setTimeout(ok, 5000))]);
  if (!exited) emulator.kill('SIGKILL');
  process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
}
