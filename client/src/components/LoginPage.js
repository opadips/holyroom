import React from 'react';

export default function LoginPage({ username, setUsername, joining, handleJoin }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 holy-bg relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="particles" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="glass p-10 flex flex-col items-center animate-fadeInUp">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-6 animate-pulse-glow">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white text-center mb-2 tracking-tight">Holyroom</h1>
          <p className="text-gray-400 text-center mb-8 text-sm">Enter a display name to join</p>

          <form onSubmit={handleJoin} className="w-full space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              className="w-full input-field"
              autoFocus
              disabled={joining}
            />
            <button
              type="submit"
              disabled={joining}
              className="w-full btn-primary py-4 text-sm"
            >
              {joining ? 'Accessing microphone...' : 'Join Holyroom'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}