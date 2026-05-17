import { useEffect, useRef, useState } from 'react';

export function useAudioReactiveRing(stream, { enabled = true } = {}) {
  const canvasRef   = useRef(null);
  const animIdRef   = useRef(null);
  const analyserRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!stream || !enabled) return;

    let ctx, source, analyser;
    try {
      ctx      = new (window.AudioContext || window.webkitAudioContext)();
      source   = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      analyserRef.current = analyser;
    } catch {
      return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.slice(0, 12).reduce((a, b) => a + b, 0) / 12 / 255;
      setIsActive(avg > 0.04);
      drawRing(avg);
      animIdRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animIdRef.current);
      source?.disconnect();
      ctx?.close();
    };
  }, [stream, enabled]);

  const drawRing = (level) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const W    = canvas.width;
    const H    = canvas.height;
    const cx   = W / 2;
    const cy   = H / 2;
    const baseR = W * 0.42;

    ctx.clearRect(0, 0, W, H);
    if (level < 0.02) return;

    const analyser = analyserRef.current;
    if (!analyser) return;

    const freq = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freq);

    const segments = 64;
    const intensity = Math.min(level * 2.5, 1);

    ctx.save();
    ctx.translate(cx, cy);

    for (let i = 0; i < segments; i++) {
      const angle   = (i / segments) * Math.PI * 2 - Math.PI / 2;
      const freqIdx = Math.floor((i / segments) * freq.length * 0.6);
      const amp     = (freq[freqIdx] / 255) * intensity;
      const outerR  = baseR + amp * baseR * 0.35;
      const innerR  = baseR - 1;

      const x1 = Math.cos(angle) * innerR;
      const y1 = Math.sin(angle) * innerR;
      const x2 = Math.cos(angle) * outerR;
      const y2 = Math.sin(angle) * outerR;

      const alpha = 0.15 + amp * 0.7;
      const hue   = 270 + amp * 30;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `hsla(${hue}, 85%, 70%, ${alpha})`;
      ctx.lineWidth   = 1.5 + amp * 2;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }

    // glow ring
    const grd = ctx.createRadialGradient(0, 0, baseR - 4, 0, 0, baseR + 10);
    grd.addColorStop(0, `rgba(168, 85, 247, ${intensity * 0.35})`);
    grd.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, baseR + 8, 0, Math.PI * 2);
    ctx.strokeStyle = grd;
    ctx.lineWidth   = 8;
    ctx.stroke();

    ctx.restore();
  };

  return { canvasRef, isActive };
}

export function AudioReactiveRing({
  stream,
  size = 44,
  enabled = true,
  children,
  className = '',
}) {
  const { canvasRef, isActive } = useAudioReactiveRing(stream, { enabled });

  return (
    <div
      className={`audio-ring-wrapper ${className}`}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          borderRadius: '50%',
          zIndex: 1,
        }}
        aria-hidden="true"
      />
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  );
}