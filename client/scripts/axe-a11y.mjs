#!/usr/bin/env node
/**
 * axe-a11y.mjs — end-to-end WCAG 2.1 A/AA audit of the stage-first room.
 *
 * Boots the signaling server (reuses one already on :3001) and a static
 * server for client/build, drives system Chrome through the key UI states
 * and runs axe-core on each. Exits non-zero on any violation or a failed
 * state step. Gradient/backdrop-filter contrast is intentionally left to
 * `npm run test:contrast` (axe returns those as needs-review, not violations).
 *
 * Usage (from client/):
 *   npm run test:a11y
 *   HEADED=1 npm run test:a11y     — watch the browser
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, '..');
const serverRoot = path.resolve(clientRoot, '..', 'server');
const buildDir = path.join(clientRoot, 'build');
const axePath = path.join(clientRoot, 'node_modules', 'axe-core', 'axe.min.js');

const SIGNAL_URL = 'http://localhost:3001';
const WEB_PORT = 4173;
const WEB_URL = `http://localhost:${WEB_PORT}`;
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const HEADED = !!process.env.HEADED;

if (!fs.existsSync(path.join(buildDir, 'index.html'))) {
  console.error('✗ client/build not found — run `npm run build` first.');
  process.exit(1);
}
if (!fs.existsSync(axePath)) {
  console.error('✗ axe-core missing — run `npm i` first.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
let signalChild = null;
let staticServer = null;

function portInUse(port) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host: 'localhost' });
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('error', () => resolve(false));
    sock.setTimeout(1000, () => { sock.destroy(); resolve(false); });
  });
}

async function ensureSignalServer() {
  try {
    const r = await fetch(`${SIGNAL_URL}/server-info`, { signal: AbortSignal.timeout(1500) });
    if (r.ok) { console.log('• reusing HTTP signaling server on :3001'); return; }
  } catch { /* not running or HTTPS */ }
  if (await portInUse(3001)) {
    throw new Error(
      'port 3001 is in use but does not answer plain HTTP (likely the HTTPS server). ' +
      'Stop it and retry — this audit serves the client over HTTP.'
    );
  }
  console.log('• starting HTTP signaling server…');
  signalChild = spawn(process.execPath, ['src/index.js'], {
    cwd: serverRoot,
    env: { ...process.env, HTTPS: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  signalChild.stdout.on('data', () => {});
  signalChild.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  for (let i = 0; i < 60; i++) {
    await sleep(250);
    try {
      const r = await fetch(`${SIGNAL_URL}/server-info`);
      if (r.ok) return;
    } catch { /* not ready */ }
  }
  throw new Error('signaling server did not become ready on :3001');
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.map': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain',
};

async function startStaticServer() {
  staticServer = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let filePath = path.join(buildDir, urlPath);
    if (!filePath.startsWith(buildDir)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(buildDir, 'index.html');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  await new Promise((resolve, reject) => {
    staticServer.once('error', reject);
    staticServer.listen(WEB_PORT, resolve);
  });
  console.log(`• serving client/build on ${WEB_URL}`);
}

async function settleLabels(page) {
  // Buttons with AnimatePresence (share toggle) can briefly show old text
  // while aria-label already updated — wait until visible text matches name.
  await page
    .waitForFunction(() => {
      for (const el of document.querySelectorAll('button[aria-label], a[aria-label]')) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let visible = '';
        while (walker.nextNode()) visible += walker.currentNode.nodeValue;
        visible = visible.replace(/\s+/g, ' ').trim().toLowerCase();
        const name = (el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (visible && name && !name.includes(visible)) return false;
      }
      return true;
    }, { timeout: 4000 })
    .catch(() => {}); // let axe report it if it never settles
}

async function runAxe(page, state) {
  await settleLabels(page);
  const r = await page.evaluate(async (tags) => {
    const res = await window.axe.run(document, {
      runOnly: { type: 'tag', values: tags },
    });
    return {
      violations: res.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 4).map((n) => ({
          target: n.target.join(' '),
          html: n.html.slice(0, 900),
          summary: n.failureSummary?.split('\n').filter(Boolean).slice(-3).join(' | '),
          data: n.any?.[0]?.data ? JSON.stringify(n.any[0].data) : undefined,
        })),
      })),
      incomplete: res.incomplete.map((v) => v.id),
    };
  }, AXE_TAGS);
  if (r.violations.some((v) => v.id === 'label-content-name-mismatch')) {
    r.debug = await page.evaluate(() => {
      const out = [];
      for (const btn of document.querySelectorAll('button[aria-label]')) {
        const walker = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT);
        let visible = '';
        while (walker.nextNode()) visible += walker.currentNode.nodeValue;
        const name = btn.getAttribute('aria-label');
        if (visible && name && !name.toLowerCase().includes(visible.replace(/\s+/g, ' ').trim().toLowerCase())) {
          out.push({ cls: btn.className, vis: visible, al: name, html: btn.outerHTML.slice(0, 400) });
        }
      }
      return out;
    });
  }
  results.push({ state, ...r });
}

async function step(state, fn) {
  process.stdout.write(`• state: ${state} … `);
  try {
    await fn();
    const r = results[results.length - 1];
    console.log(r.violations.length ? `FAIL (${r.violations.length})` : 'pass');
  } catch (err) {
    results.push({ state, violations: [], incomplete: [], error: err.message.split('\n')[0] });
    console.log(`ERROR — ${err.message.split('\n')[0]}`);
  }
}

