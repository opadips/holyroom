import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import { useWebRTC } from './hooks/useWebRTC';
import LoginPage from './components/LoginPage';
import MainLayout from './components/MainLayout';
import SettingsPanel from './components/SettingsPanel';
import NotificationBar from './components/NotificationBar';
import AtmosphericBackground from './components/AtmosphericBackground';
import AmbientLight from './components/AmbientLight';
import CinematicFocus from './components/CinematicFocus';
import { PageTransition, ModalMotion } from './components/MotionWrapper';

// ── Server URL resolution ────────────────────────────────────
// Priority:
//   1. REACT_APP_SERVER_URL in .env (requires restart after change)
//   2. GET /server-info  — server reports its own LAN IP at runtime
//   3. Same hostname as the page, port 3001
async function resolveServerURL() {
  // 1. Explicit override via .env
  if (process.env.REACT_APP_SERVER_URL) {
    const url = process.env.REACT_APP_SERVER_URL.replace(/\/+$/, ''); // strip trailing slash
    console.log('[Holyroom] Server URL from .env:', url);
    return url;
  }

  // 2. Ask the server itself — works for LAN without any config
  try {
    const infoURL = `${window.location.protocol}//${window.location.hostname}:3001/server-info`;
    const res  = await fetch(infoURL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`/server-info returned ${res.status}`);
    const { ip, port } = await res.json();
    const url = `${window.location.protocol}//${ip}:${port}`;
    console.log('[Holyroom] Server URL from /server-info:', url);
    return url;
  } catch (err) {
    console.warn('[Holyroom] /server-info fetch failed:', err.message);
  }

  // 3. Last resort
  const fallback = `${window.location.protocol}//${window.location.hostname}:3001`;
  console.log('[Holyroom] Server URL fallback:', fallback);
  return fallback;
}

const PRESET_OPTIONS = [
  { key: 'high',   width: 3840, height: 2160, fps: 60, label: '4K 60fps'    },
  { key: 'medium', width: 1920, height: 1080, fps: 30, label: '1080p 30fps' },
  { key: 'low',    width: 1280, height: 720,  fps: 15, label: '720p 15fps'  },
  { key: 'custom', width: 1920, height: 1080, fps: 30, label: 'Custom'      },
];

