import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserJoinBadge } from './MicroComponents';
import { spring } from './motion';

function parseNotification(message) {
  if (!message) return { type: 'info', username: null, text: message };
  const joinMatch  = message.match(/^(.+?) joined$/);
  const leaveMatch = message.match(/^(.+?) left$/);
  const shareMatch = message.match(/^(.+?) (is now sharing screen|stopped sharing)$/);
  if (joinMatch)  return { type: 'join',  username: joinMatch[1], text: message };
  if (leaveMatch) return { type: 'leave', username: null,         text: message };
  if (shareMatch) return { type: 'share', username: null,         text: message };
  return { type: 'info', username: null, text: message };
}

const TYPE_CONFIG = {
  join:  { dot: '#34d399', dotGlow: 'rgba(52,211,153,0.5)' },
  leave: { dot: '#6b7280', dotGlow: 'transparent' },
  share: { dot: '#9d8ff7', dotGlow: 'rgba(157,143,247,0.5)', pulse: true },
  info:  { dot: '#60a5fa', dotGlow: 'rgba(96,165,250,0.4)' },
};

export default function NotificationBar({ message, onClose }) {
  const { type, username, text } = parseNotification(message);
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          style={{
            position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)',
            zIndex: 40, display: 'flex', alignItems: 'center',
          }}
          initial={{ opacity: 0, y: -14, scale: 0.95, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0,   scale: 1,    filter: 'blur(0px)' }}
          exit={{    opacity: 0, y: -10, scale: 0.97, filter: 'blur(4px)' }}
          transition={spring.soft}
        >
          {type === 'join' && username ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserJoinBadge username={username} />
              <button
                onClick={onClose}
                style={{
                  width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none',
                  cursor: 'pointer', color: 'var(--tx-tertiary)', fontSize: '0.875rem',
                }}
              >×</button>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              padding: '0.55rem 1rem',
              background: 'rgba(10,10,24,0.82)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '999px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: cfg.dot,
                boxShadow: `0 0 8px ${cfg.dotGlow}`,
                animation: cfg.pulse ? 'pulse 2s infinite' : 'none',
              }} />
              <span className="ty-notification">{text}</span>
              <button
                onClick={onClose}
                style={{
                  width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none',
                  cursor: 'pointer', color: 'var(--tx-tertiary)', fontSize: '0.8rem',
                  marginLeft: '0.25rem',
                }}
              >×</button>
            </div>
          )}
        </motion.div>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </AnimatePresence>
  );
}
