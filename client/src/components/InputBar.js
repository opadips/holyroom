import React from 'react';

export default function InputBar({ input, setInput, isMuted, onToggleMute, onSend }) {
  return (
    <div className="p-4 border-t panel-footer flex items-center gap-4 relative z-10">
      <button
        onClick={onToggleMute}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
          isMuted
            ? 'bg-red-600/20 text-red-400 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
            : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-purple-500/30'
        }`}
      >
        {isMuted ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            <line x1="3" y1="3" x2="21" y2="21" strokeWidth={2} />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      <form onSubmit={onSend} className="flex flex-1 gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message #general"
          className="flex-1 input-field"
        />
        <button type="submit" className="px-6 btn-primary text-sm">
          Send
        </button>
      </form>
    </div>
  );
}