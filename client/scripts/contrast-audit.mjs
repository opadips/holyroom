#!/usr/bin/env node
/**
 * Analytical WCAG contrast audit — primary evidence for text contrast.
 *
 * Deterministic: parses theme.css tokens + component color arrays, composites
 * translucent colors over worst-case backgrounds (incl. white video behind
 * scrims) and asserts contrast ratios.
 *
 *   node scripts/contrast-audit.mjs        (or: npm run test:contrast)
 *
 * Exit code 0 = all checks pass. Text ≥ 4.5:1, meaningful non-text ≥ 3:1.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── color math ────────────────────────────────────────────────────────────
const parseHex = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
    a: 1,
  };
};

const rgba = (r, g, b, a = 1) => ({ r, g, b, a });

/** parse `rgba(1, 2, 3, 0.5)` / `#abc` / `#aabbcc` */
const parseColor = (str) => {
  const s = str.trim();
  if (s.startsWith('#')) return parseHex(s);
  const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/);
  if (!m) throw new Error(`unparseable color: ${str}`);
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
};

/** fg (rgba) composited over opaque-ish bg (rgba) → rgba */
const over = (fg, bg) => {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return rgba(0, 0, 0, 0);
  return {
    r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
    g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
    b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
    a,
  };
};

const chan = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const lum = ({ r, g, b }) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);

