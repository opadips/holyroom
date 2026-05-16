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

// ─── Hook: Breathing intensity ────────────────────────────────
// opacity پنل‌های نور به آرامی نفس می‌کشند
function useBreathing(refs, baseOpacity, amplitude, speed) {
  useEffect(() => {
    let id;
    let t = Math.random() * Math.PI * 2; // random phase start

    const tick = () => {
      t += speed;
      const o = baseOpacity + Math.sin(t) * amplitude;
      refs.forEach((ref) => {
        if (ref.current) ref.current.style.opacity = o;
      });
      id = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(id);
  }, [refs, baseOpacity, amplitude, speed]);
}

// ─── Main Component ────────────────────────────────────────────
export default function AmbientLight() {
  const fastGlowRef  = useRef(null);
  const slowGlowRef  = useRef(null);
  const haloTopRef   = useRef(null);
  const haloLeftRef  = useRef(null);

  useProximityGlow(fastGlowRef, slowGlowRef);

  // هاله بالا و چپ نفس می‌کشند با فاز مختلف
  useBreathing([haloTopRef],  0.55, 0.20, 0.004);
  useBreathing([haloLeftRef], 0.45, 0.18, 0.003);

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
      <div ref={haloTopRef} className="al-halo al-halo--top" />
      {/* هاله چپ — روشن‌کردن Sidebar */}
      <div ref={haloLeftRef} className="al-halo al-halo--left" />
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
