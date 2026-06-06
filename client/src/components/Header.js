import React from 'react';

export default function Header({ currentUser, usersCount, onSettingsClick, onLeave }) {
  const initials = currentUser?.slice(0,2).toUpperCase() || '?';

  return (
    <header className="panel-header px-5 py-3 flex items-center justify-between relative z-20" style={{ minHeight: 60 }}>
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg, #6a5adf, #7c6bf0)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 14px rgba(106,90,223,0.38)',
          flexShrink: 0,
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <div className="ty-header-title">Holyroom</div>
          <div className="ty-header-sub flex items-center gap-1">
            <span style={{
              display: 'inline-block', width: 5, height: 5,
              borderRadius: '50%', background: '#34d399',
              boxShadow: '0 0 6px rgba(52,211,153,0.6)',
            }} />
            {usersCount} online
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Settings */}
        <button
          onClick={onSettingsClick}
          className="glass-icon-btn"
          aria-label="Settings"
          style={{ width: 34, height: 34 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tx-tertiary)' }}>
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.06)', margin: '0 2px' }} />

        {/* User chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.3rem 0.65rem 0.3rem 0.3rem',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '999px',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c6bf0, #9d8ff7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.62rem', fontWeight: 700, color: 'white',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <span className="hidden sm:block ty-sidebar-user" style={{ color: 'var(--tx-secondary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentUser}
          </span>
        </div>

        {/* Leave */}
        <button
          onClick={onLeave}
          className="btn-danger ty-btn"
          style={{ padding: '0.4rem 0.875rem', borderRadius: '0.625rem' }}
        >
          Leave
        </button>
      </div>
    </header>
  );
}
