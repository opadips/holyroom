import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import InputBar from './InputBar';
import ScreenShareBar from './ScreenShareBar';

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
  onOwnFullscreen,
  speakingUsers = [],
  audioStreams = new Map(),
  typingUsers = [],
}) {
  return (
    <div className="flex flex-col h-screen relative z-10 overflow-hidden">

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
          speakingUsers={speakingUsers}
          audioStreams={audioStreams}
        />

        <main className="flex flex-col flex-1 overflow-hidden">

          <ScreenShareBar
            activeSharers={activeSharers}
            remoteStreams={remoteStreams}
            localStream={localStream}
            isSharing={isSharing}
            currentUser={currentUser}
            videoRefs={videoRefs}
            ownVideoRef={ownVideoRef}
            socketId={socketId}
            onFullscreen={onFullscreen}
            onOwnFullscreen={onOwnFullscreen}
          />

          <ChatArea
            messages={messages}
            typingUsers={typingUsers}
          />

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