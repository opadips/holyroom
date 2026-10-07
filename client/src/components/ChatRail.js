import React from 'react';
import ChatArea from './ChatArea';
import InputBar from './InputBar';

export default function ChatRail({
  messages = [],
  input = '',
  setInput,
  onSend,
  typingUsers = [],
  isLoading = false,
  onCollapse,
}) {
  return (
    <div
      id="chat-rail"
      aria-label="Chat"
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', minWidth: 0, overflow: 'hidden',
        background: 'var(--panel-bg)',
        backdropFilter: 'var(--panel-blur)',
        WebkitBackdropFilter: 'var(--panel-blur)',
        borderLeft: 'var(--panel-border)',
        boxShadow: '-4px 0 48px rgba(0,0,0,0.45), inset 1px 0 0 rgba(255,255,255,0.025)',
      }}
    >
      {/* Rail header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.7rem 0.9rem',
          borderBottom: '1px solid rgba(124,107,240,0.08)',
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tx-secondary)', flexShrink: 0 }} aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ color: 'var(--tx-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>general</span>
        <span aria-hidden="true" style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.10)' }} />
        <span style={{ color: 'var(--tx-ghost)', fontSize: '0.72rem', fontVariantNumeric: 'tabular-nums' }}>
          {messages.length} messages
        </span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onCollapse}
          className="glass-icon-btn"
          aria-label="Collapse chat"
          title="Collapse chat"
          style={{ width: 28, height: 28 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tx-secondary)' }} aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <ChatArea messages={messages} isLoading={isLoading} typingUsers={typingUsers} />

      <InputBar input={input} setInput={setInput} onSend={onSend} />
    </div>
  );
}
