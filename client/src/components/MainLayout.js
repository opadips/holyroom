import React from 'react';
import ParticipantStrip from './ParticipantStrip';
import Stage from './Stage';
import ChatRail from './ChatRail';
import ControlDock from './ControlDock';

export default function MainLayout({
  currentUser,
  usersCount,
  otherUsers,
  connectionStatuses,
  activeSharers,
  socketId,
  isSharing,

  stageId,
  onStageSelect,

  chatOpen,
  unreadCount,
  onToggleChat,

  messages,
  input,
  setInput,
  onSend,
  typingUsers = [],

  isMuted,
  onToggleMute,
  micState,
  onStartShare,
  onStopShare,
  shareSupported,
  shareDisabledTitle,
  qualityLabel,
  qualityTitle,
  onOpenSettings,
  onLeave,

  localStream,
  remoteStreams,
  ownVideoRef,
  videoRefs,
  onFullscreen,
  onOwnFullscreen,
}) {
  const stagedSharer = activeSharers.find((s) => s.id === stageId);

  return (
    <div className="flex flex-col h-screen relative z-10 overflow-hidden">
      <ParticipantStrip
        currentUser={currentUser}
        otherUsers={otherUsers}
        usersCount={usersCount}
        connectionStatuses={connectionStatuses}
        activeSharers={activeSharers}
        socketId={socketId}
        isSharing={isSharing}
        stageId={stageId}
        onStageSelect={onStageSelect}
        chatOpen={chatOpen}
        unreadCount={unreadCount}
        onToggleChat={onToggleChat}
      />

      <div className="flex flex-1 overflow-hidden" style={{ position: 'relative' }}>
        {/* Stage column — dock floats over the stage, never over the rail */}
        <div style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex' }}>
          <Stage
            stageId={stageId}
            sharerName={stagedSharer?.name ?? ''}
            remoteStreams={remoteStreams}
            videoRefs={videoRefs}
            activeSharers={activeSharers}
            isSharing={isSharing}
            localStream={localStream}
            ownVideoRef={ownVideoRef}
            currentUser={currentUser}
            onExpand={stageId ? () => onFullscreen?.(stageId) : undefined}
            onOwnExpand={onOwnFullscreen}
          />
          <ControlDock
            isMuted={isMuted}
            onToggleMute={onToggleMute}
            micState={micState}
            isSharing={isSharing}
            onStartShare={onStartShare}
            onStopShare={onStopShare}
            shareSupported={shareSupported}
            shareDisabledTitle={shareDisabledTitle}
            qualityLabel={qualityLabel}
            qualityTitle={qualityTitle}
            onOpenSettings={onOpenSettings}
            onLeave={onLeave}
          />
        </div>

        {/* Chat rail — static column at lg+, overlay drawer below */}
        {chatOpen && (
          <>
            <div className="rail-backdrop" onClick={onToggleChat} aria-hidden="true" />
            <div className="rail-host">
              <ChatRail
                messages={messages}
                input={input}
                setInput={setInput}
                onSend={onSend}
                typingUsers={typingUsers}
                onCollapse={onToggleChat}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
