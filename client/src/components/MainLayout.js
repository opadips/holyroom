import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ScreenShareBar from './ScreenShareBar';
import ChatArea from './ChatArea';
import InputBar from './InputBar';

export default function MainLayout({
  currentUser,
  usersCount,
  onSettingsClick,
  onLeave,
  otherUsers,
  connectionStatuses,
  activeSharers,
  isSharing,
  onViewShare,
  onStartShare,
  onStopShare,
  messages,
  input,
  setInput,
  isMuted,
  onToggleMute,
  onSend,
  localStream,
  remoteStreams,
  ownVideoRef,
  videoRefs,
  socketId,
  onFullscreen,
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-black elegant-bg text-white">
      <Header
        currentUser={currentUser}
        usersCount={usersCount}
        onSettingsClick={onSettingsClick}
        onLeave={onLeave}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          otherUsers={otherUsers}
          connectionStatuses={connectionStatuses}
          activeSharers={activeSharers}
          isSharing={isSharing}
          onViewShare={onViewShare}
          onStartShare={onStartShare}
          onStopShare={onStopShare}
        />
        <main className="flex-1 flex flex-col">
          <ScreenShareBar
            activeSharers={activeSharers}
            isSharing={isSharing}
            localStream={localStream}
            remoteStreams={remoteStreams}
            ownVideoRef={ownVideoRef}
            videoRefs={videoRefs}
            socketId={socketId}
            onFullscreen={onFullscreen}
          />
          <ChatArea messages={messages} />
          <InputBar
            input={input}
            setInput={setInput}
            isMuted={isMuted}
            onToggleMute={onToggleMute}
            onSend={onSend}
          />
        </main>
      </div>
    </div>
  );
}