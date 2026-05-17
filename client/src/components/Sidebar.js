import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { StaggerList, StaggerItem, UserJoinMotion } from './MotionWrapper';
import { PulseAvatar, VoiceBar, StreamToggleButton } from './MicroComponents';

const USER_COLORS = [
  '#7c3aed', '#6366f1', '#2563eb', '#0891b2', '#7c3aed',
];

function getUserColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return USER_COLORS[h % USER_COLORS.length];
}

export default function Sidebar({
  otherUsers,
  connectionStatuses,
  activeSharers,
  isSharing,
  onViewShare,
  onStartShare,
  onStopShare,
  speakingUsers = [],
  audioStreams = new Map(),
}) {
  return (
    <aside className="w-72 panel-sidebar p-5 flex flex-col gap-6 hidden lg:flex relative z-10">

      <div>
        <h2 className="ty-sidebar-section mb-4">Online Users</h2>

        <StaggerList className="space-y-1">
          <AnimatePresence>
            {otherUsers.map((u) => {
              const color      = getUserColor(u.name);
              const isSpeaking = speakingUsers.includes(u.id);
              const stream     = audioStreams.get(u.id) ?? null;
              const status     = connectionStatuses[u.id];

              return (
                <UserJoinMotion key={u.id}>
                  <StaggerItem>
                    <div className="flex items-center gap-3 py-1.5 px-1 rounded-lg hover:bg-white/[0.03] transition-colors duration-200">
                      <PulseAvatar
                        username={u.name}
                        color={color}
                        isSpeaking={isSpeaking}
                        size={30}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="ty-sidebar-user ty-truncate block">{u.name}</span>
                        {status === 'connecting' && (
                          <span className="ty-sidebar-status ty-accent--danger">connecting…</span>
                        )}
                      </div>
                      {stream && (
                        <VoiceBar stream={stream} isMuted={false} barCount={4} />
                      )}
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        status === 'connected'
                          ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]'
                          : 'bg-gray-600'
                      }`} />
                    </div>
                  </StaggerItem>
                </UserJoinMotion>
              );
            })}
          </AnimatePresence>

          {otherUsers.length === 0 && (
            <li className="ty-body--sm italic px-1" style={{ color: 'var(--tx-ghost)' }}>
              No one else is here
            </li>
          )}
        </StaggerList>
      </div>

      <div>
        <h2 className="ty-sidebar-section mb-4">Screen Sharing</h2>

        {activeSharers.length > 0 ? (
          <StaggerList className="space-y-2">
            {activeSharers.map((sharer) => (
              <StaggerItem key={sharer.id}>
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse flex-shrink-0" />
                    <span className="ty-sidebar-user ty-truncate">{sharer.name}</span>
                  </div>
                  <button
                    onClick={() => onViewShare(sharer.id)}
                    className="ty-btn--sm ty-accent hover:opacity-70 transition-opacity ml-2 flex-shrink-0"
                  >
                    View
                  </button>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        ) : (
          <p className="ty-body--sm italic px-1" style={{ color: 'var(--tx-ghost)' }}>
            No active streams
          </p>
        )}
      </div>

      <div className="mt-auto">
        <StreamToggleButton
          isSharing={isSharing}
          onStart={onStartShare}
          onStop={onStopShare}
        />
      </div>

    </aside>
  );
}