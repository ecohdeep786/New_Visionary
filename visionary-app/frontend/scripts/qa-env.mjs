/* F-02 (Staff Frontend Test Infrastructure & Reliability Engineer): shared QA
 * harness environment. One place for the rules every browser harness needs so
 * a script that exists cannot be mistaken for evidence that it passed:
 *
 *   1. Browser resolution strategy — QA_BROWSER_CHANNEL (default msedge) or an
 *      explicit QA_BROWSER_EXECUTABLE. A missing explicit binary or a missing
 *      channel browser throws a typed BLOCKED_ENVIRONMENT error with per-OS
 *      guidance instead of a cryptic playwright stack or, worse, a false PASS.
 *      The old hard-coded `C:\Program Files (x86)\...\msedge.exe` CHROME_PATH
 *      default is Windows-only decoration for the playwright channel launchers
 *      (chrome-launcher-based lighthouse still consumes CHROME_PATH and keeps
 *      its documented env override).
 *   2. Evidence directory law — a run never silently overwrites existing QA
 *      artifacts (S05). A non-empty directory is refused unless the operator
 *      passes ALLOW_EVIDENCE_OVERWRITE=1, and an allowed overwrite is a
 *      DELIBERATE clean slate (rm + fresh mkdir) so stale artifacts can never
 *      be mistaken for the current run's evidence.
 *   3. Receipt metadata law — every receipt carries the beta SHA, timestamp,
 *      browser build, viewport, route, role, locale and an HONEST auth-mode
 *      label: a local preview repository is never described as hosted
 *      Firebase acceptance (S04).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export class BlockedEnvironmentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BlockedEnvironmentError';
    this.code = 'BLOCKED_ENVIRONMENT';
  }
}

const CHANNEL_HINTS = {
  darwin: 'Install Microsoft Edge (channel msedge) or set QA_BROWSER_EXECUTABLE to a Chromium-compatible binary.',
  linux: 'Install Microsoft Edge (microsoft-edge-stable, channel msedge) or set QA_BROWSER_EXECUTABLE to a Chromium-compatible binary.',
  win32: 'Install Microsoft Edge, or set QA_BROWSER_EXECUTABLE to msedge.exe.',
};

/* Build the chromium launch options from the documented environment strategy.
 * Throws BlockedEnvironmentError for a missing explicit binary BEFORE the run
 * starts — a harness must fail loudly here, not limp into a false PASS. */
export function resolveLaunchOptions({ headless = true, args = ['--no-proxy-server'] } = {}) {
  const executable = process.env.QA_BROWSER_EXECUTABLE;
  if (executable) {
    if (!fs.existsSync(executable)) {
      throw new BlockedEnvironmentError(`QA_BROWSER_EXECUTABLE points at a missing browser binary: ${executable}`);
    }
    return { executablePath: executable, headless, args };
  }
  return { channel: process.env.QA_BROWSER_CHANNEL || 'msedge', headless, args };
}

/* Probe-launch the resolved browser and return it with its real version for
 * the receipt. A channel browser that is not installed becomes an explicit
 * BLOCKED_ENVIRONMENT, never a partial run. */
export async function launchReviewedBrowser(playwright, { headless = true, args = ['--no-proxy-server'] } = {}) {
  const options = resolveLaunchOptions({ headless, args });
  try {
    const browser = await playwright.chromium.launch(options);
    return { browser, version: browser.version(), launch: options };
  } catch (error) {
    const hint = CHANNEL_HINTS[process.platform] ?? 'Set QA_BROWSER_EXECUTABLE to a Chromium-compatible browser binary.';
    throw new BlockedEnvironmentError(`No browser binary available for the QA harness (launch: ${options.executablePath ?? `channel ${options.channel}`}). ${hint} Underlying error: ${String(error).slice(0, 200)}`);
  }
}

/* Evidence directory law (S05). Fresh directories are created; non-empty ones
 * are refused unless ALLOW_EVIDENCE_OVERWRITE=1 is set, and an allowed
 * overwrite wipes the directory first so nothing stale survives. */
export async function openEvidenceDir(dir, { allowOverwrite = process.env.ALLOW_EVIDENCE_OVERWRITE === '1' } = {}) {
  let existing = [];
  try {
    existing = await fs.promises.readdir(dir);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (existing.length && !allowOverwrite) {
    throw new Error(`Evidence directory already holds ${existing.length} artifacts: ${dir}. Pass a fresh *_EVIDENCE_DIR, or set ALLOW_EVIDENCE_OVERWRITE=1 to replace it deliberately.`);
  }
  if (existing.length) await fs.promises.rm(dir, { recursive: true, force: true });
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

/* The recorded source SHA for receipts — the checkout the harness actually
 * ran against, with an explicit override for runs outside a git checkout. */
export function betaSha() {
  if (process.env.QA_BETA_SHA) return process.env.QA_BETA_SHA;
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: frontendRoot, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown (set QA_BETA_SHA outside a git checkout)';
  }
}

/* Honest auth-mode labeling (S04): a preview-mode run is a LOCAL preview
 * repository and must never be described as hosted Firebase acceptance. */
export function authModeLabel(source = process.env.VITE_AUTH_MODE) {
  return source === 'firebase'
    ? 'firebase (hosted identity provider; hosted acceptance only where a run explicitly verifies it)'
    : 'preview (local preview repository — NOT hosted acceptance)';
}

/* Standard receipt header for browser/QA artifacts. */
export function receiptMeta({ route = null, viewport = null, role = 'anonymous', locale = 'en', browser = 'unrecorded', authMode } = {}) {
  return {
    betaSha: betaSha(),
    timestamp: new Date().toISOString(),
    browser,
    viewport,
    route,
    role,
    locale,
    authMode: authMode ?? authModeLabel(),
  };
}
