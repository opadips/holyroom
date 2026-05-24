import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import './CinematicFocus.css';

const springConfig = { stiffness: 80, damping: 22, mass: 1.1 };

export default function CinematicFocus({ stream, onClose, sharerName = '' }) {
  const containerRef    = useRef(null);
  const [phase, setPhase]             = useState('entering');
  const [tiltEnabled, setTiltEnabled] = useState(false);

  const mouseX  = useMotionValue(0);
  const mouseY  = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const rotateY     = useTransform(smoothX, [-1, 1], [-3.5,  3.5]);
  const rotateX     = useTransform(smoothY, [-1, 1], [ 2.5, -2.5]);
  const glowX       = useTransform(smoothX, [-1, 1], ['20%', '80%']);
  const glowY       = useTransform(smoothY, [-1, 1], ['20%', '80%']);
  const borderGlowBg = useTransform(
    [glowX, glowY],
    ([x, y]) =>
      `radial-gradient(600px circle at ${x} ${y}, rgba(139,92,246,0.18), transparent 55%)`
  );

  // Video ref — callback style تا به محض mount، srcObject ست بشه
  const videoCallbackRef = useCallback((el) => {
    if (el && stream) {
      el.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    // AmbientLight رو غیرفعال می‌کنه تا با صفحه تداخل نداشته باشه
    document.body.classList.add('cinematic-focus-open');
    return () => {
      document.body.classList.remove('cinematic-focus-open');
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('idle');
      setTiltEnabled(true);
    }, 900);
    return () => clearTimeout(t);
  }, []);

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
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Main video stage — بدون tilt چون rotateX/Y با backdrop تداخل ایجاد می‌کنه */}
      <motion.div
        ref={containerRef}
        className="cf-stage"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.72, filter: 'blur(24px)' }}
        animate={isExiting ? {
          opacity: 0, scale: 0.78, filter: 'blur(18px)',
          transition: { duration: 0.65, ease: [0.7, 0, 0.84, 0] },
        } : {
          opacity: 1, scale: 1, filter: 'blur(0px)',
          transition: { ...springConfig, type: 'spring', delay: 0.05 },
        }}
      >
        <motion.div className="cf-border-glow" style={{ background: borderGlowBg }} />

        <div className="cf-edge-top"    />
        <div className="cf-edge-bottom" />
        <div className="cf-edge-left"   />
        <div className="cf-edge-right"  />
        <div className="cf-scanline"    />

        <video
          ref={videoCallbackRef}
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
            <button className="cf-hud__close" onClick={handleClose} aria-label="Exit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              <span>ESC</span>
            </button>
          </div>
        </motion.div>

        <div className="cf-lens-flare" />
      </motion.div>

    </div>
  );
}