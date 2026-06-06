import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { StaggerList, StaggerItem, UserJoinMotion } from './MotionWrapper';
import { VoiceBar, StreamToggleButton } from './MicroComponents';
import { AudioReactiveRing } from './AudioReactiveRing';

const USER_COLORS = ['#7c6bf0', '#6366f1', '#2563eb', '#0891b2', '#a855f7'];

function getUserColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return USER_COLORS[h % USER_COLORS.length];
}

function Avatar({ name, color, size = 30 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.66rem', fontWeight: 700, color: 'white',
      flexShrink: 0, userSelect: 'none',
      boxShadow: `0 2px 8px ${color}44`,
    }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem',
    }}>
      <span className="ty-sidebar-section">{children}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(124,107,240,0.10)' }} />
    </div>
  );
}

export default function Sidebar({
  otherUsers, connectionStatuses, activeSharers, isSharing,
  onViewShare, onStartShare, onStopShare, speakingUsers = [], audioStreams = new Map(),
}) {
  return (
    <aside
      className="panel-sidebar hidden lg:flex flex-col"
      style={{ width: 248, padding: '1.25rem 1rem', gap: '1.5rem', position: 'relative', zIndex: 10 }}
    >
      {/* Online Users */}
      <div>
        <SectionLabel>Online · {otherUsers.length + 1}</SectionLabel>

        <StaggerList className="space-y-0.5">
          <AnimatePresence>
            {otherUsers.map((u) => {
              const color = getUserColor(u.name);
              const isSpeaking = speakingUsers.includes(u.id);
              const stream = audioStreams.get(u.id) ?? null;
              const status = connectionStatuses[u.id];

              return (
                <UserJoinMotion key={u.id}>
                  <StaggerItem>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.625rem',
                      padding: '0.45rem 0.6rem', borderRadius: '0.625rem',
                      transition: 'background 0.18s ease',
                      cursor: 'default',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <AudioReactiveRing stream={stream} size={34} enabled={isSpeaking && !!stream}>
                        <Avatar name={u.name} color={color} size={30} />
                      </AudioReactiveRing>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="ty-sidebar-user ty-truncate block">{u.name}</span>
                        {status === 'connecting' && (
                          <span className="ty-sidebar-status ty-accent--danger">connecting…</span>
                        )}
                      </div>

                      {stream && <VoiceBar stream={stream} isMuted={false} barCount={4} />}

                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: status === 'connected' ? '#34d399' : '#374151',
                        boxShadow: status === 'connected' ? '0 0 6px rgba(52,211,153,0.5)' : 'none',
                      }} />
                    </div>
                  </StaggerItem>
                </UserJoinMotion>
              );
            })}
          </AnimatePresence>

          {otherUsers.length === 0 && (
            <div style={{
              padding: '0.875rem 0.6rem',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '0.625rem',
              border: '1px dashed rgba(255,255,255,0.06)',
              textAlign: 'center',
            }}>
              <p className="ty-body--sm" style={{ color: 'var(--tx-ghost)', fontSize: '0.78rem' }}>
                No one else here yet
              </p>
            </div>
          )}
        </StaggerList>
      </div>

      {/* Screen Sharing */}
      <div>
        <SectionLabel>Screen Shares</SectionLabel>

        {activeSharers.length > 0 ? (
          <StaggerList className="space-y-1">
            {activeSharers.map((sharer) => (
              <StaggerItem key={sharer.id}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.45rem 0.6rem', borderRadius: '0.625rem',
                  background: 'rgba(124,107,240,0.06)',
                  border: '1px solid rgba(124,107,240,0.10)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--accent-bright)',
                      boxShadow: '0 0 8px rgba(157,143,247,0.6)',
                      animation: 'pulse 2s infinite',
                      flexShrink: 0,
                    }} />
                    <span className="ty-sidebar-user ty-truncate" style={{ maxWidth: 110 }}>{sharer.name}</span>
                  </div>
                  <button
                    onClick={() => onViewShare(sharer.id)}
                    style={{
                      padding: '0.22rem 0.6rem',
                      background: 'rgba(124,107,240,0.15)',
                      border: '1px solid rgba(124,107,240,0.25)',
                      borderRadius: '0.4rem',
                      color: 'var(--tx-accent)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      letterSpacing: '0.02em',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,107,240,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,107,240,0.15)'; }}
                  >
                    View
                  </button>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        ) : (
          <p className="ty-body--sm" style={{ color: 'var(--tx-ghost)', padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}>
            No active streams
          </p>
        )}
      </div>

      {/* Share control */}
      <div style={{ marginTop: 'auto' }}>
        <StreamToggleButton isSharing={isSharing} onStart={onStartShare} onStop={onStopShare} />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </aside>
  );
}
