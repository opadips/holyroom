import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import './CinematicFocus.css';

const springConfig = { stiffness: 80, damping: 22, mass: 1.1 };

export default function CinematicFocus({ stream, onClose, sharerName = '' }) {
  const containerRef  = useRef(null);
  const videoRef      = useRef(null);
  const [phase, setPhase]           = useState('entering');
  const [tiltEnabled, setTiltEnabled] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const rotateY = useTransform(smoothX, [-1, 1], [-3.5,  3.5]);
  const rotateX = useTransform(smoothY, [-1, 1], [ 2.5, -2.5]);
  const glowX   = useTransform(smoothX, [-1, 1], ['20%', '80%']);
  const glowY   = useTransform(smoothY, [-1, 1], ['20%', '80%']);

  // Derived motion value for border glow background — computed OUTSIDE JSX
  const borderGlowBg = useTransform(
    [glowX, glowY],
    ([x, y]) =>
      `radial-gradient(600px circle at ${x} ${y}, rgba(139,92,246,0.18), transparent 55%)`
  );

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('idle');
      setTiltEnabled(true);
    }, 900);
    return () => clearTimeout(t);
  }, []);

  // ESC key to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!tiltEnabled || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left)  / rect.width  - 0.5) * 2);
    mouseY.set(((e.clientY - rect.top)   / rect.height - 0.5) * 2);
  }, [tiltEnabled, mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const handleClose = useCallback(() => {
    setPhase('exiting');
    setTiltEnabled(false);
    mouseX.set(0);
    mouseY.set(0);
    setTimeout(onClose, 700);
  }, [onClose, mouseX, mouseY]);

  const isExiting = phase === 'exiting';

  return (
    <div className="cf-root" onClick={handleClose}>

      <motion.div
        className="cf-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.div
        className="cf-depth-fog"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: isExiting ? 0 : 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      <div className="cf-vignette" />

      <motion.div
        ref={containerRef}
        className="cf-stage"
        style={tiltEnabled ? { rotateX, rotateY, transformPerspective: 1200 } : {}}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.72, rotateX: 18, rotateY: -8, filter: 'blur(24px)' }}
        animate={isExiting ? {
          opacity: 0, scale: 0.78, rotateX: 14, rotateY: 6, filter: 'blur(18px)',
          transition: { duration: 0.65, ease: [0.7, 0, 0.84, 0] },
        } : {
          opacity: 1, scale: 1, rotateX: 0, rotateY: 0, filter: 'blur(0px)',
          transition: { ...springConfig, type: 'spring', delay: 0.05 },
        }}
      >
        {/* Border glow — uses pre-computed motion value */}
        <motion.div className="cf-border-glow" style={{ background: borderGlowBg }} />

        <div className="cf-edge-top"    />
        <div className="cf-edge-bottom" />
        <div className="cf-edge-left"   />
        <div className="cf-edge-right"  />
        <div className="cf-scanline"    />

        <video
          ref={videoRef}
          className="cf-video"
          autoPlay
          playsInline
          muted={false}
        />

        <div className="cf-bracket cf-bracket--tl" />
        <div className="cf-bracket cf-bracket--tr" />
        <div className="cf-bracket cf-bracket--bl" />
        <div className="cf-bracket cf-bracket--br" />

        <motion.div
          className="cf-hud"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: phase === 'idle' ? 1 : 0, y: phase === 'idle' ? 0 : 8 }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="cf-hud__left">
            <span className="cf-hud__dot" />
            <span className="cf-hud__label">LIVE</span>
            {sharerName && <span className="cf-hud__name">{sharerName}</span>}
          </div>
          <div className="cf-hud__right">
            <button className="cf-hud__close" onClick={handleClose} aria-label="Exit fullscreen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              <span>ESC</span>
            </button>
          </div>
        </motion.div>

        <div className="cf-lens-flare" />
      </motion.div>

      <UIRecession phase={phase} />
    </div>
  );
}

function UIRecession({ phase }) {
  const tiles = [
    { id: 'tl', style: { top: '4%',    left: '2%',   width: '18%', height: '28%' } },
    { id: 'tr', style: { top: '4%',    right: '2%',  width: '18%', height: '28%' } },
    { id: 'bl', style: { bottom: '4%', left: '2%',   width: '18%', height: '22%' } },
    { id: 'br', style: { bottom: '4%', right: '2%',  width: '18%', height: '22%' } },
    { id: 'ml', style: { top: '38%',   left: '1%',   width: '14%', height: '24%' } },
    { id: 'mr', style: { top: '38%',   right: '1%',  width: '14%', height: '24%' } },
  ];

  return (
    <>
      {tiles.map((tile, i) => (
        <motion.div
          key={tile.id}
          className="cf-recession-tile"
          style={tile.style}
          initial={{ opacity: 0, scale: 1, filter: 'blur(0px)' }}
          animate={phase === 'exiting' ? {
            opacity: 0, scale: 1, filter: 'blur(0px)',
            transition: { duration: 0.4, delay: i * 0.03 },
          } : {
            opacity: 1, scale: 0.88, filter: 'blur(3px)',
            transition: { type: 'spring', stiffness: 70, damping: 18, delay: 0.05 + i * 0.04 },
          }}
        />
      ))}
    </>
  );
}