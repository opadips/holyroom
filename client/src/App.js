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

const SHARE_UNSUPPORTED_TITLE =
  'Screen sharing needs HTTPS or localhost in a supported browser';

function trackQualityLabel(s) {
  if (!s || !s.height || !s.width) return '';
  const fps = Math.round(s.frameRate || 0);
  const byHeight = { 2160: '4K', 1440: '1440p', 1080: '1080p', 720: '720p' };
  const base = byHeight[s.height] || `${s.width}×${s.height}`;
  return fps ? `${base} ${fps}fps` : base;
}

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

  // Stage-first layout state
  const [stageId, setStageId]                 = useState(null);
  const [chatOpen, setChatOpen]               = useState(true);
  const [unreadCount, setUnreadCount]         = useState(0);
  const [micState, setMicState]               = useState('ready'); // insecure|denied|nodevice|ready
  const [myId, setMyId]                       = useState('');
  const [liveQualityLabel, setLiveQualityLabel] = useState('');
  const [qualityHint, setQualityHint]         = useState('');

  // sharerId که منتظر stream هستیم
  const pendingFocusRef = useRef(null);

  const socketRef   = useRef(null);
  const ownVideoRef = useRef(null);
  const videoRefs   = useRef(new Map());

  // Ref mirrors for socket handlers (registered once, must read latest state)
  const chatOpenRef   = useRef(chatOpen);
  const focusedIdRef  = useRef(null); // sharer id of focused remote share, or 'own'
  const viewedRef     = useRef(new Set()); // share ids we currently intend to receive
  useEffect(() => { chatOpenRef.current = chatOpen; }, [chatOpen]);

  const effectiveQuality =
    qualityPreset === 'custom'
      ? { ...customQuality, label: `${customQuality.height}p ${customQuality.fps}fps` }
      : PRESET_OPTIONS.find((p) => p.key === qualityPreset) || PRESET_OPTIONS[0];

  const {
    activeSharers, isSharing, localStream, isMuted, remoteStreams,
    stopSharing, viewShare, unviewShare, hasRecvPC,
    startVoiceCapture, toggleMute,
    handleNewUser, handleNewViewer, handleViewerLeft,
    handleOffer, handleAnswer, handleIceCandidate, handleRecvIceCandidate,
    handleAudioOffer, handleAudioAnswer, handleAudioIceCandidate,
    handleUserStartedSharing, handleUserStoppedSharing,
    setActiveSharers, setLocalStreamManually, setSharingState, reset,
  } = useWebRTC(socketRef, effectiveQuality);

  const shareSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function';

  // ── Stage fallback: staged sharer gone → first other active sharer / null ──
  useEffect(() => {
    if (!joined) return;
    setStageId((prev) => {
      if (prev && activeSharers.some((s) => s.id === prev)) return prev;
      const next = activeSharers.find((s) => s.id !== myId);
      return next ? next.id : null;
    });
  }, [activeSharers, joined, myId]);

  // ── Staged-only subscription reconciler ─────────────────────
  // staged → subscribed; un-staged → unsubscribed.
  useEffect(() => {
    if (!joined) return;

    // Unsubscribe shares that are no longer staged
    viewedRef.current.forEach((id) => {
      if (id !== stageId) {
        viewedRef.current.delete(id);
        unviewShare(id);
      }
    });

    // Subscribe the staged share
    if (stageId && !viewedRef.current.has(stageId)) {
      viewedRef.current.add(stageId);
      viewShare(stageId);
    }
  }, [joined, stageId, viewShare, unviewShare]);

  // Watchdog: staged share without a live recv PC → re-subscribe (self-heal)
  useEffect(() => {
    if (!joined || !stageId) return undefined;
    const iv = setInterval(() => {
      if (!hasRecvPC(stageId)) {
        viewedRef.current.add(stageId);
        viewShare(stageId);
      }
    }, 2500);
    return () => clearInterval(iv);
  }, [joined, stageId, hasRecvPC, viewShare]);

  // وقتی remoteStreams آپدیت میشه، اگه pending focus داریم باز می‌کنیم
  useEffect(() => {
    const id = pendingFocusRef.current;
    if (!id) return;
    const stream = remoteStreams.get(id);
    if (stream) {
      const sharer = activeSharers.find((s) => s.id === id);
      setFocusedStream(stream);
      setFocusedSharer(sharer?.name ?? '');
      focusedIdRef.current = id;
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
      socket.on('connect', () => setMyId(socket.id));
      socket.emit('join', currentUser);

      socket.on('messageHistory', setMessages);
      socket.on('newMessage',     (msg) => {
        setMessages((prev) => [...prev, msg]);
        if (
          !chatOpenRef.current &&
          msg.username !== 'System' &&
          msg.username !== currentUser
        ) {
          setUnreadCount((c) => c + 1);
        }
      });
      socket.on('userList',       setUsers);
      socket.on('activeSharers',  setActiveSharers);
      socket.on('error',          (err) => { alert(err); setJoined(false); });
      socket.on('userStartedSharing', (sharer) => {
        handleUserStartedSharing(sharer);
        setNotification(
          sharer.id === socket.id
            ? 'You are now sharing your screen'
            : `${sharer.name} is now sharing screen`
        );
      });
      socket.on('userStoppedSharing', (sharer) => {
        handleUserStoppedSharing(sharer);
        viewedRef.current.delete(sharer.id);
        if (focusedIdRef.current === sharer.id) {
          setFocusedStream(null);
          setFocusedSharer('');
          focusedIdRef.current = null;
        }
        if (pendingFocusRef.current === sharer.id) {
          pendingFocusRef.current = null;
        }
        setNotification(
          sharer.id === socket.id
            ? 'You stopped sharing your screen'
            : `${sharer.name} stopped sharing`
        );
      });
      socket.on('newViewer',               ({ viewerId, viewerName }) => handleNewViewer(viewerId, viewerName));
      socket.on('viewerLeft',              ({ viewerId })             => handleViewerLeft(viewerId));
      socket.on('webrtcOffer',             ({ from, offer })          => handleOffer(from, offer));
      socket.on('webrtcAnswer',            ({ from, answer })         => handleAnswer(from, answer));
      socket.on('webrtcIceCandidate',      ({ from, candidate })      => handleIceCandidate(from, candidate));
      socket.on('webrtcRecvIceCandidate',  ({ from, candidate })      => handleRecvIceCandidate(from, candidate));
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
    handleNewUser, handleNewViewer, handleViewerLeft,
    handleOffer, handleAnswer, handleIceCandidate, handleRecvIceCandidate,
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

  // ── Quality chip honesty ────────────────────────────────────
  // Live label while sharing (track.getSettings), selected preset when idle.
  useEffect(() => {
    if (!isSharing || !localStream) {
      setLiveQualityLabel('');
      return undefined;
    }
    const track = localStream.getVideoTracks()[0];
    if (!track) return undefined;
    const read = () => setLiveQualityLabel(trackQualityLabel(track.getSettings()));
    read();
    track.addEventListener('unmute', read);
    return () => track.removeEventListener('unmute', read);
  }, [isSharing, localStream]);

  // Preset changed mid-share → applyConstraints, hint on failure/mismatch.
  useEffect(() => {
    if (!isSharing || !localStream) {
      setQualityHint('');
      return undefined;
    }
    const track = localStream.getVideoTracks()[0];
    if (!track) return undefined;
    let cancelled = false;
    const want = effectiveQuality;
    track
      .applyConstraints({
        width:  { ideal: want.width },
        height: { ideal: want.height },
        frameRate: { ideal: want.fps },
      })
      .then(() => {
        if (cancelled) return;
        const s = track.getSettings();
        const mismatch =
          s.height && want.height && Math.abs(s.height - want.height) / want.height > 0.15;
        setQualityHint(mismatch ? `Selected ${want.label} applies to the next share` : '');
      })
      .catch(() => {
        if (!cancelled) setQualityHint(`Selected ${want.label} applies to the next share`);
      });
    return () => { cancelled = true; };
  }, [isSharing, localStream, effectiveQuality]);

  // ── Keyboard shortcuts (App level, typing-guarded) ──────────
  useEffect(() => {
    if (!joined) return undefined;
    const isTypingTarget = (t) => {
      const tag = t?.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!t?.isContentEditable;
    };
    const onKey = (e) => {
      if (e.repeat || isTypingTarget(e.target)) return;
      if (e.key === 'm' || e.key === 'M') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) toggleMute();
      } else if (e.key === 'Escape') {
        // Focus overlay owns Escape while open (it registers its own handler)
        if (document.body.classList.contains('cinematic-focus-open')) return;
        if (settingsOpen) { setSettingsOpen(false); return; }
        setChatOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [joined, toggleMute, settingsOpen]);

  const handleJoin = async (e) => {
    e.preventDefault();
    const clean = username.trim();
    if (!clean) return;
    setJoining(true);

    let mic = 'ready';
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      mic = 'insecure'; // skip the attempt entirely
    } else {
      try {
        await startVoiceCapture();
      } catch (err) {
        const name = err?.name;
        mic = (name === 'NotFoundError' || name === 'OverconstrainedError')
          ? 'nodevice'
          : 'denied';
      }
    }
    setMicState(mic);
    if (mic === 'insecure') {
      setNotification('Microphone needs HTTPS or localhost. Joining without voice.');
    } else if (mic === 'denied') {
      setNotification('Microphone access denied. You can still join, but voice will not work.');
    } else if (mic === 'nodevice') {
      setNotification('No microphone found. You can still join, but voice will not work.');
    }

    setCurrentUser(clean);
    setJoined(true);
    setJoining(false);
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
    focusedIdRef.current = null;
    pendingFocusRef.current = null;
    viewedRef.current.clear();
    setStageId(null);
    setChatOpen(true);
    setUnreadCount(0);
    setQualityHint('');
  };

  const startSharingWithQuality = async () => {
    if (!socketRef.current || !shareSupported) return;
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
        selfBrowserSurface: 'exclude',
      });
      setLocalStreamManually(stream);
      socketRef.current.emit('startScreenShare');
      setSharingState(true);
      stream.getVideoTracks()[0].onended = () => stopSharing();
    } catch (err) {
      console.error(err);
    }
  };

  // Stage expand → CinematicFocus over an already-subscribed stream.
  // If the stream isn't there yet, stage it; pendingFocus opens focus when it lands.
  const handleOpenFocus = useCallback((sharerId) => {
    const existing = remoteStreams.get(sharerId);
    const sharer   = activeSharers.find((s) => s.id === sharerId);

    if (existing) {
      setFocusedStream(existing);
      setFocusedSharer(sharer?.name ?? '');
      focusedIdRef.current = sharerId;
    } else {
      pendingFocusRef.current = sharerId;
      setStageId(sharerId);
    }
  }, [remoteStreams, activeSharers]);

  // برای own stream
  const handleOpenOwnFocus = useCallback(() => {
    if (!localStream) return;
    setFocusedStream(localStream);
    setFocusedSharer(currentUser);
    focusedIdRef.current = 'own';
  }, [localStream, currentUser]);

  const handleCloseFocus = useCallback(() => {
    setFocusedStream(null);
    setFocusedSharer('');
    focusedIdRef.current = null;
  }, []);

  const handleStageSelect = useCallback((id) => {
    setStageId(id);
  }, []);

  const handleToggleChat = useCallback(() => {
    setChatOpen((prev) => {
      if (!prev) setUnreadCount(0); // clearing on open
      return !prev;
    });
  }, []);

  const otherUsers = users.filter((u) => u.id !== myId);
  const currentLabel = liveQualityLabel || effectiveQuality.label;

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
              onLeave={handleLeave}
              otherUsers={otherUsers}
              connectionStatuses={connectionStatuses}
              activeSharers={activeSharers}
              socketId={myId}
              isSharing={isSharing}
              stageId={stageId}
              onStageSelect={handleStageSelect}
              chatOpen={chatOpen}
              unreadCount={unreadCount}
              onToggleChat={handleToggleChat}
              onStartShare={startSharingWithQuality}
              onStopShare={stopSharing}
              shareSupported={shareSupported}
              shareDisabledTitle={SHARE_UNSUPPORTED_TITLE}
              qualityLabel={currentLabel}
              qualityTitle={qualityHint || `Share quality: ${currentLabel}`}
              onOpenSettings={() => setSettingsOpen(true)}
              messages={messages}
              input={input}
              setInput={setInput}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              micState={micState}
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
            muted={focusedIdRef.current === 'own'}
            onClose={handleCloseFocus}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />
        )}
      </AnimatePresence>
    </>
  );
}