const contrast = (fg, bg) => {
  // background must be opaque for the ratio; flatten fg over bg first
  const flat = over(fg, { ...bg, a: 1 });
  const l1 = lum(flat);
  const l2 = lum(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
};

const fmtColor = ({ r, g, b, a }) =>
  a === 1
    ? `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
    : `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a.toFixed(2)})`;

// ── sources ───────────────────────────────────────────────────────────────
const themeCss = readFileSync(join(root, 'src/theme.css'), 'utf8');
const chatArea = readFileSync(join(root, 'src/components/ChatArea.js'), 'utf8');
const stripJs = readFileSync(join(root, 'src/components/ParticipantStrip.js'), 'utf8');
const mcCss = readFileSync(join(root, 'src/components/MicroComponents.css'), 'utf8');

const token = (name) => {
  const m = themeCss.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`token ${name} not found in theme.css`);
  return m[1].trim();
};

const gradientStops = (decl) => (decl.match(/#[0-9a-f]{3,6}/gi) || []).map(parseHex);

const hexArray = (src, varName) => {
  const m = src.match(new RegExp(`${varName}\\s*=\\s*\\[([^\\]]+)\\]`));
  if (!m) throw new Error(`${varName} not found`);
  const colors = m[1].match(/#[0-9a-f]{3,6}/gi) || [];
  if (colors.length === 0) throw new Error(`${varName} has no colors`);
  return colors.map(parseHex);
};

const flatArrayPairs = (src, varName) => {
  const m = src.match(new RegExp(`${varName}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!m) throw new Error(`${varName} not found`);
  const pairs = [...m[1].matchAll(/\[\s*['"]?(#[0-9a-f]{3,6})['"]?\s*,\s*['"]?(#[0-9a-f]{3,6})['"]?\s*\]/gi)].map(
    (x) => [parseHex(x[1]), parseHex(x[2])]
  );
  if (pairs.length === 0) throw new Error(`${varName} has no color pairs`);
  return pairs;
};

// ── environment model ─────────────────────────────────────────────────────
const SURFACES = {
  void: parseHex('#04040a'),
  panel: parseHex('#070711'),
  surface: parseHex('#0e0e20'),
  elevated: parseHex('#12122a'),
  login: parseHex('#0e0b28'),
};

const WHITE_VIDEO = parseHex('#ffffff'); // worst-case video pixel behind scrims

// Scrim stacks (bottom → top) evaluated over worst-case white video
const stageGradient080 = over(parseColor('rgba(4,4,10,0.80)'), WHITE_VIDEO); // dock text row
const dockBg = over(parseColor('rgba(8,8,20,0.88)'), stageGradient080);
const hudChip = over(parseColor('rgba(6,6,16,0.85)'), WHITE_VIDEO); // stage HUD chip
const cfGradient088 = over(parseColor('rgba(0,0,10,0.88)'), WHITE_VIDEO); // CF HUD row
const cfChip = over(parseColor('rgba(4,4,12,0.85)'), WHITE_VIDEO); // CF label chip
const notificationBg = over(parseColor('rgba(10,10,24,0.82)'), WHITE_VIDEO);

// ── checks ────────────────────────────────────────────────────────────────
const checks = [];
const check = (name, fg, bg, min) => checks.push({ name, fg, bg, min });

// 1. Text tokens vs every solid surface (worst-case pairing)
for (const tok of ['--tx-primary', '--tx-secondary', '--tx-tertiary', '--tx-ghost']) {
  const fg = parseColor(token(tok));
  for (const [sname, bg] of Object.entries(SURFACES)) {
    check(`${tok} on ${sname}`, fg, bg, 4.5);
  }
}

// 2. Accent/status text tokens vs every surface
for (const tok of ['--tx-accent', '--tx-teal', '--tx-danger', '--tx-success', '--tx-warning']) {
  const fg = parseColor(token(tok));
  for (const [sname, bg] of Object.entries(SURFACES)) {
    check(`${tok} on ${sname}`, fg, bg, 4.5);
  }
}

// 3. White on every primary/CTA gradient stop (text) and send-btn (icon ≥3)
for (const stop of gradientStops(token('--btn-primary-bg'))) {
  check(`white on btn-primary stop`, parseHex('#ffffff'), stop, 4.5);
}
const sendBtnDecl = mcCss.match(/\.send-btn\s*\{[\s\S]*?background:\s*([^;]+);/)?.[1] || '';
for (const stop of gradientStops(sendBtnDecl)) {
  check('white on send-btn stop', parseHex('#ffffff'), stop, 4.5);
}

// 4. Avatar initials (white, normal-size) on every avatar color stop
for (const [i, pair] of flatArrayPairs(chatArea, 'AVATAR_COLORS').entries()) {
  check(`white on ChatArea avatar ${i} c1`, parseHex('#ffffff'), pair[0], 4.5);
  check(`white on ChatArea avatar ${i} c2`, parseHex('#ffffff'), pair[1], 4.5);
}
for (const [i, col] of hexArray(stripJs, 'USER_COLORS').entries()) {
  check(`white on strip avatar ${i}`, parseHex('#ffffff'), col, 4.5);
}
// self-avatar gradient (strip, stage) + login/share badge avatars + logo marks (icon ≥3)
for (const stop of ['#5b4ed2', '#6f60e8', '#7c3aed']) {
  check(`white on avatar stop ${stop}`, parseHex('#ffffff'), parseHex(stop), 4.5);
}
for (const stop of ['#6a5adf', '#7c6bf0']) {
  check(`white logo stroke on ${stop}`, parseHex('#ffffff'), parseHex(stop), 3);
}
// unread badge count
check('white on unread badge', parseHex('#ffffff'), parseHex('#be123c'), 4.5);

// glass-badge (uppercase label text) over panel
check(
  'glass-badge text',
  parseColor('rgba(190,175,255,0.92)'),
  over(parseColor('rgba(124,107,240,0.12)'), SURFACES.panel),
  4.5
);

// 5. Message status icons (non-text ≥3) over chat panel
const statusColors = [...mcCss.matchAll(/\.msg-status__icon--\w+\s*\{\s*color:\s*([^;]+);/g)].map(
  (m) => parseColor(m[1])
);
statusColors.forEach((c, i) => check(`msg-status icon ${i} on panel`, c, SURFACES.panel, 3));

// 6. Stage HUD chips over white video
check('stage HUD name text', parseColor('rgba(235,235,255,0.95)'), hudChip, 4.5);
check('stage HUD LIVE text', parseColor('rgba(255,255,255,0.82)'), hudChip, 4.5);
check('self-preview label', parseColor('rgba(235,235,255,0.95)'), hudChip, 4.5);
check('tap-to-play text', parseColor(token('--tx-primary')), hudChip, 4.5);

// 7. Dock contents over stage scrim over white video
const dockSurface = dockBg;
check(
  'stream-btn idle text',
  parseColor('rgba(80,220,205,0.9)'),
  over(parseColor('rgba(45,212,191,0.10)'), dockSurface),
  4.5
);
check(
  'stream-btn active text',
  parseColor('rgba(252,165,165,0.9)'),
  over(parseColor('rgba(239,68,68,0.12)'), dockSurface),
  4.5
);
check(
  'quality chip text',
  parseColor(token('--tx-accent')),
  over(parseColor('rgba(124,107,240,0.12)'), dockSurface),
  4.5
);
check('settings icon', parseColor(token('--tx-secondary')), dockSurface, 3);
check(
  'leave button text',
  parseColor(token('--btn-danger-color')),
  over(parseColor(token('--btn-danger-bg')), dockSurface),
  4.5
);
check(
  'mute btn active icon',
  parseColor('rgba(200,160,255,0.9)'),
  over(parseColor('rgba(124,107,240,0.12)'), dockSurface),
  3
);
check(
  'mute btn muted icon',
  parseColor('rgba(252,165,165,0.9)'),
  over(parseColor('rgba(239,68,68,0.12)'), dockSurface),
  3
);

// 8. CinematicFocus HUD over white video
check('cf LIVE label', parseColor('rgba(255,255,255,0.65)'), over(cfChip, cfGradient088), 4.5);
check('cf sharer name', parseColor('rgba(220,210,255,0.85)'), over(cfChip, cfGradient088), 4.5);
check(
  'cf mute/close text',
  parseColor('rgba(200,200,220,0.7)'),
  over(parseColor('rgba(255,255,255,0.06)'), cfGradient088),
  4.5
);
check(
  'cf mute muted text',
  parseHex('#fb7185'),
  over(parseColor('rgba(244,63,94,0.12)'), cfGradient088),
  4.5
);

// 9. Notification over white video
check('notification text', parseColor(token('--tx-primary')), notificationBg, 4.5);

// 10. Status dots on strip tiles (non-text ≥3)
for (const c of ['#34d399', '#fbbf24', '#9ca3af']) {
  check(`status dot ${c}`, parseHex(c), over(parseColor('rgba(255,255,255,0.04)'), SURFACES.panel), 3);
}

// ── run ───────────────────────────────────────────────────────────────────
let failed = 0;
const rows = [];
for (const { name, fg, bg, min } of checks) {
  const ratio = contrast(fg, bg);
  const ok = ratio >= min;
  if (!ok) failed++;
  rows.push({ name, ratio, min, ok, fg, bg });
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`${pad('check', 40)}${pad('ratio', 10)}${pad('min', 7)}result`);
console.log('-'.repeat(64));
for (const r of rows) {
  console.log(
    `${pad(r.name, 40)}${pad(r.ratio.toFixed(2) + ':1', 10)}${pad(r.min, 7)}${r.ok ? 'PASS' : 'FAIL'}`
  );
}
for (const r of rows.filter((x) => !x.ok)) {
  console.log(`  → fg ${fmtColor(r.fg)} over bg ${fmtColor(r.bg)}`);
}
console.log('-'.repeat(64));
console.log(`${rows.length} checks, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
