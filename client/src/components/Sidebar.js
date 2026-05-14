import React from 'react';

export default function Sidebar({
  otherUsers,
  connectionStatuses,
  activeSharers,
  isSharing,
  onViewShare,
  onStartShare,
  onStopShare,
}) {
  return (
    <aside className="w-72 backdrop-blur-xl border-r p-5 flex flex-col gap-6 hidden lg:flex elegant-sidebar">
      <div>
        <h2 className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-4">Online Users</h2>
        <ul className="space-y-2">
          {otherUsers.map((u) => (
            <li key={u.id} className="flex items-center gap-3 text-gray-300 text-sm py-1.5">
              <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_6px_rgba(74,222,128,0.5)] ${connectionStatuses[u.id] === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
              {u.name}
              {connectionStatuses[u.id] === 'connecting' && (
                <span className="text-xs text-yellow-400 ml-auto">connecting...</span>
              )}
            </li>
          ))}
          {otherUsers.length === 0 && (
            <li className="text-gray-500 text-sm italic">No one else is here</li>
          )}
        </ul>
      </div>

      <div>
        <h2 className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-4">Screen Sharing</h2>
        {activeSharers.length > 0 ? (
          <ul className="space-y-2">
            {activeSharers.map((sharer) => (
              <li key={sharer.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                  {sharer.name}
                </div>
                <button
                  onClick={() => onViewShare(sharer.id)}
                  className="text-purple-400 hover:text-purple-300 text-xs font-medium"
                >
                  View
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm italic">No active streams</p>
        )}
      </div>

      <div className="mt-auto">
        <button
          onClick={isSharing ? onStopShare : onStartShare}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
            isSharing
              ? 'bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20'
          }`}
        >
          {isSharing ? 'Stop Sharing' : 'Start Sharing'}
        </button>
      </div>
    </aside>
  );
}