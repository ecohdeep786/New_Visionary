import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import puppeteer from '../frontend/node_modules/puppeteer/lib/puppeteer/puppeteer.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'docs/architecture/diagrams');
const names = process.argv.slice(2);
if (!names.length || names.some(name => !/^[A-Z_]+$/.test(name))) throw new Error('Select diagram names, for example SYSTEM_OVERVIEW LEARN_TEACH.');
const cache = path.join(root, 'artifacts/tmp/architecture-diagrams');
await fs.mkdir(cache, { recursive: true });
await fs.mkdir(path.join(directory, 'rendered'), { recursive: true });
const library = path.join(cache, 'mermaid-11.12.1.min.js');
try { await fs.access(library); } catch {
  const response = await fetch('https://cdn.jsdelivr.net/npm/mermaid@11.12.1/dist/mermaid.min.js', { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Diagram renderer library unavailable: ' + response.status);
  await fs.writeFile(library, Buffer.from(await response.arrayBuffer()));
}
const sha = value => createHash('sha256').update(value).digest('hex');
const browser = await puppeteer.launch({ headless: true });
const records = [];
try {
  for (const name of names) {
    const source = await fs.readFile(path.join(directory, name + '.md'), 'utf8');
    const chart = source.match(/```mermaid\r?\n([\s\S]*?)```/)?.[1];
    if (!chart) throw new Error('No Mermaid diagram: ' + name);
    const layoutPath = path.join(directory, 'source', name.toLowerCase() + '.svg');
    let nativeLayout;
    try { nativeLayout = await fs.readFile(layoutPath, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const page = await browser.newPage();
    await page.setViewport({ width: 1800, height: 1100, deviceScaleFactor: 1.5 });
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff"><main id="diagram" style="padding:28px"></main></body></html>');
    await page.addScriptTag({ path: library });
    const svg = await page.evaluate(async ({ source, nativeLayout }) => {
      window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral', fontFamily: 'Arial, sans-serif', flowchart: { htmlLabels: false, nodeSpacing: 28, rankSpacing: 50, curve: 'linear' } });
      // Parse the logical companion even when a native layout supplies the image.
      await window.mermaid.parse(source);
      const result = nativeLayout ? { svg: nativeLayout } : await window.mermaid.render('visionary-architecture', source);
      const container = document.getElementById('diagram');
      container.innerHTML = result.svg;
      const element = container.querySelector('svg');
      const box = element.viewBox.baseVal;
      element.style.maxWidth = 'none'; element.style.width = box.width + 'px'; element.style.height = box.height + 'px';
      return element.outerHTML;
    }, { source: chart, nativeLayout });
    const output = path.join(directory, 'rendered', name.toLowerCase());
    await fs.writeFile(output + '.svg', svg);
    const element = await page.$('#diagram svg');
    await element.screenshot({ path: output + '.png' });
    records.push({ name, sourceSha256: sha(source), ...(nativeLayout ? { layoutSource: path.relative(root, layoutPath).replaceAll('\\', '/'), layoutSha256: sha(nativeLayout) } : {}), svgSha256: sha(svg), width: await element.evaluate(e => Math.ceil(e.getBoundingClientRect().width)), height: await element.evaluate(e => Math.ceil(e.getBoundingClientRect().height)) });
    console.log('Rendered ' + name);
    await page.close();
  }
  await fs.writeFile(path.join(cache, 'latest-render.json'), JSON.stringify({ mermaidVersion: '11.12.1', librarySha256: sha(await fs.readFile(library)), browser: await browser.version(), records }, null, 2) + '\n');
} finally { await browser.close(); }
