import React, { useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageMotion } from './MotionWrapper';
import { TypingIndicator, MessageStatus, LoadingSkeleton } from './MicroComponents';

// White initials are normal-size text — every stop keeps ≥4.5:1 (see scripts/contrast-audit.mjs)
const AVATAR_COLORS = [
  ['#5b4ed2', '#6559dc'],
  ['#4c43c2', '#5a4fd4'],
  ['#1d4ed8', '#2563eb'],
  ['#5b21b6', '#7e22ce'],
  ['#4c41b8', '#5b4ed2'],
];

function getAvatarColors(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash += username.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

const FILE_STATUS = {
  queued:      () => ({ text: 'Waiting to send…',          color: 'var(--tx-secondary)' }),
  sending:     (pct) => ({ text: `Sending… ${pct}%`,       color: 'var(--tx-accent)' }),
  receiving:   (pct) => ({ text: `Receiving… ${pct}%`,     color: 'var(--tx-accent)' }),
  ready:       (pct, msg) => ({
    text: msg.dir === 'out'
      ? `Sent to ${msg.peersDone} of ${msg.peersTotal} peer${msg.peersTotal === 1 ? '' : 's'}`
      : 'Ready',
    color: 'var(--tx-success)',
  }),
  canceled:    () => ({ text: 'Canceled',                  color: 'var(--tx-danger)' }),
  interrupted: () => ({ text: 'Interrupted',               color: 'var(--tx-warning)' }),
  failed:      (pct, msg) => ({
    text: msg.peersTotal === 0
      ? 'No one else was connected'
      : `Failed — sent to ${msg.peersDone} of ${msg.peersTotal} peers`,
    color: 'var(--tx-danger)',
  }),
};

function FileCardBody({ msg, onCancel }) {
  const { name, size, state, progress = 0, dir, url, mime } = msg;
  const pct = Math.min(100, Math.round((progress || 0) * 100));
  const active = state === 'queued' || state === 'sending' || state === 'receiving';
  const status = (FILE_STATUS[state] || FILE_STATUS.failed)(pct, msg);
  const showThumb = state === 'ready' && url && (mime || '').startsWith('image/');
  const [c1, c2] = getAvatarColors(msg.username);

  return (
    <div
      role="group"
      aria-label={`File ${name} from ${msg.username}`}
      style={{
        marginTop: '0.2rem',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '0.65rem 0.75rem',
        display: 'flex',
        gap: '0.7rem',
        alignItems: 'center',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 44, height: 44, flexShrink: 0, borderRadius: 10,
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: showThumb ? '#000' : `linear-gradient(135deg, ${c1}, ${c2})`,
        }}
      >
        {showThumb ? (
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{
            color: 'var(--tx-primary)', fontSize: '0.84rem', fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
          }}>{name}</span>
          <span style={{
            color: 'var(--tx-ghost)', fontSize: '0.7rem', flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
          }}>{formatSize(size)}</span>
        </div>
        <div style={{ color: status.color, fontSize: '0.72rem', marginTop: 1 }}>{status.text}</div>

        {active && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={`Transfer progress for ${name}`}
            style={{
              height: 5, borderRadius: 3,
              background: 'rgba(255,255,255,0.08)',
              marginTop: 7, overflow: 'hidden',
            }}
          >
            <div style={{
              width: `${pct}%`, height: '100%', borderRadius: 3,
              background: 'linear-gradient(90deg, #6559dc, #7c6bf0)',
              transition: 'width 0.2s ease',
            }} />
          </div>
        )}

        {state === 'ready' && dir === 'in' && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.55rem' }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              aria-label={`Open ${name}`}
              style={{ padding: '0.3rem 0.85rem', fontSize: '0.74rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >Open</a>
            <a
              href={url}
              download={name}
              className="btn-primary"
              aria-label={`Save ${name}`}
              style={{ padding: '0.3rem 0.85rem', fontSize: '0.74rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >Save</a>
          </div>
        )}
      </div>

      {active && onCancel && (
        <button
          type="button"
          className="btn-danger"
          onClick={() => onCancel(msg)}
          aria-label={`Cancel transfer of ${name}`}
          style={{ padding: '0.32rem 0.8rem', fontSize: '0.74rem', flexShrink: 0 }}
        >Cancel</button>
      )}
    </div>
  );
}

export default function ChatArea({ messages, isLoading = false, typingUsers = [], onCancelFile }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  return (
    <div
      className="flex-1 overflow-y-auto relative z-10"
      style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0' }}
      role="log"
      aria-label="Messages"
    >
      <div role="status" aria-live="polite" className="sr-only">
        {typingUsers.length
          ? `${typingUsers.join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing…`
          : ''}
      </div>
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
          {[80, 60, 90, 50].map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <LoadingSkeleton width={32} height={32} rounded />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                <LoadingSkeleton width={`${w * 0.4}%`} height={10} rounded />
                <LoadingSkeleton width={`${w}%`} height={14} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && messages.length === 0 && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
          opacity: 0.5,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--tx-ghost)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p style={{ color: 'var(--tx-ghost)', fontSize: '0.8rem', textAlign: 'center' }}>
            No messages yet.<br/>Start the conversation.
          </p>
        </div>
      )}

      {!isLoading && (
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isSystem = msg.username === 'System';
            const [c1, c2] = getAvatarColors(msg.username);
            const showAvatar = idx === 0 || messages[idx - 1]?.username !== msg.username;
            const isLast = idx === messages.length - 1;

            if (isSystem) {
              return (
                <MessageMotion key={msg.id ?? idx}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.3rem 0.5rem', margin: '0.25rem 0',
                  }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                    <span className="ty-chat-message--system">{msg.text}</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                </MessageMotion>
              );
            }

            return (
              <MessageMotion key={msg.id ?? idx}>
                <div style={{
                  display: 'flex', gap: '0.625rem',
                  paddingTop: showAvatar ? '0.875rem' : '0.125rem',
                }}>
                  {/* Avatar */}
                  <div style={{ width: 30, flexShrink: 0, paddingTop: showAvatar ? 2 : 0 }}>
                    {showAvatar ? (
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${c1}, ${c2})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.66rem', fontWeight: 700, color: 'white',
                        boxShadow: `0 2px 10px ${c1}44`,
                      }}>
                        {msg.username[0]?.toUpperCase()}
                      </div>
                    ) : null}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {showAvatar && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.18rem' }}>
                        <span className="ty-chat-username">{msg.username}</span>
                        <span className="ty-chat-time">{formatTime(msg.time)}</span>
                        {isLast && msg.status && <MessageStatus status={msg.status} />}
                      </div>
                    )}
                    {msg.type === 'file' ? (
                      <FileCardBody msg={msg} onCancel={onCancelFile} />
                    ) : (
                      <p className="ty-chat-message" style={{ marginTop: 0 }}>{msg.text}</p>
                    )}
                  </div>
                </div>
              </MessageMotion>
            );
          })}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {typingUsers.map((username) => (
          <TypingIndicator key={username} isVisible username={username} />
        ))}
      </AnimatePresence>

      <div ref={messagesEndRef} />
    </div>
  );
}
