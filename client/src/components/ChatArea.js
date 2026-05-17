import React, { useRef, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageMotion } from './MotionWrapper';
import { TypingIndicator, MessageStatus, LoadingSkeleton } from './MicroComponents';

// رنگ‌های آواتار بر اساس نام کاربر
const AVATAR_COLORS = [
  'from-purple-500 to-blue-500',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-indigo-500 to-violet-500',
  'from-purple-600 to-pink-500',
];

function getAvatarColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash += username.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function ChatArea({ messages, isLoading = false, typingUsers = [] }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">

      {/* Skeleton loading — وقتی history داره لود میشه */}
      {isLoading && (
        <div className="space-y-5 pt-2">
          {[80, 60, 90, 50].map((w, i) => (
            <div key={i} className="flex gap-3 items-start">
              <LoadingSkeleton width={32} height={32} rounded />
              <div className="space-y-2 flex-1">
                <LoadingSkeleton width={`${w * 0.4}%`} height={11} rounded />
                <LoadingSkeleton width={`${w}%`} height={14} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* پیام‌ها */}
      {!isLoading && (
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <MessageMotion key={msg.id ?? idx}>
              <div className="flex gap-3 group">

                {/* آواتار */}
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(msg.username)} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-purple-500/20`}>
                  {msg.username === 'System' ? 'S' : msg.username[0]?.toUpperCase()}
                </div>

                {/* محتوا */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-white font-semibold text-sm">{msg.username}</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {/* وضعیت ارسال — فقط برای آخرین پیام */}
                    {idx === messages.length - 1 && msg.status && (
                      <MessageStatus status={msg.status} />
                    )}
                  </div>
                  <p className="text-gray-300 mt-0.5 leading-relaxed break-words">{msg.text}</p>
                </div>

              </div>
            </MessageMotion>
          ))}
        </AnimatePresence>
      )}

      {/* Typing indicator — زیر همه پیام‌ها */}
      <AnimatePresence>
        {typingUsers.map((username) => (
          <TypingIndicator key={username} isVisible username={username} />
        ))}
      </AnimatePresence>

      <div ref={messagesEndRef} />
    </div>
  );
}