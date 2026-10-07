import React from 'react';

// White initials are normal-size text — every color keeps ≥4.5:1 (scripts/contrast-audit.mjs)
const USER_COLORS = ['#5b4ed2', '#4c43c2', '#2563eb', '#0e7490', '#7e22ce'];

function getUserColor(name) {
  let h = 0;
  for (let i = 0; i < (name?.length ?? 0); i++) h += name.charCodeAt(i);
  return USER_COLORS[h % USER_COLORS.length];
}

const STATUS_COLORS = {
  connected: '#34d399',
  connecting: '#fbbf24',
  disconnected: '#9ca3af',
  failed: '#9ca3af',
  closed: '#9ca3af',
};

function Avatar({ name, color, size = 26 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: '50%',
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.62rem', fontWeight: 700, color: 'white',
        flexShrink: 0, userSelect: 'none',
      }}
    >
      {name?.[0]?.toUpperCase()}
    </span>
  );
}

function ShareBadge() {
  return (
    <span
      title="Sharing screen"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18, borderRadius: '50%',
        background: 'rgba(124,107,240,0.18)',
        border: '1px solid rgba(157,143,247,0.45)',
        flexShrink: 0,
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--tx-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <polyline points="8 21 12 17 16 21" />
      </svg>
    </span>
  );
}

function StatusDot({ status }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.disconnected;
  const label = status === 'connected' ? 'Connected'
    : status === 'connecting' ? 'Connecting'
    : 'Disconnected';
  return (
    <span
      title={label}
      aria-hidden="true"
      style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: color,
        boxShadow: status === 'connected' ? '0 0 6px rgba(52,211,153,0.5)' : 'none',
      }}
    />
  );
}

const tileBase = {
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  padding: '0.3rem 0.7rem 0.3rem 0.35rem',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
  maxWidth: 180,
  transition: 'border-color 0.18s ease, background 0.18s ease',
  flexShrink: 0,
};

const nameStyle = {
  fontSize: '0.78rem', fontWeight: 500,
  color: 'var(--tx-secondary)',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  maxWidth: 96,
};

export default function ParticipantStrip({
  currentUser,
  otherUsers = [],
  usersCount = 0,
  connectionStatuses = {},
  activeSharers = [],
  socketId,
  isSharing = false,
  stageId = null,
  onStageSelect,
  chatOpen = true,
  unreadCount = 0,
  onToggleChat,
}) {
  const sharerIds = new Set(activeSharers.map((s) => s.id));

  const renderTile = (user) => {
    const isSharer = sharerIds.has(user.id);
    const staged = stageId === user.id;
    const status = connectionStatuses[user.id] || 'connected';
    const name = user.name;
    const avatar = <Avatar name={name} color={getUserColor(name)} />;
    const dot = <StatusDot status={status} />;
    const badge = isSharer ? <ShareBadge /> : null;
    const label = `${name}${isSharer ? ' — sharing screen' : ''}${status === 'connecting' ? ' (connecting)' : ''}`;

    if (!isSharer) {
      return (
        <div key={user.id} role="listitem" style={tileBase} aria-label={label}>
          {avatar}
          <span style={nameStyle}>{name}</span>
          {dot}
        </div>
      );
    }

    return (
      <button
        key={user.id}
        type="button"
        role="listitem"
        onClick={() => onStageSelect?.(user.id)}
        aria-pressed={staged}
        aria-label={`View ${name}'s shared screen`}
        style={{
          ...tileBase,
          cursor: 'pointer',
          borderColor: staged ? 'rgba(157,143,247,0.55)' : 'rgba(124,107,240,0.22)',
          background: staged ? 'rgba(124,107,240,0.14)' : 'rgba(124,107,240,0.06)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(157,143,247,0.75)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = staged ? 'rgba(157,143,247,0.55)' : 'rgba(124,107,240,0.22)'; }}
      >
        {avatar}
        <span style={{ ...nameStyle, color: staged ? 'var(--tx-primary)' : 'var(--tx-secondary)' }}>{name}</span>
        {badge}
        {dot}
      </button>
    );
  };

  const selfInitials = currentUser?.slice(0, 2).toUpperCase() || '?';

  return (
    <div
      className="panel-header"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.5rem 1rem', minHeight: 56,
        position: 'relative', zIndex: 20, flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <div
          aria-hidden="true"
          style={{
            width: 30, height: 30,
            background: 'linear-gradient(135deg, #6a5adf, #7c6bf0)',
            borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 14px rgba(106,90,223,0.38)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.74rem', color: 'var(--tx-secondary)', fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block', width: 6, height: 6,
              borderRadius: '50%', background: '#34d399',
              boxShadow: '0 0 6px rgba(52,211,153,0.6)',
            }}
          />
          {usersCount} online
        </span>
      </div>

      {/* Participant tiles */}
      <div
        role="list"
        aria-label="Participants"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          flex: 1, minWidth: 0,
          overflowX: 'auto', overflowY: 'hidden',
          padding: '0.15rem 0',
          scrollbarWidth: 'thin',
        }}
      >
        {/* Self tile */}
        <div role="listitem" style={tileBase} aria-label={`You${isSharing ? ' — sharing screen' : ''}`}>
          <span
            aria-hidden="true"
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg, #5b4ed2, #6f60e8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.62rem', fontWeight: 700, color: 'white',
              flexShrink: 0,
            }}
          >
            {selfInitials}
          </span>
          <span style={{ ...nameStyle, color: 'var(--tx-primary)' }}>You</span>
          {isSharing && <ShareBadge />}
          <StatusDot status="connected" />
        </div>

        {otherUsers.map(renderTile)}

        {otherUsers.length === 0 && (
          <span style={{ fontSize: '0.74rem', color: 'var(--tx-ghost)', whiteSpace: 'nowrap', paddingLeft: '0.25rem' }}>
            No one else here yet
          </span>
        )}
      </div>

      {/* Chat toggle */}
      <button
        type="button"
        onClick={onToggleChat}
        className="glass-icon-btn"
        aria-expanded={chatOpen}
        aria-controls="chat-rail"
        aria-label={
          chatOpen ? 'Collapse chat'
            : unreadCount > 0 ? `Open chat, ${unreadCount} unread messages`
            : 'Open chat'
        }
        title={chatOpen ? 'Collapse chat' : 'Open chat'}
        style={{ width: 36, height: 36, flexShrink: 0, position: 'relative' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tx-secondary)' }} aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {!chatOpen && unreadCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', top: -3, right: -3,
              minWidth: 16, height: 16, padding: '0 4px',
              borderRadius: '999px',
              background: '#be123c',
              color: 'white',
              fontSize: '0.6rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 8px rgba(244,63,94,0.6)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
