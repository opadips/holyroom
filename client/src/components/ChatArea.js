import React, { useRef, useEffect } from 'react';

export default function ChatArea({ messages }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
      {messages.map((msg, idx) => (
        <div key={idx} className="flex gap-3 group animate-fadeInUp">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-purple-500/20">
            {msg.username === 'System' ? 'S' : msg.username[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-white font-semibold text-sm">{msg.username}</span>
              <span className="text-gray-500 text-xs">
                {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-gray-300 mt-0.5 leading-relaxed">{msg.text}</p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}