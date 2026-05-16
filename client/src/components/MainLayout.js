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
    <div className="h-screen flex flex-col overflow-hidden holy-bg text-white relative">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-purple-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-900/10 rounded-full blur-3xl" />
      </div>
      <div className="particles" />

      <Header
        currentUser={currentUser}
        usersCount={usersCount}
        onSettingsClick={onSettingsClick}
        onLeave={onLeave}
      />
      <div className="flex flex-1 overflow-hidden relative z-10">
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