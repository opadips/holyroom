/**
 * ═══════════════════════════════════════════════════════════════
 * useMicroInteractions.js — Micro Interaction Hook System
 * Holyroom
 *
 * هر hook یک رفتار مشخص رو مدیریت می‌کنه.
 * همه pure JS هستند — بدون dependency به Framer Motion.
 * برای انیمیشن‌های Framer Motion از MicroComponents.jsx استفاده کن.
 *
 * مسیر: client/src/hooks/useMicroInteractions.js
 * ═══════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// ─────────────────────────────────────────────────────────────
// useMagneticHover
// المان به سمت موس کشیده می‌شه — مثل آهنربا
// برای دکمه‌های بزرگ و icon buttonها مناسبه
//
// const { ref } = useMagneticHover({ strength: 0.3 });
// <button ref={ref}>Join</button>
// ─────────────────────────────────────────────────────────────
export function useMagneticHover({ strength = 0.25, radius = 80 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let animId;
    let tx = 0, ty = 0;
    let cx = 0, cy = 0;
    let inside = false;

    const lerp = (a, b, t) => a + (b - a) * t;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx_ = rect.left + rect.width  / 2;
      const cy_ = rect.top  + rect.height / 2;
      const dx = e.clientX - cx_;
      const dy = e.clientY - cy_;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        inside = true;
        tx = dx * strength;
        ty = dy * strength;
      } else if (inside) {
        inside = false;
        tx = 0;
        ty = 0;
      }
    };

    const tick = () => {
      cx = lerp(cx, tx, 0.12);
      cy = lerp(cy, ty, 0.12);
      el.style.transform = `translate(${cx}px, ${cy}px)`;
      animId = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      inside = false;
      tx = 0;
      ty = 0;
    };

    window.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    tick();

    return () => {
      window.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(animId);
      el.style.transform = '';
    };
  }, [strength, radius]);

  return { ref };
}

// ─────────────────────────────────────────────────────────────
// useRipple
// Ripple effect روی click — خیلی ظریف و premium
//
// const { ref, ripples, triggerRipple } = useRipple();
// <button ref={ref} onClick={triggerRipple}>Send</button>
// {ripples}  ← این رو داخل button رندر کن
// ─────────────────────────────────────────────────────────────
export function useRipple({ color = 'rgba(168, 85, 247, 0.18)', duration = 600 } = {}) {
  const ref = useRef(null);
  const [ripples, setRipples] = useState([]);

  const triggerRipple = useCallback((e) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = (e?.clientX ?? rect.left + rect.width  / 2) - rect.left;
    const y = (e?.clientY ?? rect.top  + rect.height / 2) - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;
    const id = Date.now();

    setRipples(prev => [...prev, { id, x, y, size }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, duration);
  }, [duration]);

  const RippleElements = ripples.map(({ id, x, y, size }) => (
    <span
      key={id}
      style={{
        position: 'absolute',
        left: x - size / 2,
        top:  y - size / 2,
        width:  size,
        height: size,
        borderRadius: '50%',
        background: color,
        transform: 'scale(0)',
        animation: `holyRipple ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  ));

  return { ref, ripples: RippleElements, triggerRipple };
}

// ─────────────────────────────────────────────────────────────
// useVoiceActivity
// نوار صوتی با ارتفاع متغیر — برای نشون‌دادن فعالیت میکروفون
// از AudioContext و MediaStream استفاده می‌کنه
//
// const { barHeights, isActive } = useVoiceActivity(stream);
// ─────────────────────────────────────────────────────────────
export function useVoiceActivity(stream, { barCount = 4, threshold = 0.01 } = {}) {
  const [barHeights, setBarHeights] = useState(Array(barCount).fill(0.08));
  const [isActive, setIsActive]     = useState(false);
  const analyserRef = useRef(null);
  const animIdRef   = useRef(null);

  useEffect(() => {
    if (!stream) return;

    let ctx, source, analyser;
    try {
      ctx      = new AudioContext();
      source   = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
    } catch {
      return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
      setIsActive(avg > threshold);

      const heights = Array(barCount).fill(0).map((_, i) => {
        const idx = Math.floor((i / barCount) * data.length);
        const raw = data[idx] / 255;
        return Math.max(0.08, raw * 0.9);
      });

      setBarHeights(heights);
      animIdRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animIdRef.current);
      source?.disconnect();
      ctx?.close();
    };
  }, [stream, barCount, threshold]);

  return { barHeights, isActive };
}

// ─────────────────────────────────────────────────────────────
// useTypingDots
// سه نقطه با فاز‌های متفاوت — نشان‌دهنده typing
// Pure CSS-driven از طریق CSS animation — این hook
// فقط visibility رو مدیریت می‌کنه
//
// const { isVisible } = useTypingDots(isTyping, 3000);
// ─────────────────────────────────────────────────────────────
export function useTypingDots(isTyping, hideAfter = 3000) {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isTyping) {
      setIsVisible(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsVisible(false), hideAfter);
    } else {
      setIsVisible(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [isTyping, hideAfter]);

  return { isVisible };
}

// ─────────────────────────────────────────────────────────────
// useButtonPress
// مدیریت حالت pressed با feedback
// برای دکمه‌هایی که action دارند (Send، Share، Mute)
//
// const { isPressed, handlers } = useButtonPress(onClick);
// <button {...handlers}>Send</button>
// ─────────────────────────────────────────────────────────────
export function useButtonPress(onPress, { delay = 120 } = {}) {
  const [isPressed, setIsPressed] = useState(false);

  const handlers = {
    onMouseDown: () => setIsPressed(true),
    onMouseUp:   () => {
      setIsPressed(false);
      setTimeout(onPress, delay);
    },
    onMouseLeave: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
    onTouchEnd:   () => {
      setIsPressed(false);
      setTimeout(onPress, delay);
    },
  };

  return { isPressed, handlers };
}

// ─────────────────────────────────────────────────────────────
// useMessageDelivery
// حالت‌های ارسال پیام: idle → sending → sent → delivered
//
// const { status, send } = useMessageDelivery(socketRef);
// ─────────────────────────────────────────────────────────────
export function useMessageDelivery() {
  const [status, setStatus] = useState('idle'); // idle | sending | sent | delivered

  const send = useCallback(async (fn) => {
    setStatus('sending');
    try {
      await fn();
      setStatus('sent');
      setTimeout(() => setStatus('delivered'), 800);
      setTimeout(() => setStatus('idle'), 2400);
    } catch {
      setStatus('idle');
    }
  }, []);

  return { status, send };
}

// ─────────────────────────────────────────────────────────────
// useStreamActivation
// انیمیشن شروع/توقف screen share
// حالت‌ها: idle → activating → active → deactivating → idle
//
// const { streamState, activate, deactivate } = useStreamActivation();
// ─────────────────────────────────────────────────────────────
export function useStreamActivation() {
  const [streamState, setStreamState] = useState('idle');

  const activate = useCallback(async (fn) => {
    setStreamState('activating');
    try {
      await fn();
      setStreamState('active');
    } catch {
      setStreamState('idle');
    }
  }, []);

  const deactivate = useCallback(async (fn) => {
    setStreamState('deactivating');
    await fn?.();
    setTimeout(() => setStreamState('idle'), 500);
  }, []);

  return { streamState, activate, deactivate };
}

// ─────────────────────────────────────────────────────────────
// useLoadingPulse
// شبیه‌سازی skeleton loading برای المان‌های در حال بارگذاری
//
// const { isLoading, startLoading, stopLoading } = useLoadingPulse();
// ─────────────────────────────────────────────────────────────
export function useLoadingPulse(initial = false) {
  const [isLoading, setIsLoading] = useState(initial);

  const startLoading = useCallback(() => setIsLoading(true),  []);
  const stopLoading  = useCallback(() => setIsLoading(false), []);

  return { isLoading, startLoading, stopLoading };
}

// ─────────────────────────────────────────────────────────────
// useCursorGlow
// یه div رو دنبال cursor می‌کنه با lerp — برای المان‌های
// بزرگ که نیاز به highlight داخلی دارند
//
// const { ref } = useCursorGlow();
// <div ref={ref} className="relative overflow-hidden">
//   محتوا
// </div>
// ─────────────────────────────────────────────────────────────
export function useCursorGlow({ color = 'rgba(168, 85, 247, 0.06)', size = 300 } = {}) {
  const containerRef = useRef(null);
  const glowRef      = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Inject glow element
    const glow = document.createElement('div');
    glow.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: radial-gradient(circle, ${color} 0%, transparent 70%);
      pointer-events: none;
      transform: translate(-50%, -50%);
      transition: opacity 0.3s ease;
      opacity: 0;
      z-index: 0;
      will-change: left, top;
    `;
    container.appendChild(glow);
    glowRef.current = glow;

    let tx = 0, ty = 0, cx = 0, cy = 0;
    let id, inside = false;

    const lerp = (a, b, t) => a + (b - a) * t;

    const onMove = (e) => {
      const rect = container.getBoundingClientRect();
      tx = e.clientX - rect.left;
      ty = e.clientY - rect.top;
    };

    const onEnter = () => { inside = true;  glow.style.opacity = '1'; };
    const onLeave = () => { inside = false; glow.style.opacity = '0'; };

    const tick = () => {
      if (inside) {
        cx = lerp(cx, tx, 0.08);
        cy = lerp(cy, ty, 0.08);
        glow.style.left = `${cx}px`;
        glow.style.top  = `${cy}px`;
      }
      id = requestAnimationFrame(tick);
    };

    container.addEventListener('mousemove',  onMove);
    container.addEventListener('mouseenter', onEnter);
    container.addEventListener('mouseleave', onLeave);
    tick();

    return () => {
      container.removeEventListener('mousemove',  onMove);
      container.removeEventListener('mouseenter', onEnter);
      container.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(id);
      glow.remove();
    };
  }, [color, size]);

  return { ref: containerRef };
}
