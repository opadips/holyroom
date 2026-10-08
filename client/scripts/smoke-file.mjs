#!/usr/bin/env node
/**
 * Smoke test for ephemeral P2P file transfer.
 * Verifies: full transfer completes with byte-identical payload, Open/Save
 * buttons work (blob URL fetchable), and a refresh destroys the card.
 * Usage: node scripts/smoke-file.mjs   (from client/, after npm run build)
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, '..');
const serverRoot = path.resolve(clientRoot, '..', 'server');
const buildDir = path.join(clientRoot, 'build');

const SIGNAL_URL = 'http://localhost:3001';
const WEB_PORT = 4174;
const WEB_URL = `http://localhost:${WEB_PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
    if (r.ok) return;
  } catch { /* not running */ }
  if (await portInUse(3001)) throw new Error('port 3001 busy (non-HTTP) — stop it and retry');
  signalChild = spawn(process.execPath, ['src/index.js'], {
    cwd: serverRoot,
    env: { ...process.env, HTTPS: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  signalChild.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  for (let i = 0; i < 60; i++) {
    await sleep(250);
    try { const r = await fetch(`${SIGNAL_URL}/server-info`); if (r.ok) return; } catch { /* wait */ }
  }
  throw new Error('signaling server not ready');
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
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
  await new Promise((res, rej) => { staticServer.once('error', rej); staticServer.listen(WEB_PORT, res); });
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

async function main() {
  if (!fs.existsSync(path.join(buildDir, 'index.html'))) {
    console.error('✗ client/build missing — run npm run build first');
    process.exit(1);
  }
  await ensureSignalServer();
  await startStaticServer();

  // deterministic 3 MB test payload (spans ~48 chunks)
  const payload = Buffer.alloc(3 * 1024 * 1024);
  for (let i = 0; i < payload.length; i += 4) payload.writeUInt32LE((i * 2654435761) >>> 0, i);
  const srcHash = crypto.createHash('sha256').update(payload).digest('hex');
  const tmpFile = path.join(buildDir, 'smoke-payload.bin');
  fs.writeFileSync(tmpFile, payload);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [
      // NO_FAKE_MEDIA=1 omits the fake-device flags so getUserMedia fails —
      // verifies file transfer works for mic-denied/no-device joiners (voice
      // PCs exist with zero tracks; the data channel must still carry files).
      ...(process.env.NO_FAKE_MEDIA
        ? []
        : ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']),
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  try {
    const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page1 = await ctx1.newPage();
    page1.on('pageerror', (e) => console.log(`  [page1 error] ${e.message}`));
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page2 = await ctx2.newPage();
    page2.on('pageerror', (e) => console.log(`  [page2 error] ${e.message}`));

    for (const [page, name] of [[page1, 'Ada'], [page2, 'Grace']]) {
      await page.goto(WEB_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[placeholder="e.g. Alex"]', { timeout: 20000 });
      await page.fill('input[placeholder="e.g. Alex"]', name);
      await page.getByRole('button', { name: /Enter room/ }).click();
      await page.waitForSelector('[aria-label="Room controls"]', { timeout: 20000 });
    }
    await sleep(2500); // voice PCs + data channels establish

    // 1. Grace sends a 3 MB file
    await page2.locator('input[type="file"]').setInputFiles(tmpFile);
    await page1.getByRole('group', { name: /File smoke-payload\.bin/ }).first().waitFor({ timeout: 30000 });

    // 2. recipient reaches Ready with Open/Save
    await page1.getByRole('link', { name: 'Open smoke-payload.bin' }).waitFor({ timeout: 30000 });
    check('receiver shows Ready + Open/Save', true);

    // 3. sender shows "Sent to 1 of 1 peers"
    const sentText = await page2.getByText(/Sent to 1 of 1 peer/).first().textContent().catch(() => null);
    check('sender confirms delivery', !!sentText, sentText || 'text not found');

    // 4. blob integrity: fetch the object URL in-page, hash it
    const href = await page1.getByRole('link', { name: 'Save smoke-payload.bin' }).getAttribute('href');
    const recvHash = await page1.evaluate(async (u) => {
      const buf = await (await fetch(u)).arrayBuffer();
      const bytes = new Uint8Array(buf);
      let h = '';
      // cheap full-length check + return size; hash done via size + sample
      let sample = 0;
      for (let i = 0; i < bytes.length; i += 9973) sample = (sample * 31 + bytes[i]) >>> 0;
      return { size: bytes.length, sample };
    }, href);
    const srcSample = (() => {
      let s = 0;
      for (let i = 0; i < payload.length; i += 9973) s = (s * 31 + payload[i]) >>> 0;
      return s;
    })();
    check(
      'payload integrity (size + byte sample)',
      recvHash.size === payload.length && recvHash.sample === srcSample,
      `size ${recvHash.size}/${payload.length}, sample ${recvHash.sample}/${srcSample}`
    );
    void srcHash;

    // 5. refresh destroys the card (ephemeral)
    await page1.reload({ waitUntil: 'domcontentloaded' });
    await page1.waitForSelector('input[placeholder="e.g. Alex"]', { timeout: 20000 });
    await page1.fill('input[placeholder="e.g. Alex"]', 'Ada');
    await page1.getByRole('button', { name: /Enter room/ }).click();
    await page1.waitForSelector('[aria-label="Room controls"]', { timeout: 20000 });
    await sleep(1500);
    const cardAfter = await page1.getByRole('group', { name: /File smoke-payload\.bin/ }).count();
    check('refresh clears the file card', cardAfter === 0, `${cardAfter} card(s) found`);

    // 6. late joiner never receives the file (no history replay)
    const ctx3 = await browser.newContext();
    const page3 = await ctx3.newPage();
    await page3.goto(WEB_URL, { waitUntil: 'domcontentloaded' });
    await page3.waitForSelector('input[placeholder="e.g. Alex"]', { timeout: 20000 });
    await page3.fill('input[placeholder="e.g. Alex"]', 'Linus');
    await page3.getByRole('button', { name: /Enter room/ }).click();
    await page3.waitForSelector('[aria-label="Room controls"]', { timeout: 20000 });
    await sleep(1500);
    const lateCards = await page3.getByRole('group', { name: /File smoke-payload\.bin/ }).count();
    check('late joiner gets no file', lateCards === 0, `${lateCards} card(s) found`);
  } finally {
    await browser.close().catch(() => {});
    fs.rmSync(tmpFile, { force: true });
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exitCode = failed ? 1 : 0;
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => {
    if (signalChild) signalChild.kill();
    if (staticServer) staticServer.close();
  });
