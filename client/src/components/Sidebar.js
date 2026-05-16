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
    <aside className="w-72 panel-sidebar p-5 flex flex-col gap-6 hidden lg:flex relative z-10">
      <div>
        <h2 className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-4">Online Users</h2>
        <ul className="space-y-2">
          {otherUsers.map((u) => (
            <li key={u.id} className="flex items-center gap-3 text-gray-300 text-sm py-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${connectionStatuses[u.id] === 'connected' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)] animate-pulse' : 'bg-gray-600'}`} />
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
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  {sharer.name}
                </div>
                <button onClick={() => onViewShare(sharer.id)} className="text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors">View</button>
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
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${isSharing ? 'btn-danger' : 'btn-primary'}`}
        >
          {isSharing ? 'Stop Sharing' : 'Start Sharing'}
        </button>
      </div>
    </aside>
  );
}