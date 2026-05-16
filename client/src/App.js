import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useWebRTC } from './hooks/useWebRTC';
import LoginPage from './components/LoginPage';
import MainLayout from './components/MainLayout';
import SettingsPanel from './components/SettingsPanel';
import NotificationBar from './components/NotificationBar';
import AtmosphericBackground from './components/AtmosphericBackground';

const SOCKET_URL = `${window.location.protocol}//${window.location.hostname}:3001`;

const PRESET_OPTIONS = [
  { key: 'high', width: 3840, height: 2160, fps: 60, label: '4K 60fps' },
  { key: 'medium', width: 1920, height: 1080, fps: 30, label: '1080p 30fps' },
  { key: 'low', width: 1280, height: 720, fps: 15, label: '720p 15fps' },
  { key: 'custom', width: 1920, height: 1080, fps: 30, label: 'Custom' },
];

export default function App() {
  const [username, setUsername] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [input, setInput] = useState('');
  const [notification, setNotification] = useState('');
  const [qualityPreset, setQualityPreset] = useState('high');
  const [customQuality, setCustomQuality] = useState({ width: 1920, height: 1080, fps: 30 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreenVideo, setFullscreenVideo] = useState(null);
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const socketRef = useRef(null);
  const ownVideoRef = useRef(null);
  const videoRefs = useRef(new Map());

  const effectiveQuality =
    qualityPreset === 'custom'
      ? { ...customQuality, label: 'Custom' }
      : PRESET_OPTIONS.find((p) => p.key === qualityPreset) || PRESET_OPTIONS[0];

  const {
    activeSharers,
    isSharing,
    localStream,
    isMuted,
    remoteStreams,
    stopSharing,
    viewShare,
    startVoiceCapture,
    toggleMute,
    handleNewUser,
    handleNewViewer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleAudioOffer,
    handleAudioAnswer,
    handleAudioIceCandidate,
    handleUserStartedSharing,
    handleUserStoppedSharing,
    setActiveSharers,
    setLocalStreamManually,
    setSharingState,
    reset,
  } = useWebRTC(socketRef, effectiveQuality);

  useEffect(() => {
    if (!joined) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('join', currentUser);

    socket.on('messageHistory', setMessages);
    socket.on('newMessage', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('userList', setUsers);
    socket.on('activeSharers', setActiveSharers);
    socket.on('error', (err) => { alert(err); setJoined(false); });
    socket.on('userStartedSharing', (sharer) => {
      handleUserStartedSharing(sharer);
      setNotification(`${sharer.name} is now sharing screen`);
    });
    socket.on('userStoppedSharing', (sharer) => {
      handleUserStoppedSharing(sharer);
      setNotification(`${sharer.name} stopped sharing`);
    });
    socket.on('newViewer', ({ viewerId, viewerName }) => handleNewViewer(viewerId, viewerName));
    socket.on('webrtcOffer', ({ from, offer }) => handleOffer(from, offer));
    socket.on('webrtcAnswer', ({ from, answer }) => handleAnswer(from, answer));
    socket.on('webrtcIceCandidate', ({ from, candidate }) => handleIceCandidate(from, candidate));
    socket.on('newUser', (user) => handleNewUser(user));
    socket.on('webrtcAudioOffer', ({ from, offer }) => handleAudioOffer(from, offer));
    socket.on('webrtcAudioAnswer', ({ from, answer }) => handleAudioAnswer(from, answer));
    socket.on('webrtcAudioIceCandidate', ({ from, candidate }) => handleAudioIceCandidate(from, candidate));
    socket.on('connectionStatus', ({ id, status }) => {
      setConnectionStatuses((prev) => ({ ...prev, [id]: status }));
    });

    return () => {
      reset();
      socket.disconnect();
    };
  }, [joined, currentUser, handleNewUser, handleNewViewer, handleOffer, handleAnswer, handleIceCandidate, handleAudioOffer, handleAudioAnswer, handleAudioIceCandidate, handleUserStartedSharing, handleUserStoppedSharing, setActiveSharers, reset]);

  useEffect(() => {
    if (ownVideoRef.current) {
      ownVideoRef.current.srcObject = isSharing && localStream ? localStream : null;
    }
  }, [isSharing, localStream]);

  useEffect(() => {
    remoteStreams.forEach((stream, sharerId) => {
      const videoEl = videoRefs.current.get(sharerId);
      if (videoEl) videoEl.srcObject = stream;
    });
  }, [remoteStreams]);

  const handleJoin = async (e) => {
    e.preventDefault();
    const clean = username.trim();
    if (!clean) return;
    setJoining(true);
    try {
      await startVoiceCapture();
      setCurrentUser(clean);
      setJoined(true);
    } catch {
      setNotification('Could not access microphone. You can still join, but voice will not work.');
      setCurrentUser(clean);
      setJoined(true);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = () => {
    socketRef.current?.disconnect();
    reset();
    setJoined(false);
    setUsername('');
    setMessages([]);
    setUsers([]);
  };

  const startSharingWithQuality = async () => {
    if (!socketRef.current) return;
    const q = effectiveQuality;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: q.width },
          height: { ideal: q.height },
          frameRate: { ideal: q.fps },
          cursor: 'always',
        },
        audio: true,
      });
      setLocalStreamManually(stream);
      socketRef.current.emit('startScreenShare');
      setSharingState(true);
      stream.getVideoTracks()[0].onended = () => stopSharing();
    } catch (err) {
      console.error(err);
    }
  };

  const otherUsers = users.filter((u) => u.id !== socketRef.current?.id);

  if (!joined) {
    return (
      <>
        {/* پس‌زمینه سینماتیک — روی هر دو صفحه Login و Main نمایش داده می‌شه */}
        <AtmosphericBackground />
        <LoginPage
          username={username}
          setUsername={setUsername}
          joining={joining}
          handleJoin={handleJoin}
        />
      </>
    );
  }

  return (
    <>
      {/* پس‌زمینه سینماتیک — fixed است و زیر همه لایه‌ها قرار می‌گیره */}
      <AtmosphericBackground />

      <MainLayout
        currentUser={currentUser}
        usersCount={users.length}
        onSettingsClick={() => setSettingsOpen((prev) => !prev)}
        onLeave={handleLeave}
        otherUsers={otherUsers}
        connectionStatuses={connectionStatuses}
        activeSharers={activeSharers}
        isSharing={isSharing}
        onViewShare={viewShare}
        onStartShare={startSharingWithQuality}
        onStopShare={stopSharing}
        messages={messages}
        input={input}
        setInput={setInput}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onSend={(e) => {
          e.preventDefault();
          if (input.trim() && socketRef.current) {
            socketRef.current.emit('sendMessage', input);
            setInput('');
          }
        }}
        localStream={localStream}
        remoteStreams={remoteStreams}
        ownVideoRef={ownVideoRef}
        videoRefs={videoRefs}
        socketId={socketRef.current?.id}
        onFullscreen={setFullscreenVideo}
      />

      {settingsOpen && (
        <SettingsPanel
          qualityPreset={qualityPreset}
          setQualityPreset={setQualityPreset}
          customQuality={customQuality}
          setCustomQuality={setCustomQuality}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <NotificationBar message={notification} onClose={() => setNotification('')} />

      {fullscreenVideo && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setFullscreenVideo(null)}
        >
          <video
            ref={(el) => el && (el.srcObject = fullscreenVideo)}
            autoPlay
            playsInline
            className="max-w-full max-h-full"
          />
          <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"
            onClick={() => setFullscreenVideo(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}