export default function App() {
  const [username, setUsername]               = useState('');
  const [joining, setJoining]                 = useState(false);
  const [joined, setJoined]                   = useState(false);
  const [currentUser, setCurrentUser]         = useState('');
  const [messages, setMessages]               = useState([]);
  const [users, setUsers]                     = useState([]);
  const [input, setInput]                     = useState('');
  const [notification, setNotification]       = useState('');
  const [qualityPreset, setQualityPreset]     = useState('high');
  const [customQuality, setCustomQuality]     = useState({ width: 1920, height: 1080, fps: 30 });
  const [settingsOpen, setSettingsOpen]       = useState(false);
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const [focusedStream, setFocusedStream]     = useState(null);
  const [focusedSharer, setFocusedSharer]     = useState('');

  // sharerId که منتظر stream هستیم
  const pendingFocusRef = useRef(null);

  const socketRef   = useRef(null);
  const ownVideoRef = useRef(null);
  const videoRefs   = useRef(new Map());

  const effectiveQuality =
    qualityPreset === 'custom'
      ? { ...customQuality, label: 'Custom' }
      : PRESET_OPTIONS.find((p) => p.key === qualityPreset) || PRESET_OPTIONS[0];

  const {
    activeSharers, isSharing, localStream, isMuted, remoteStreams,
    viewingSharers,
    stopSharing, viewShare, disconnectView, startVoiceCapture, toggleMute,
    handleNewUser, handleNewViewer, handleOffer, handleAnswer, handleIceCandidate,
    handleAudioOffer, handleAudioAnswer, handleAudioIceCandidate,
    handleUserStartedSharing, handleUserStoppedSharing,
    setActiveSharers, setLocalStreamManually, setSharingState, reset,
  } = useWebRTC(socketRef, effectiveQuality);

  // وقتی remoteStreams آپدیت میشه، اگه pending focus داریم باز می‌کنیم
  useEffect(() => {
    const id = pendingFocusRef.current;
    if (!id) return;
    const stream = remoteStreams.get(id);
    if (stream) {
      const sharer = activeSharers.find((s) => s.id === id);
      setFocusedStream(stream);
      setFocusedSharer(sharer?.name ?? '');
      pendingFocusRef.current = null;
    }
  }, [remoteStreams, activeSharers]);

  useEffect(() => {
    if (!joined) return;

    // destroyed tracks whether the effect was cleaned up before the promise resolved
    let destroyed = false;
    let socket;

    resolveServerURL().then((url) => {
      if (destroyed) return; // effect already cleaned up — bail out

      socket = io(url);
      socketRef.current = socket;
      socket.emit('join', currentUser);

      socket.on('messageHistory', setMessages);
      socket.on('newMessage',     (msg) => setMessages((prev) => [...prev, msg]));
      socket.on('userList',       setUsers);
      socket.on('activeSharers',  setActiveSharers);
      socket.on('error',          (err) => { alert(err); setJoined(false); });
      socket.on('userStartedSharing', (sharer) => {
        handleUserStartedSharing(sharer);
        setNotification(`${sharer.name} is now sharing screen`);
      });
      socket.on('userStoppedSharing', (sharer) => {
        handleUserStoppedSharing(sharer);
        setNotification(`${sharer.name} stopped sharing`);
        setFocusedStream((prev) => {
          if (prev && remoteStreams.get(sharer.id) === prev) return null;
          return prev;
        });
        if (pendingFocusRef.current === sharer.id) {
          pendingFocusRef.current = null;
        }
      });
      socket.on('newViewer',               ({ viewerId, viewerName }) => handleNewViewer(viewerId, viewerName));
      socket.on('webrtcOffer',             ({ from, offer })          => handleOffer(from, offer));
      socket.on('webrtcAnswer',            ({ from, answer })         => handleAnswer(from, answer));
      socket.on('webrtcIceCandidate',      ({ from, candidate })      => handleIceCandidate(from, candidate));
      socket.on('newUser',                 (user)                     => handleNewUser(user));
      socket.on('webrtcAudioOffer',        ({ from, offer })          => handleAudioOffer(from, offer));
      socket.on('webrtcAudioAnswer',       ({ from, answer })         => handleAudioAnswer(from, answer));
      socket.on('webrtcAudioIceCandidate', ({ from, candidate })      => handleAudioIceCandidate(from, candidate));
      socket.on('connectionStatus',        ({ id, status }) =>
        setConnectionStatuses((prev) => ({ ...prev, [id]: status }))
      );
    });

    return () => {
      destroyed = true;
      reset();
      if (socket) socket.disconnect();
    };
  }, [
    joined, currentUser,
    handleNewUser, handleNewViewer, handleOffer, handleAnswer, handleIceCandidate,
    handleAudioOffer, handleAudioAnswer, handleAudioIceCandidate,
    handleUserStartedSharing, handleUserStoppedSharing, setActiveSharers, reset,
  ]);

  useEffect(() => {
    if (ownVideoRef.current)
      ownVideoRef.current.srcObject = isSharing && localStream ? localStream : null;
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
    setFocusedStream(null);
    setFocusedSharer('');
    pendingFocusRef.current = null;
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

  // برای remote streams:
  // اگه stream از قبل آماده‌ست مستقیم باز کن
  // اگه نه، viewShare صدا بزن و منتظر remoteStreams آپدیت بمون
  const handleOpenFocus = useCallback((sharerId) => {
    const existing = remoteStreams.get(sharerId);
    const sharer   = activeSharers.find((s) => s.id === sharerId);

    if (existing) {
      setFocusedStream(existing);
      setFocusedSharer(sharer?.name ?? '');
    } else {
      // stream هنوز نیومده — viewShare بزن و منتظر بمون
      pendingFocusRef.current = sharerId;
      viewShare(sharerId);
    }
  }, [remoteStreams, activeSharers, viewShare]);

  const handleDisconnectView = useCallback((sharerId) => {
    disconnectView(sharerId);
    setFocusedStream((prev) => {
      const stream = remoteStreams.get(sharerId);
      if (prev && stream === prev) return null;
      return prev;
    });
    setFocusedSharer((prev) => {
      const sharer = activeSharers.find((s) => s.id === sharerId);
      if (sharer && prev === sharer.name) return '';
      return prev;
    });
    if (pendingFocusRef.current === sharerId) {
      pendingFocusRef.current = null;
    }
  }, [disconnectView, remoteStreams, activeSharers]);

  // برای own stream
  const handleOpenOwnFocus = useCallback(() => {
    if (!localStream) return;
    setFocusedStream(localStream);
    setFocusedSharer(currentUser);
  }, [localStream, currentUser]);

  const otherUsers = users.filter((u) => u.id !== socketRef.current?.id);

  return (
    <>
      <AtmosphericBackground />
      <AmbientLight />

      <AnimatePresence mode="wait">
        {!joined ? (
          <PageTransition key="login">
            <LoginPage
              username={username}
              setUsername={setUsername}
              joining={joining}
              handleJoin={handleJoin}
            />
          </PageTransition>
        ) : (
          <PageTransition key="main">
            <MainLayout
              currentUser={currentUser}
              usersCount={users.length}
              onSettingsClick={() => setSettingsOpen((prev) => !prev)}
              onLeave={handleLeave}
              otherUsers={otherUsers}
              connectionStatuses={connectionStatuses}
              activeSharers={activeSharers}
              isSharing={isSharing}
              onViewShare={handleOpenFocus}
              onDisconnectView={handleDisconnectView}
              viewingSharers={viewingSharers}
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
              onFullscreen={handleOpenFocus}
              onOwnFullscreen={handleOpenOwnFocus}
            />
          </PageTransition>
        )}
      </AnimatePresence>

      <ModalMotion
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      >
        <SettingsPanel
          qualityPreset={qualityPreset}
          setQualityPreset={setQualityPreset}
          customQuality={customQuality}
          setCustomQuality={setCustomQuality}
          onClose={() => setSettingsOpen(false)}
        />
      </ModalMotion>

      <NotificationBar message={notification} onClose={() => setNotification('')} />

      <AnimatePresence>
        {focusedStream && (
          <CinematicFocus
            key="cinematic-focus"
            stream={focusedStream}
            sharerName={focusedSharer}
            onClose={() => {
              setFocusedStream(null);
              setFocusedSharer('');
            }}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />
        )}
      </AnimatePresence>
    </>
  );
}