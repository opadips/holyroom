import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import InputBar from './InputBar';
import ScreenShareBar from './ScreenShareBar';

export default function MainLayout({
  currentUser, usersCount, onSettingsClick, onLeave,
  otherUsers, connectionStatuses, activeSharers, isSharing,
  onViewShare, onDisconnectView, viewingSharers,
  onStartShare, onStopShare,
  messages, input, setInput, isMuted, onToggleMute, onSend,
  localStream, remoteStreams, ownVideoRef, videoRefs, socketId,
  onFullscreen, onOwnFullscreen,
  speakingUsers = [], audioStreams = new Map(), typingUsers = [],
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
          onDisconnectView={onDisconnectView}
          viewingSharers={viewingSharers}
          onStartShare={onStartShare}
          onStopShare={onStopShare}
          speakingUsers={speakingUsers}
          audioStreams={audioStreams}
        />

        <main className="flex flex-col flex-1 overflow-hidden">
          {/* Screen share strip */}
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

          {/* Chat channel header */}
          <div style={{
            padding: '0.6rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            borderBottom: '1px solid rgba(124,107,240,0.07)',
            background: 'rgba(8,8,20,0.40)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--tx-ghost)', flexShrink: 0 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span style={{ color: 'var(--tx-tertiary)', fontSize: '0.8rem', fontWeight: 500 }}>general</span>
            <div style={{ flex: 1 }} />
            <span style={{ color: 'var(--tx-ghost)', fontSize: '0.72rem' }}>{messages.length} messages</span>
          </div>

          <ChatArea messages={messages} typingUsers={typingUsers} />

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