async function main() {
  await ensureSignalServer();
  await startStaticServer();

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: !HEADED,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--auto-select-desktop-capture-source=Entire screen',
      '--ignore-certificate-errors',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  try {
    const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page1 = await ctx1.newPage();
    page1.on('pageerror', (e) => console.log(`  [page1 error] ${e.message}`));

    await page1.goto(WEB_URL, { waitUntil: 'domcontentloaded' });
    await page1.waitForSelector('input[placeholder="e.g. Alex"]', { timeout: 20000 });
    await page1.addScriptTag({ path: axePath });
    await sleep(500);
    await step('login', () => runAxe(page1, 'login'));

    await page1.fill('input[placeholder="e.g. Alex"]', 'Ada');
    await page1.getByRole('button', { name: /Enter room/ }).click();
    await page1.waitForSelector('[aria-label="Room controls"]', { timeout: 20000 });
    await sleep(800);
    await step('room-rail-open', () => runAxe(page1, 'room-rail-open'));

    await page1.locator('button[aria-controls="chat-rail"]').click();
    await page1.waitForSelector('#chat-rail', { state: 'detached', timeout: 5000 });
    await sleep(300);
    await step('room-rail-collapsed', () => runAxe(page1, 'room-rail-collapsed'));
    await page1.locator('button[aria-controls="chat-rail"]').click();
    await page1.waitForSelector('#chat-rail', { timeout: 5000 });

    await page1.getByRole('button', { name: 'Settings', exact: true }).click();
    await page1.waitForSelector('[role="dialog"][aria-label="Settings"]', { timeout: 5000 });
    await sleep(300);
    await step('settings-dialog', () => runAxe(page1, 'settings-dialog'));
    await page1.keyboard.press('Escape');
    await page1.waitForSelector('[role="dialog"][aria-label="Settings"]', { state: 'detached', timeout: 5000 });

    await page1.locator('button[aria-label="Share Screen"]').click();
    await page1.waitForSelector('button[aria-label="Stop Sharing"]', { timeout: 20000 });
    await sleep(1200);
    await step('share-active', () => runAxe(page1, 'share-active'));

    // Second participant joins and shares; page 1 stages them.
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page2 = await ctx2.newPage();
    page2.on('pageerror', (e) => console.log(`  [page2 error] ${e.message}`));
    await page2.goto(WEB_URL, { waitUntil: 'domcontentloaded' });
    await page2.waitForSelector('input[placeholder="e.g. Alex"]', { timeout: 20000 });
    await page2.addScriptTag({ path: axePath });
    await page2.fill('input[placeholder="e.g. Alex"]', 'Grace');
    await page2.getByRole('button', { name: /Enter room/ }).click();
    await page2.waitForSelector('[aria-label="Room controls"]', { timeout: 20000 });
    await page2.locator('button[aria-label="Share Screen"]').click();
    await page2.waitForSelector('button[aria-label="Stop Sharing"]', { timeout: 20000 });
    await sleep(800);

    const tile = page1.locator('button[aria-label*="shared screen"]').first();
    await tile.waitFor({ timeout: 20000 });
    await tile.click();
    await page1.waitForSelector('button[aria-label="Expand shared screen to fullscreen"]', { timeout: 15000 });
    await sleep(1200);
    await step('staged-remote-share', () => runAxe(page1, 'staged-remote-share'));
    await step('remote-sharer-view', () => runAxe(page2, 'remote-sharer-view'));

    // Ephemeral file transfer: page2 attaches a file; a P2P card appears on
    // both pages (progress bar while moving, ready card with Open/Save once
    // done — axe accepts either state).
    await sleep(1500); // let the voice-PC data channels finish opening
    const tmpFile = path.join(os.tmpdir(), `holyroom-a11y-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, `holyroom a11y file payload ${'x'.repeat(2 * 1024 * 1024)}`);
    await page2.locator('input[type="file"]').setInputFiles(tmpFile);
    await page1.getByRole('group', { name: /File .*\.txt/ }).first().waitFor({ timeout: 20000 });
    await page2.getByRole('group', { name: /File .*\.txt/ }).first().waitFor({ timeout: 20000 });
    await sleep(400);
    await step('file-transfer-out', () => runAxe(page1, 'file-transfer-out'));
    await step('file-transfer-in', () => runAxe(page2, 'file-transfer-in'));
  } finally {
    await browser.close().catch(() => {});
  }

  console.log('\n=== axe-core · WCAG 2.1 A/AA ===');
  let failed = 0;
  for (const r of results) {
    const status = r.error ? 'ERROR' : r.violations.length ? 'FAIL ' : 'PASS ';
    const review = r.incomplete?.length ? `, ${new Set(r.incomplete).size} needs-review` : '';
    console.log(`${status}  ${r.state.padEnd(24)} (${r.violations.length} violations${review})`);
    for (const v of r.violations) {
      console.log(`        • ${v.id} [${v.impact}] ${v.help}`);
      for (const n of v.nodes) {
        console.log(`            ${n.target}`);
        console.log(`              ${n.html}`);
        if (n.summary) console.log(`              → ${n.summary}`);
        if (n.data) console.log(`              data: ${n.data}`);
      }
    }
    if (r.error) console.log(`        ! ${r.error}`);
    if (r.debug?.length) console.log(`        debug: ${JSON.stringify(r.debug, null, 2)}`);
    if (r.error || r.violations.length) failed++;
  }
  console.log('\nNeeds-review (gradients/backdrop-filter) → `npm run test:contrast` is the gate.');
  process.exitCode = failed ? 1 : 0;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    if (signalChild) signalChild.kill();
    if (staticServer) staticServer.close();
  });
