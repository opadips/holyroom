import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
      <span className="ty-sidebar-section">{children}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(124,107,240,0.10)' }} />
    </div>
  );
}

// ── Volume icon SVGs ──────────────────────────────────────────
function IconVolumeMute() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}
function IconVolumeHigh() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}
function IconVolumeLow() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

// ── Volume indicator badge shown next to username ─────────────
function VolumeIndicator({ volume, isMuted }) {
  if (isMuted)         return <span style={{ color: '#f87171', fontSize: '0.72rem' }} title="Muted locally"><IconVolumeMute /></span>;
  if (volume > 100)    return <span style={{ color: '#a78bfa', fontSize: '0.72rem' }} title={`${volume}% volume`}><IconVolumeHigh /></span>;
  if (volume < 100)    return <span style={{ color: '#94a3b8', fontSize: '0.72rem' }} title={`${volume}% volume`}><IconVolumeLow /></span>;
  return null;
}

// ── Context menu (right-click) ────────────────────────────────
function ContextMenu({ x, y, user, isMuted, onMute, onUnmute, onAdjust, onMention, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('contextmenu', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('contextmenu', handler);
    };
  }, [onClose]);

  const menuStyle = {
    position: 'fixed', left: x, top: y, zIndex: 9999,
    background: 'rgba(15,12,35,0.97)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(124,107,240,0.22)',
    borderRadius: '0.625rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    minWidth: 160, overflow: 'hidden',
    animation: 'ctxFadeIn 0.12s ease',
  };

  const itemStyle = (danger = false) => ({
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.5rem 0.875rem',
    fontSize: '0.78rem', fontWeight: 500,
    color: danger ? '#f87171' : 'var(--tx-secondary)',
    cursor: 'pointer',
    transition: 'background 0.12s',
    userSelect: 'none',
  });

  return (
    <div ref={ref} style={menuStyle}>
      <div style={{ padding: '0.4rem 0.875rem 0.35rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.2rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--tx-accent)', letterSpacing: '0.04em' }}>
          {user.name}
        </span>
      </div>

      {isMuted ? (
        <div style={itemStyle()} onClick={() => { onUnmute(); onClose(); }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <IconVolumeHigh /> Unmute User
        </div>
      ) : (
        <div style={itemStyle(true)} onClick={() => { onMute(); onClose(); }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <IconVolumeMute /> Mute User
        </div>
      )}

      <div style={itemStyle()} onClick={() => { onAdjust(); onClose(); }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <IconVolumeLow /> Adjust Volume
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0.2rem 0' }} />

      <div style={itemStyle()} onClick={() => { onMention(); onClose(); }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
        </svg>
        Mention User
      </div>

      <style>{`@keyframes ctxFadeIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

// ── User audio popup panel (Portal — always above everything) ─
function UserAudioPopup({ anchorEl, user, volume, isMuted, onVolumeChange, onMute, onUnmute, onClose }) {
  const ref  = useRef(null);
  const color = getUserColor(user.name);

  // Position: right of sidebar, vertically aligned to anchor row
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.right + 8 });
    }
  }, [anchorEl]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) &&
          anchorEl && !anchorEl.contains(e.target)) {
        onClose();
      }
    };
    // Slight delay so the click that opened the popup doesn't immediately close it
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 80);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose, anchorEl]);

  const popup = (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 99999,
        width: 224,
        // Solid dark background — no transparency issues
        background: 'rgba(14, 11, 30, 0.98)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(124, 107, 240, 0.30)',
        borderRadius: '12px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.70), 0 0 0 1px rgba(255,255,255,0.04) inset',
        padding: '14px',
        fontFamily: 'inherit',
        animation: 'popupFadeIn 0.15s ease',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '12px' }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: '#ffffff',
          boxShadow: `0 2px 10px ${color}66`,
          flexShrink: 0,
        }}>
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.83rem', color: '#f0eeff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name}
          </div>
          {isMuted
            ? <div style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 600, marginTop: 1 }}>Status: Muted</div>
            : <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>Volume: {volume}%</div>
          }
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '50%', width: 22, height: 22,
          color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem', lineHeight: 1, flexShrink: 0,
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        >×</button>
      </div>

      {/* Slider section — shown even when muted so user can pre-set level */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>0%</span>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700,
            color: isMuted ? '#f87171' : volume > 100 ? '#a78bfa' : '#9d8ff7',
          }}>{isMuted ? 'Muted' : `${volume}%`}</span>
          <span style={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>200%</span>
        </div>
        <input
          type="range"
          min={0} max={200} step={1}
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (isMuted && v > 0) onUnmute();
            onVolumeChange(v);
          }}
          style={{
            width: '100%',
            accentColor: isMuted ? '#f87171' : volume > 100 ? '#a78bfa' : '#7c6bf0',
            cursor: 'pointer',
            opacity: 1,
          }}
        />
        {/* Fill bar */}
        <div style={{ marginTop: '6px', height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: isMuted ? '0%' : `${Math.min((volume / 200) * 100, 100)}%`,
            background: isMuted
              ? '#f87171'
              : volume > 100
                ? 'linear-gradient(90deg,#7c6bf0,#a78bfa)'
                : 'linear-gradient(90deg,#2563eb,#7c6bf0)',
            borderRadius: 4,
            transition: 'width 0.04s, background 0.2s',
          }} />
        </div>
      </div>

      {/* Mute / Unmute button */}
      {isMuted ? (
        <button onClick={onUnmute} style={{
          width: '100%', padding: '8px',
          background: 'rgba(52,211,153,0.14)',
          border: '1px solid rgba(52,211,153,0.35)',
          borderRadius: '8px', color: '#34d399',
          fontSize: '0.74rem', fontWeight: 700,
          cursor: 'pointer', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.24)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(52,211,153,0.14)'}
        >
          <IconVolumeHigh /> Unmute User
        </button>
      ) : (
        <button onClick={onMute} style={{
          width: '100%', padding: '8px',
          background: 'rgba(239,68,68,0.10)',
          border: '1px solid rgba(239,68,68,0.28)',
          borderRadius: '8px', color: '#f87171',
          fontSize: '0.74rem', fontWeight: 700,
          cursor: 'pointer', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.20)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.10)'}
        >
          <IconVolumeMute /> Mute User
        </button>
      )}

      <style>{`
        @keyframes popupFadeIn {
          from { opacity: 0; transform: translateX(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(popup, document.body);
}

// ── Main Sidebar ──────────────────────────────────────────────
export default function Sidebar({
  otherUsers, connectionStatuses, activeSharers, isSharing,
  onViewShare, onDisconnectView, viewingSharers = new Set(),
  userVolumes = {}, mutedUsers = new Set(),
  onSetUserVolume, onMuteUser, onUnmuteUser,
  onStartShare, onStopShare,
  speakingUsers = [], audioStreams = new Map(),
  onMentionUser,
}) {
  const [openPopupId, setOpenPopupId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, user }
  const sidebarRef  = useRef(null);
  const anchorRefs  = useRef(new Map()); // userId -> DOM element

  const handleUserClick = useCallback((user) => {
    setOpenPopupId((prev) => prev === user.id ? null : user.id);
    setContextMenu(null);
  }, []);

  const handleContextMenu = useCallback((e, user) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, user });
    setOpenPopupId(null);
  }, []);

  // Delayed open so the context-menu's outside-click listener
  // doesn't fire before the popup mounts
  const handleAdjustVolume = useCallback((userId) => {
    setTimeout(() => setOpenPopupId(userId), 60);
  }, []);

  return (
    <aside
      ref={sidebarRef}
      className="panel-sidebar hidden lg:flex flex-col"
      style={{ width: 248, padding: '1.25rem 1rem', gap: '1.5rem', position: 'relative', zIndex: 10 }}
    >
      {/* Online Users */}
      <div>
        <SectionLabel>Online · {otherUsers.length + 1}</SectionLabel>

        <StaggerList className="space-y-0.5">
          <AnimatePresence>
            {otherUsers.map((u) => {
              const color       = getUserColor(u.name);
              const isSpeaking  = speakingUsers.includes(u.id);
              const stream      = audioStreams.get(u.id) ?? null;
              const status      = connectionStatuses[u.id];
              const vol         = userVolumes[u.id] ?? 100;
              const isUserMuted = mutedUsers.has(u.id);
              const isPopupOpen = openPopupId === u.id;

              return (
                <UserJoinMotion key={u.id}>
                  <StaggerItem>
                    <div
                      style={{ position: 'relative' }}
                      ref={(el) => { if (el) anchorRefs.current.set(u.id, el); else anchorRefs.current.delete(u.id); }}
                    >
                      <div
                        onClick={() => handleUserClick(u)}
                        onContextMenu={(e) => handleContextMenu(e, u)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.625rem',
                          padding: '0.45rem 0.6rem', borderRadius: '0.625rem',
                          transition: 'background 0.18s ease',
                          cursor: 'pointer',
                          background: isPopupOpen ? 'rgba(124,107,240,0.10)' : 'transparent',
                          outline: isPopupOpen ? '1px solid rgba(124,107,240,0.22)' : 'none',
                        }}
                        onMouseEnter={e => { if (!isPopupOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { if (!isPopupOpen) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <AudioReactiveRing stream={stream} size={34} enabled={isSpeaking && !!stream && !isUserMuted}>
                          <Avatar name={u.name} color={color} size={30} />
                        </AudioReactiveRing>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span className="ty-sidebar-user ty-truncate">{u.name}</span>
                            <VolumeIndicator volume={vol} isMuted={isUserMuted} />
                          </div>
                          {status === 'connecting' && (
                            <span className="ty-sidebar-status ty-accent--danger">connecting…</span>
                          )}
                        </div>

                        {stream && !isUserMuted && <VoiceBar stream={stream} isMuted={false} barCount={4} />}

                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          background: status === 'connected' ? '#34d399' : '#374151',
                          boxShadow: status === 'connected' ? '0 0 6px rgba(52,211,153,0.5)' : 'none',
                        }} />
                      </div>

                      {/* Audio popup rendered in a Portal above everything */}
                      {isPopupOpen && (
                        <UserAudioPopup
                          anchorEl={anchorRefs.current.get(u.id)}
                          user={u}
                          volume={vol}
                          isMuted={isUserMuted}
                          onVolumeChange={(v) => onSetUserVolume(u.id, v)}
                          onMute={() => onMuteUser(u.id)}
                          onUnmute={() => onUnmuteUser(u.id)}
                          onClose={() => setOpenPopupId(null)}
                        />
                      )}
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
                  {viewingSharers.has(sharer.id) ? (
                    <button
                      onClick={() => onDisconnectView(sharer.id)}
                      style={{
                        padding: '0.22rem 0.6rem',
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.28)',
                        borderRadius: '0.4rem',
                        color: '#f87171',
                        fontSize: '0.7rem', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.18s ease',
                        letterSpacing: '0.02em', whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.22)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => onViewShare(sharer.id)}
                      style={{
                        padding: '0.22rem 0.6rem',
                        background: 'rgba(124,107,240,0.15)',
                        border: '1px solid rgba(124,107,240,0.25)',
                        borderRadius: '0.4rem',
                        color: 'var(--tx-accent)',
                        fontSize: '0.7rem', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.18s ease',
                        letterSpacing: '0.02em',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,107,240,0.25)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,107,240,0.15)'; }}
                    >
                      View
                    </button>
                  )}
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

      {/* Right-click context menu — rendered at fixed position */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          user={contextMenu.user}
          isMuted={mutedUsers.has(contextMenu.user.id)}
          onMute={() => onMuteUser(contextMenu.user.id)}
          onUnmute={() => onUnmuteUser(contextMenu.user.id)}
          onAdjust={() => handleAdjustVolume(contextMenu.user.id)}
          onMention={() => onMentionUser?.(contextMenu.user.name)}
          onClose={() => setContextMenu(null)}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </aside>
  );
}
