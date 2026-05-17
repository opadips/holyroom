import { useEffect, useRef, useCallback } from 'react';

export function useMessageParticle() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animIdRef = useRef(null);
  const activeRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const spawnParticles = useCallback((originEl) => {
    const canvas = canvasRef.current;
    if (!canvas || !originEl) return;

    const rect = originEl.getBoundingClientRect();
    const ox = rect.left + rect.width  / 2;
    const oy = rect.top  + rect.height / 2;

    const COLORS = [
      'rgba(168, 85, 247,',
      'rgba(139, 92, 246,',
      'rgba(99, 102, 241,',
      'rgba(196, 160, 255,',
      'rgba(220, 200, 255,',
    ];

    const count = 22;
    for (let i = 0; i < count; i++) {
      const angle  = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed  = 1.2 + Math.random() * 2.8;
      const size   = 1.2 + Math.random() * 2.2;
      const color  = COLORS[Math.floor(Math.random() * COLORS.length)];
      const life   = 0.7 + Math.random() * 0.5;

      particlesRef.current.push({
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size, color,
        life,
        maxLife: life,
        gravity: 0.06 + Math.random() * 0.04,
      });
    }

    // shimmer trail — slow upward floaters
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x: ox + (Math.random() - 0.5) * 60,
        y: oy + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.3 + Math.random() * 0.6),
        size: 1 + Math.random() * 1.5,
        color: 'rgba(220, 200, 255,',
        life: 1.2 + Math.random() * 0.8,
        maxLife: 2,
        gravity: 0,
      });
    }

    if (!activeRef.current) {
      activeRef.current = true;
      animate();
    }
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

    particlesRef.current.forEach((p) => {
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += p.gravity;
      p.vx   *= 0.97;
      p.life -= 0.022;

      const alpha = Math.max(0, (p.life / p.maxLife) * 0.85);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${alpha})`;
      ctx.fill();
    });

    if (particlesRef.current.length > 0) {
      animIdRef.current = requestAnimationFrame(animate);
    } else {
      activeRef.current = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(animIdRef.current);
  }, []);

  return { canvasRef, spawnParticles };
}

export function ParticleCanvas({ canvasRef }) {
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 45,
        mixBlendMode: 'screen',
      }}
      aria-hidden="true"
    />
  );
}