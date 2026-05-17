import React, { useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ShareBarMotion } from './MotionWrapper';

const USER_COLORS = ['#7c3aed', '#6366f1', '#2563eb', '#0891b2', '#7c3aed'];
function getUserColor(name) {
  let h = 0;
  for (let i = 0; i < (name?.length ?? 0); i++) h += name.charCodeAt(i);
  return USER_COLORS[h % USER_COLORS.length];
}

export default function ScreenShareBar({
  activeSharers,
  remoteStreams,
  localStream,
  isSharing,
  currentUser,
  videoRefs,
  ownVideoRef,
  socketId,
  onFullscreen,
  onOwnFullscreen,
}) {
  const hasAny = activeSharers.length > 0 || isSharing;

  return (
    <ShareBarMotion isVisible={hasAny}>
      <div
        className="px-4 py-3 flex gap-3 overflow-x-auto border-b"
        style={{ borderColor: 'rgba(168,85,247,0.08)', background: 'rgba(4,4,14,0.55)' }}
      >
        {isSharing && localStream && (
          <StreamTile
            label={currentUser}
            isOwn
            stream={localStream}
            externalRef={ownVideoRef}
            onExpand={onOwnFullscreen}
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

    if (stream) {
      el.srcObject = stream;
    }

    // Register in videoRefs map for remote streams
    if (!isOwn && sharerId && videoRefs?.current) {
      videoRefs.current.set(sharerId, el);
    }

    return () => {
      if (!isOwn && sharerId && videoRefs?.current) {
        videoRefs.current.delete(sharerId);
      }
    };
  }, [stream, isOwn, sharerId, videoRefs]);

  // Sync externalRef for own stream
  useEffect(() => {
    if (isOwn && externalRef) {
      externalRef.current = internalRef.current;
    }
  }, [isOwn, externalRef]);

  return (
    <div
      className="relative flex-shrink-0 rounded-xl overflow-hidden cursor-pointer group"
      style={{
        width: 200,
        height: 118,
        background: 'rgba(8,8,20,0.8)',
        border: '1px solid rgba(139,92,246,0.12)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
      onClick={onExpand}
    >
      <video
        ref={internalRef}
        autoPlay
        playsInline
        muted={isOwn}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5"
        style={{ background: 'linear-gradient(0deg, rgba(0,0,10,0.75) 0%, transparent 100%)' }}
      >
        <div className="flex items-center gap-1.5">
          {!isOwn && (
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              background: color ?? '#7c3aed',
              fontSize: '0.5rem', fontWeight: 700,
              color: 'white', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {label?.[0]?.toUpperCase()}
            </div>
          )}
          {isOwn && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 6px rgba(239,68,68,0.8)',
              flexShrink: 0, display: 'inline-block',
            }} />
          )}
          <span className="ty-meta" style={{ color: 'rgba(210,200,255,0.85)', fontSize: '0.65rem' }}>
            {isOwn ? 'You' : label}
          </span>
        </div>
      </div>

      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(168,85,247,0.35)' }}
      />
    </div>
  );
}