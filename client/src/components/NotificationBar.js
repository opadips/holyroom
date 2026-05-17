import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserJoinBadge } from './MicroComponents';
import { spring, duration, ease } from './motion';

// تشخیص نوع notification برای نمایش مناسب
function parseNotification(message) {
  if (!message) return { type: 'info', username: null, text: message };

  const joinMatch  = message.match(/^(.+?) joined$/);
  const leaveMatch = message.match(/^(.+?) left$/);
  const shareMatch = message.match(/^(.+?) (is now sharing screen|stopped sharing)$/);

  if (joinMatch)  return { type: 'join',  username: joinMatch[1],  text: message };
  if (leaveMatch) return { type: 'leave', username: leaveMatch[1], text: message };
  if (shareMatch) return { type: 'share', username: null,          text: message };

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
          exit={{    opacity: 0, y: -10, scale: 0.97,  filter: 'blur(4px)' }}
          transition={spring.soft}
        >
          {/* join notification → UserJoinBadge */}
          {type === 'join' && username ? (
            <div className="flex items-center gap-2">
              <UserJoinBadge username={username} />
              <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-sm ml-1"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ) : (
            /* بقیه notification‌ها → glass pill */
            <div className={`
              flex items-center gap-3 px-4 py-2.5 rounded-2xl
              backdrop-blur-xl border text-sm font-medium
              shadow-[0_8px_32px_rgba(0,0,0,0.4)]
              ${type === 'leave'
                ? 'bg-black/60 border-white/10 text-gray-300'
                : type === 'share'
                  ? 'bg-black/60 border-purple-500/20 text-purple-200'
                  : 'bg-black/60 border-purple-500/20 text-purple-100'
              }
            `}>
              {/* icon بر اساس نوع */}
              {type === 'leave' && (
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0" />
              )}
              {type === 'share' && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
              )}
              {type === 'info' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              )}

              <span>{text}</span>

              <button
                onClick={onClose}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors ml-1 flex-shrink-0"
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