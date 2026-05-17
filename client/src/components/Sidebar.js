import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { StaggerList, StaggerItem, UserJoinMotion } from './MotionWrapper';
import { PulseAvatar, VoiceBar, StreamToggleButton } from './MicroComponents';

// رنگ ثابت بر اساس نام — هماهنگ با ChatArea
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
  // اختیاری — اگه voice activity داری پاس بده
  speakingUsers = [],
  audioStreams = new Map(),
}) {
  return (
    <aside className="w-72 panel-sidebar p-5 flex flex-col gap-6 hidden lg:flex relative z-10">

      {/* ── Online Users ─────────────────────────────────────── */}
      <div>
        <h2 className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-4">
          Online Users
        </h2>

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

                      {/* آواتار با pulse وقتی صحبت می‌کنه */}
                      <PulseAvatar
                        username={u.name}
                        color={color}
                        isSpeaking={isSpeaking}
                        size={30}
                      />

                      {/* نام + وضعیت */}
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-200 text-sm font-medium truncate block">
                          {u.name}
                        </span>
                        {status === 'connecting' && (
                          <span className="text-xs text-yellow-400">connecting…</span>
                        )}
                      </div>

                      {/* نوار صوتی */}
                      {stream && (
                        <VoiceBar stream={stream} isMuted={false} barCount={4} />
                      )}

                      {/* dot وضعیت اتصال */}
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          status === 'connected'
                            ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]'
                            : 'bg-gray-600'
                        }`}
                      />
                    </div>
                  </StaggerItem>
                </UserJoinMotion>
              );
            })}
          </AnimatePresence>

          {otherUsers.length === 0 && (
            <li className="text-gray-500 text-sm italic px-1">No one else is here</li>
          )}
        </StaggerList>
      </div>

      {/* ── Screen Sharing ────────────────────────────────────── */}
      <div>
        <h2 className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-4">
          Screen Sharing
        </h2>

        {activeSharers.length > 0 ? (
          <StaggerList className="space-y-2">
            {activeSharers.map((sharer) => (
              <StaggerItem key={sharer.id}>
                <div className="flex items-center justify-between text-sm px-1">
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    <span className="truncate">{sharer.name}</span>
                  </div>
                  <button
                    onClick={() => onViewShare(sharer.id)}
                    className="text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors ml-2 flex-shrink-0"
                  >
                    View
                  </button>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        ) : (
          <p className="text-gray-500 text-sm italic px-1">No active streams</p>
        )}
      </div>

      {/* ── Share button ──────────────────────────────────────── */}
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