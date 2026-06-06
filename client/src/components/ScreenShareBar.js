import React, { useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ShareBarMotion } from './MotionWrapper';

const USER_COLORS = ['#7c6bf0', '#6366f1', '#2563eb', '#0891b2', '#a855f7'];
function getUserColor(name) {
  let h = 0;
  for (let i = 0; i < (name?.length ?? 0); i++) h += name.charCodeAt(i);
  return USER_COLORS[h % USER_COLORS.length];
}

export default function ScreenShareBar({
  activeSharers, remoteStreams, localStream, isSharing,
  currentUser, videoRefs, ownVideoRef, socketId, onFullscreen, onOwnFullscreen,
}) {
  const hasAny = activeSharers.length > 0 || isSharing;

  return (
    <ShareBarMotion isVisible={hasAny}>
      <div style={{
        display: 'flex', gap: '0.75rem', padding: '0.75rem 1rem',
        overflowX: 'auto',
        background: 'rgba(6,6,16,0.70)',
        borderBottom: '1px solid rgba(124,107,240,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        {isSharing && localStream && (
          <StreamTile
            label={currentUser} isOwn stream={localStream}
            externalRef={ownVideoRef} onExpand={onOwnFullscreen}
          />
        )}
        <AnimatePresence>
          {activeSharers
            .filter((s) => s.id !== socketId)
            .map((sharer) => {
              const stream = remoteStreams?.get(sharer.id);
              return (
                <StreamTile
                  key={sharer.id}
                  label={sharer.name}
                  stream={stream}
                  sharerId={sharer.id}
                  videoRefs={videoRefs}
                  color={getUserColor(sharer.name)}
                  onExpand={() => onFullscreen?.(sharer.id)}
                />
              );
            })}
        </AnimatePresence>
      </div>
    </ShareBarMotion>
  );
}

function StreamTile({ label, stream, isOwn, color, onExpand, externalRef, sharerId, videoRefs }) {
  const internalRef = useRef(null);

  useEffect(() => {
    const el = internalRef.current;
    if (!el) return;
    if (stream) el.srcObject = stream;
    if (!isOwn && sharerId && videoRefs?.current) {
      videoRefs.current.set(sharerId, el);
    }
    return () => {
      if (!isOwn && sharerId && videoRefs?.current) {
        videoRefs.current.delete(sharerId);
      }
    };
  }, [stream, isOwn, sharerId, videoRefs]);

  useEffect(() => {
    if (isOwn && externalRef) externalRef.current = internalRef.current;
  }, [isOwn, externalRef]);

  return (
    <div
      onClick={onExpand}
      style={{
        position: 'relative', flexShrink: 0,
        width: 196, height: 116,
        borderRadius: '0.75rem', overflow: 'hidden',
        cursor: 'pointer',
        background: 'rgba(10,10,26,0.90)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(124,107,240,0.30)';
        e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.6), 0 0 20px rgba(124,107,240,0.10)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <video
        ref={internalRef}
        autoPlay playsInline muted={isOwn}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {/* Expand hint overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'transparent',
        transition: 'background 0.2s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.28)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{
          opacity: 0, transition: 'opacity 0.2s ease',
          background: 'rgba(10,10,24,0.75)', borderRadius: '0.5rem', padding: '0.35rem',
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.parentElement.style.background = 'rgba(0,0,0,0.28)'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </div>
      </div>

      {/* Label */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0.5rem 0.625rem 0.4rem',
        background: 'linear-gradient(0deg, rgba(0,0,12,0.80) 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isOwn ? (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#f43f5e',
              boxShadow: '0 0 6px rgba(244,63,94,0.8)',
              display: 'inline-block', flexShrink: 0,
            }} />
          ) : (
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: color ?? '#7c6bf0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.5rem', fontWeight: 700, color: 'white',
            }}>
              {label?.[0]?.toUpperCase()}
            </div>
          )}
          <span style={{ color: 'rgba(220,215,255,0.90)', fontSize: '0.66rem', fontWeight: 500 }}>
            {isOwn ? 'You (sharing)' : label}
          </span>
        </div>
      </div>
    </div>
  );
}
