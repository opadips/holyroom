/**
 * ═══════════════════════════════════════════════════════════════
 * AmbientLight.jsx — UI-Level Ambient Lighting System
 * Holyroom
 *
 * این کامپوننت با AtmosphericBackground فرق داره:
 * - AtmosphericBackground  → پس‌زمینه کل صفحه (fixed, z-0)
 * - AmbientLight           → نور محیطی روی خود UI elements
 *                            (پنل‌ها، sidebar، header، chat area)
 *
 * لایه‌بندی داخلی (پشت به جلو):
 * 1. AmbientLight root     → fixed, z-1, pointer-events none
 * 2. Corner fills          → گوشه‌های صفحه با نور کم‌رنگ
 * 3. Panel halos           → هاله نور دور هر ناحیه UI
 * 4. Scan line             → خط افقی بسیار ظریف
 * 5. Mouse proximity glow  → نور ردیابی موس با شعاع بزرگ‌تر
 *
 * مسیر: client/src/components/AmbientLight.jsx
 * ═══════════════════════════════════════════════════════════════
 */

import { useEffect, useRef } from 'react';
import './AmbientLight.css';

// ─── Hook: Mouse proximity glow ───────────────────────────────
// دو لایه گلو با سرعت‌های lerp متفاوت → عمق حرکت
function useProximityGlow(fastRef, slowRef) {
  useEffect(() => {
    // Touch devices never move a pointer — park both glows centered once
    // instead of running a perpetual loop that re-rasters blur layers.
    if (window.matchMedia?.('(pointer: coarse)').matches) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      if (fastRef.current)
        fastRef.current.style.transform = `translate(${cx - 350}px, ${cy - 350}px)`;
      if (slowRef.current)
        slowRef.current.style.transform = `translate(${cx - 500}px, ${cy - 500}px)`;
      return;
    }

    let tx = window.innerWidth  / 2;
    let ty = window.innerHeight / 2;
    let fx = tx, fy = ty; // fast layer
    let sx = tx, sy = ty; // slow layer
    let id;

    const lerp = (a, b, t) => a + (b - a) * t;

    const onMove = (e) => { tx = e.clientX; ty = e.clientY; };

    const tick = () => {
      fx = lerp(fx, tx, 0.06);
      fy = lerp(fy, ty, 0.06);
      sx = lerp(sx, tx, 0.022);
      sy = lerp(sy, ty, 0.022);

      if (fastRef.current) {
        fastRef.current.style.transform =
          `translate(${fx - 350}px, ${fy - 350}px)`;
      }
      if (slowRef.current) {
        slowRef.current.style.transform =
          `translate(${sx - 500}px, ${sy - 500}px)`;
      }
      id = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    tick();
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(id);
    };
  }, [fastRef, slowRef]);
}

// ─── Main Component ────────────────────────────────────────────
export default function AmbientLight() {
  const fastGlowRef  = useRef(null);
  const slowGlowRef  = useRef(null);

  useProximityGlow(fastGlowRef, slowGlowRef);

  return (
    <div className="al-root" aria-hidden="true">

      {/* ── Corner accent fills ─────────────────────────────── */}
      {/* گوشه بالا-چپ: بنفش */}
      <div className="al-corner al-corner--tl" />
      {/* گوشه بالا-راست: آبی */}
      <div className="al-corner al-corner--tr" />
      {/* گوشه پایین-راست: بنفش کم‌رنگ */}
      <div className="al-corner al-corner--br" />
      {/* گوشه پایین-چپ: سیان بسیار کم */}
      <div className="al-corner al-corner--bl" />

      {/* ── Panel halos ─────────────────────────────────────── */}
      {/* هاله بالا — روشن‌کردن Header */}
      <div className="al-halo al-halo--top" />
      {/* هاله چپ — روشن‌کردن Sidebar */}
      <div className="al-halo al-halo--left" />
      {/* هاله پایین — InputBar glow */}
      <div className="al-halo al-halo--bottom" />
      {/* هاله راست — ناحیه چت */}
      <div className="al-halo al-halo--right" />

      {/* ── Center volumetric bloom ──────────────────────────── */}
      {/* نور حجمی مرکزی — بسیار کم‌رنگ */}
      <div className="al-bloom" />

      {/* ── Scan line ────────────────────────────────────────── */}
      {/* خط افقی بسیار ظریف که آرام جابجا می‌شه */}
      <div className="al-scanline" />

      {/* ── Mouse proximity glow — fast layer ───────────────── */}
      {/* شعاع کوچک‌تر، واکنش سریع‌تر */}
      <div ref={fastGlowRef} className="al-proximity al-proximity--fast" />

      {/* ── Mouse proximity glow — slow layer ───────────────── */}
      {/* شعاع بزرگ‌تر، واکنش کُندتر = عمق */}
      <div ref={slowGlowRef} className="al-proximity al-proximity--slow" />

      {/* ── Horizontal light band ────────────────────────────── */}
      {/* نوار افقی بسیار کم‌رنگ در میانه صفحه */}
      <div className="al-band" />

    </div>
  );
}
