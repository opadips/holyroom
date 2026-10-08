import React from 'react';
import { MuteButton, StreamToggleButton } from './MicroComponents';

const DOCK_BG = 'rgba(8,8,20,0.88)'; // scrim floor: dock stays readable over video

export default function ControlDock({
  isMuted = false,
  onToggleMute,
  micState = 'ready',
  isSharing = false,
  onStartShare,
  onStopShare,
  shareSupported = true,
  shareDisabledTitle = '',
  qualityLabel = '1080p 30fps',
  qualityTitle = '',
  onOpenSettings,
  onLeave,
}) {
  const micTitle = {
    insecure: 'Microphone requires HTTPS or localhost',
    denied: 'Microphone access denied — allow it in your browser settings',
    nodevice: 'No microphone found',
    ready: '',
  }[micState] || '';

  return (
    <div
      role="toolbar"
      aria-label="Room controls"
      style={{
        position: 'absolute',
        left: '50%', bottom: 14,
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-dock)',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.5rem 0.6rem',
        borderRadius: '1.25rem',
        background: DOCK_BG,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(124,107,240,0.20)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.65), 0 0 40px rgba(90,70,200,0.10), inset 0 1px 0 rgba(255,255,255,0.06)',
        maxWidth: 'calc(100% - 24px)',
      }}
    >
      {/* Mic */}
      <MuteButton isMuted={isMuted} onToggle={onToggleMute} disabled={micState !== 'ready'} title={micTitle} />

      {/* Share */}
      <StreamToggleButton
        isSharing={isSharing}
        onStart={onStartShare}
        onStop={onStopShare}
        disabled={!shareSupported}
        title={shareDisabledTitle}
      />

      {/* Quality chip -> settings */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="dock-quality-chip"
        aria-label={`Screen share quality: ${qualityLabel}. Open settings`}
        title={qualityTitle || `Share quality: ${qualityLabel}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.75rem',
          background: 'rgba(124,107,240,0.12)',
          border: '1px solid rgba(124,107,240,0.28)',
          color: 'var(--tx-accent)',
          fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.02em',
          cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'background 0.18s ease, border-color 0.18s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,107,240,0.2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(124,107,240,0.12)'; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
        </svg>
        <span className="dock-quality-label">{qualityLabel}</span>
      </button>

      <span aria-hidden="true" style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.10)', margin: '0 0.15rem' }} />

      {/* Settings */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="glass-icon-btn"
        aria-label="Settings"
        title="Settings"
        style={{ width: 40, height: 40 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tx-secondary)' }} aria-hidden="true">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Leave */}
      <button
        type="button"
        onClick={onLeave}
        className="btn-danger ty-btn"
        style={{ padding: '0.6rem 1rem', height: 40, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Leave
      </button>
    </div>
  );
}
