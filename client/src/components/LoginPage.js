import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LoginPage({ username, setUsername, joining, handleJoin }) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  const canSubmit = username.trim().length > 0;

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left panel — brand */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'linear-gradient(145deg, #0a0a1e 0%, #0e0b28 40%, #08081a 100%)',
          borderRight: '1px solid rgba(124,107,240,0.10)',
        }}
      >
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{
            position: 'absolute', top: '15%', left: '20%',
            width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(124,107,240,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '20%', right: '10%',
            width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }} />
          {/* Grid lines */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(124,107,240,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,107,240,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 p-12">
          <div className="flex items-center gap-3">
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, #6a5adf, #7c6bf0)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(106,90,223,0.4)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--tx-primary)',
            }}>Holyroom</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 px-12 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.6rem',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: 'var(--tx-primary)',
              marginBottom: '1rem',
            }}>
              Your space to<br/>
              <span style={{
                background: 'linear-gradient(135deg, #9d8ff7 0%, #7c6bf0 40%, #2dd4bf 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>collaborate live.</span>
            </p>
            <p style={{ color: 'var(--tx-tertiary)', fontSize: '0.9rem', lineHeight: 1.65, maxWidth: 320 }}>
              Share your screen, talk in real time, and stay connected with your team — all in one seamless room.
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
          >
            {[
              { icon: '⬡', text: 'Instant screen sharing in any quality' },
              { icon: '◈', text: 'Live voice with spatial audio activity' },
              { icon: '◉', text: 'Real-time group chat built in' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  color: 'var(--tx-accent)',
                  fontSize: '0.9rem',
                  opacity: 0.7,
                  width: 20,
                  textAlign: 'center',
                  flexShrink: 0,
                }}>{item.icon}</span>
                <span style={{ color: 'var(--tx-secondary)', fontSize: '0.84rem' }}>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom ornament */}
        <div className="relative z-10 p-12">
          <div style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(124,107,240,0.20), transparent)',
            marginBottom: '1rem',
          }} />
          <p style={{ color: 'var(--tx-ghost)', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
            No account needed · Works in your browser
          </p>
        </div>
      </motion.div>

      {/* Right panel — entry form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <motion.div
          className="w-full"
          style={{ maxWidth: 400 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-10 justify-center">
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #6a5adf, #7c6bf0)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(106,90,223,0.4)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>Holyroom</span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 700,
            letterSpacing: '-0.035em',
            color: 'var(--tx-primary)',
            marginBottom: '0.4rem',
          }}>
            Welcome in
          </h2>
          <p style={{ color: 'var(--tx-tertiary)', fontSize: '0.875rem', marginBottom: '2.5rem', lineHeight: 1.55 }}>
            Choose how you'd like to appear in the room.
          </p>

          {/* Input */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--tx-tertiary)',
              marginBottom: '0.6rem',
            }}>Display name</label>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canSubmit && !joining && handleJoin(e)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="e.g. Alex"
                disabled={joining}
                maxLength={32}
                style={{
                  width: '100%',
                  padding: '0.875rem 1.125rem',
                  background: focused ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.035)',
                  border: `1px solid ${focused ? 'rgba(124,107,240,0.55)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '0.875rem',
                  color: 'var(--tx-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.925rem',
                  outline: 'none',
                  boxShadow: focused
                    ? '0 0 0 3px rgba(124,107,240,0.15), inset 0 2px 8px rgba(0,0,0,0.15)'
                    : 'inset 0 2px 8px rgba(0,0,0,0.18)',
                  transition: 'all 0.22s ease',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* CTA */}
          <motion.button
            onClick={(e) => canSubmit && !joining && handleJoin(e)}
            disabled={!canSubmit || joining}
            whileHover={canSubmit && !joining ? { scale: 1.015, y: -1 } : {}}
            whileTap={canSubmit && !joining ? { scale: 0.98 } : {}}
            style={{
              width: '100%',
              padding: '0.9rem 1.25rem',
              background: canSubmit
                ? 'linear-gradient(135deg, #6a5adf 0%, #7c6bf0 50%, #8b7af2 100%)'
                : 'rgba(124,107,240,0.20)',
              border: '1px solid rgba(157,143,247,0.20)',
              borderRadius: '0.875rem',
              color: 'white',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              cursor: canSubmit && !joining ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 4px 20px rgba(106,90,223,0.38)' : 'none',
              transition: 'all 0.25s ease',
              position: 'relative',
              overflow: 'hidden',
              marginTop: '0.25rem',
            }}
          >
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {joining ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Joining…
                </>
              ) : (
                <>
                  Enter room
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </span>
          </motion.button>

          <p style={{
            textAlign: 'center',
            fontSize: '0.72rem',
            color: 'var(--tx-ghost)',
            marginTop: '1.5rem',
            lineHeight: 1.6,
          }}>
            Microphone access may be requested for voice activity.
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
