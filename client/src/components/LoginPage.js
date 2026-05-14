import React from 'react';

export default function LoginPage({ username, setUsername, joining, handleJoin }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black elegant-bg">
      <div className="backdrop-blur-xl border rounded-2xl p-10 w-full max-w-md shadow-2xl elegant-card">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white text-center mb-2">Holyroom</h1>
        <p className="text-gray-400 text-center mb-8">Enter a display name to join</p>
        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            autoFocus
            disabled={joining}
          />
          <button
            type="submit"
            disabled={joining}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joining ? 'Accessing microphone...' : 'Join Holyroom'}
          </button>
        </form>
      </div>
    </div>
  );
}