import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import './CinematicFocus.css';

const springConfig = { stiffness: 80, damping: 22, mass: 1.1 };

export default function CinematicFocus({ stream, onClose, sharerName = '', isMuted = false, onToggleMute }) {
  const containerRef    = useRef(null);
  const [phase, setPhase]             = useState('entering');
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [hudVisible, setHudVisible]   = useState(true);
  const hudTimerRef = useRef(null);

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
      `radial-gradient(600px circle at ${x} ${y}, rgba(124,107,240,0.18), transparent 55%)`
  );

  const videoCallbackRef = useCallback((el) => {
    if (el && stream) {
      el.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
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
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'm' || e.key === 'M') onToggleMute?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto-hide HUD after inactivity; show on mouse move
  const resetHudTimer = useCallback(() => {
    setHudVisible(true);
    clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      setHudVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    resetHudTimer();
    return () => clearTimeout(hudTimerRef.current);
  }, [resetHudTimer]);

  const handleMouseMove = useCallback((e) => {
    resetHudTimer();
    if (!tiltEnabled || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left)  / rect.width  - 0.5) * 2);
    mouseY.set(((e.clientY - rect.top)   / rect.height - 0.5) * 2);
  }, [tiltEnabled, mouseX, mouseY, resetHudTimer]);

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
    <div className="cf-root" onClick={handleClose} onMouseMove={handleMouseMove}>

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

      <motion.div
        ref={containerRef}
        className="cf-stage"
        onClick={(e) => e.stopPropagation()}
        onMouseLeave={handleMouseLeave}
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

        {/* HUD — auto-hides on inactivity */}
        <motion.div
          className="cf-hud"
          animate={{
            opacity: (phase === 'idle' && hudVisible) ? 1 : 0,
            y: (phase === 'idle' && hudVisible) ? 0 : 8,
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Left — LIVE + sharer name */}
          <div className="cf-hud__left">
            <span className="cf-hud__dot" />
            <span className="cf-hud__label">LIVE</span>
            {sharerName && <span className="cf-hud__name">{sharerName}</span>}
          </div>

          {/* Right — mute + close */}
          <div className="cf-hud__right">
            {/* Mute button */}
            {onToggleMute && (
              <button
                className={`cf-hud__mute ${isMuted ? 'cf-hud__mute--muted' : ''}`}
                onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted ? (
                  /* Mic off */
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                ) : (
                  /* Mic on */
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
            )}

            {/* Close */}
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

    </div>
  );
}
