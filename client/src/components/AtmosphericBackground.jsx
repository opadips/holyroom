import { useEffect, useRef, useCallback } from "react";
import "./AtmosphericBackground.css";

// ─── Particle System ───────────────────────────────────────────────────────────
function useParticles(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let particles = [];
    let animId;
    let W, H;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const rand = (min, max) => Math.random() * (max - min) + min;

    // Spawn sparse, slow-drifting particles
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: rand(0, window.innerWidth),
        y: rand(0, window.innerHeight),
        r: rand(0.4, 2.2),
        vx: rand(-0.08, 0.08),
        vy: rand(-0.12, -0.03),
        opacity: rand(0.03, 0.13),
        pulse: rand(0, Math.PI * 2),
        pulseSpeed: rand(0.003, 0.009),
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        p.pulse += p.pulseSpeed;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -5) p.x = W + 5;
        if (p.x > W + 5) p.x = -5;
        if (p.y < -5) p.y = H + 5;

        const alpha = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 140, 255, ${alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef]);
}

// ─── Noise Grain ───────────────────────────────────────────────────────────────
function useGrain(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const draw = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;

      const imageData = ctx.createImageData(W, H);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v + 20; // slight blue tint
        data[i + 3] = Math.random() * 10; // very transparent
      }

      ctx.putImageData(imageData, 0, 0);
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [canvasRef]);
}

// ─── Mouse Reactive Glow ───────────────────────────────────────────────────────
function useMouseGlow(glowRef) {
  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let animId;

    const onMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      currentX = lerp(currentX, targetX, 0.04);
      currentY = lerp(currentY, targetY, 0.04);
      el.style.transform = `translate(${currentX - 300}px, ${currentY - 300}px)`;
      animId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    tick();

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(animId);
    };
  }, [glowRef]);
}

// ─── Parallax Layers ───────────────────────────────────────────────────────────
function useParallax(layer1Ref, layer2Ref) {
  useEffect(() => {
    let targetX = 0;
    let targetY = 0;
    let cx = 0;
    let cy = 0;
    let animId;

    const onMove = (e) => {
      const dx = (e.clientX / window.innerWidth - 0.5) * 2;
      const dy = (e.clientY / window.innerHeight - 0.5) * 2;
      targetX = dx;
      targetY = dy;
    };

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      cx = lerp(cx, targetX, 0.025);
      cy = lerp(cy, targetY, 0.025);

      if (layer1Ref.current)
        layer1Ref.current.style.transform = `translate(${cx * 12}px, ${cy * 12}px)`;
      if (layer2Ref.current)
        layer2Ref.current.style.transform = `translate(${cx * 22}px, ${cy * 22}px)`;

      animId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    tick();
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(animId);
    };
  }, [layer1Ref, layer2Ref]);
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AtmosphericBackground() {
  const particleCanvas = useRef(null);
  const grainCanvas = useRef(null);
  const mouseGlowRef = useRef(null);
  const layer1Ref = useRef(null);
  const layer2Ref = useRef(null);

  useParticles(particleCanvas);
  useGrain(grainCanvas);
  useMouseGlow(mouseGlowRef);
  useParallax(layer1Ref, layer2Ref);

  return (
    <div className="atm-root" aria-hidden="true">
      {/* ── Base: deep void ── */}
      <div className="atm-void" />

      {/* ── Gradient mesh layer 1 (slow drift) ── */}
      <div ref={layer1Ref} className="atm-mesh-1" />

      {/* ── Gradient mesh layer 2 (slightly faster parallax) ── */}
      <div ref={layer2Ref} className="atm-mesh-2" />

      {/* ── Animated ambient orbs ── */}
      <div className="atm-orb atm-orb--a" />
      <div className="atm-orb atm-orb--b" />
      <div className="atm-orb atm-orb--c" />

      {/* ── Fog layers ── */}
      <div className="atm-fog atm-fog--1" />
      <div className="atm-fog atm-fog--2" />

      {/* ── Mouse reactive glow ── */}
      <div ref={mouseGlowRef} className="atm-mouse-glow" />

      {/* ── Particle canvas ── */}
      <canvas ref={particleCanvas} className="atm-canvas atm-particles" />

      {/* ── Grain canvas ── */}
      <canvas ref={grainCanvas} className="atm-canvas atm-grain" />

      {/* ── Vignette ── */}
      <div className="atm-vignette" />

      {/* ── Volumetric top beam ── */}
      <div className="atm-beam" />
    </div>
  );
}
