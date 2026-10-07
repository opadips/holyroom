import React, { useRef, useEffect, useState } from 'react';

const CHIP_BG = 'rgba(6,6,16,0.85)'; // scrim floor: text over video stays >= 0.85

export default function Stage({
  stageId = null,
  sharerName = '',
  remoteStreams,
  videoRefs,
  activeSharers = [],
  isSharing = false,
  localStream = null,
  ownVideoRef,
  currentUser = '',
  onExpand,
  onOwnExpand,
}) {
  const videoRef = useRef(null);
  const [needsTap, setNeedsTap] = useState(false);
  const stream = stageId && remoteStreams ? remoteStreams.get(stageId) : null;

  useEffect(() => {
    const el = videoRef.current;
    if (!stageId || !el) return;
    videoRefs.current.set(stageId, el);
    const s = remoteStreams?.get(stageId);
    if (s && el.srcObject !== s) {
      el.srcObject = s;
      el.play().then(() => setNeedsTap(false)).catch(() => setNeedsTap(true));
    }
    return () => {
      videoRefs.current.delete(stageId);
    };
  }, [stageId, remoteStreams, videoRefs]);

  const initials = currentUser?.slice(0, 2).toUpperCase() || '?';

  const placeholder = (() => {
    if (isSharing) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem', textAlign: 'center' }}>
          <span aria-hidden="true" style={{
            width: 64, height: 64, borderRadius: '1rem',
            background: 'rgba(124,107,240,0.14)', border: '1px solid rgba(157,143,247,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--tx-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <polyline points="8 21 12 17 16 21" />
            </svg>
          </span>
          <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--tx-primary)' }}>You&rsquo;re sharing</span>
          <span style={{ fontSize: '0.84rem', color: 'var(--tx-secondary)', maxWidth: 360 }}>
            Your screen is live in the room. Select a participant&rsquo;s shared screen from the top strip to watch it here instead.
          </span>
        </div>
      );
    }
    if (activeSharers.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', textAlign: 'center' }}>
          <span aria-hidden="true" style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(124,107,240,0.12)', border: '1px solid rgba(157,143,247,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tx-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" strokeDasharray="28 56">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
              </circle>
            </svg>
          </span>
          <span style={{ fontSize: '0.88rem', color: 'var(--tx-secondary)' }}>
            Connecting to {sharerName || 'a shared screen'}…
          </span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem', textAlign: 'center' }}>
        <span
          aria-hidden="true"
          style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #5b4ed2, #6f60e8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 700, color: 'white',
            boxShadow: '0 8px 32px rgba(106,90,223,0.35)',
          }}
        >
          {initials}
        </span>
        <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--tx-primary)' }}>
          Nothing on stage yet
        </span>
        <span style={{ fontSize: '0.84rem', color: 'var(--tx-secondary)', maxWidth: 360 }}>
          Share your screen from the control dock, or wait for someone else to share.
        </span>
      </div>
    );
  })();

  return (
    <div
      style={{
        position: 'relative', flex: 1, minWidth: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-void)', overflow: 'hidden',
      }}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      ) : (
        placeholder
      )}

      {/* Tap-to-play fallback (unmuted autoplay can be blocked) */}
      {stream && needsTap && (
        <button
          type="button"
          onClick={() => videoRef.current?.play().then(() => setNeedsTap(false)).catch(() => {})}
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            padding: '0.6rem 1.4rem', borderRadius: '999px',
            background: CHIP_BG, backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(157,143,247,0.45)',
            color: 'var(--tx-primary)', fontSize: '0.86rem', fontWeight: 600,
            cursor: 'pointer', zIndex: 6,
          }}
        >
          ▶ Play shared screen
        </button>
      )}

      {/* Stage HUD — scrimmed chips (min 0.85) so text holds over any content */}
      {stream && (
        <div
          style={{
            position: 'absolute', top: 12, left: 12,
            display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 5,
          }}
        >
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.35rem 0.7rem', borderRadius: '999px',
              background: CHIP_BG,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span aria-hidden="true" style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.8)',
              animation: 'liveDot 1.4s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.82)' }}>LIVE</span>
            {sharerName && (
              <>
                <span aria-hidden="true" style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.22)' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'rgba(235,235,255,0.95)' }}>{sharerName}</span>
              </>
            )}
          </span>

          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              aria-label="Expand shared screen to fullscreen"
              title="Fullscreen"
              style={{
                width: 34, height: 34, borderRadius: '999px',
                background: CHIP_BG,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(235,235,255,0.95)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Bottom scrim behind the floating dock (min 0.80 at the text row) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 130,
          background: 'linear-gradient(0deg, rgba(4,4,10,0.80) 0%, rgba(4,4,10,0.40) 55%, transparent 100%)',
          pointerEvents: 'none', zIndex: 3,
        }}
      />

      {/* Compact self preview — never full size (mirror risk) */}
      {isSharing && localStream && (
        <button
          type="button"
          onClick={onOwnExpand}
          aria-label="You (sharing) — expand your shared screen to fullscreen"
          style={{
            position: 'absolute', right: 16, bottom: 84,
            width: 164, height: 100,
            borderRadius: '0.75rem', overflow: 'hidden',
            padding: 0, cursor: 'pointer', zIndex: 4,
            background: 'rgba(10,10,26,0.95)',
            border: '1px solid rgba(157,143,247,0.4)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.6)',
          }}
        >
          <video
            ref={ownVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <span style={{
            position: 'absolute', left: 6, bottom: 5,
            fontSize: '0.62rem', fontWeight: 600,
            color: 'rgba(235,235,255,0.95)',
            background: CHIP_BG, borderRadius: '999px',
            padding: '0.1rem 0.45rem',
          }}>
            You (sharing)
          </span>
        </button>
      )}

      <style>{`@keyframes liveDot { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`}</style>
    </div>
  );
}
