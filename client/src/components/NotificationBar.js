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

export default function NotificationBar({ message, onClose }) {
  const { type, username, text } = parseNotification(message);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center"
          initial={{ opacity: 0, y: -16, scale: 0.95, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0,   scale: 1,    filter: 'blur(0px)' }}
          exit={{    opacity: 0, y: -10, scale: 0.97, filter: 'blur(4px)' }}
          transition={spring.soft}
        >
          {type === 'join' && username ? (
            <div className="flex items-center gap-2">
              <UserJoinBadge username={username} />
              <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors ty-meta"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ) : (
            <div className={`
              flex items-center gap-3 px-4 py-2.5 rounded-2xl
              backdrop-blur-xl border
              shadow-[0_8px_32px_rgba(0,0,0,0.4)]
              ${type === 'leave'
                ? 'bg-black/60 border-white/10'
                : 'bg-black/60 border-purple-500/20'
              }
            `}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                type === 'leave' ? 'bg-gray-500' :
                type === 'share' ? 'bg-purple-400 animate-pulse' :
                'bg-blue-400'
              }`} />
              <span className="ty-notification">{text}</span>
              <button
                onClick={onClose}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors ml-1 flex-shrink-0 ty-meta"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}