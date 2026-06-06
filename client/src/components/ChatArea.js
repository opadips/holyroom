import React, { useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageMotion } from './MotionWrapper';
import { TypingIndicator, MessageStatus, LoadingSkeleton } from './MicroComponents';

const AVATAR_COLORS = [
  ['#7c6bf0', '#9d8ff7'],
  ['#6366f1', '#818cf8'],
  ['#2563eb', '#60a5fa'],
  ['#7c3aed', '#a78bfa'],
  ['#6a5adf', '#8b7af2'],
];

function getAvatarColors(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash += username.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatArea({ messages, isLoading = false, typingUsers = [] }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  return (
    <div
      className="flex-1 overflow-y-auto relative z-10"
      style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0' }}
    >
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
                    <p className="ty-chat-message" style={{ marginTop: 0 }}>{msg.text}</p>
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
