import { useRef, useCallback, useState } from 'react';

const servers = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function useWebRTC(socketRef, quality) {
  // Screen sharing — split by direction so stopSharing() can close only the
  // PCs where this client is the SHARER, never its own view of someone else.
  const screenSendPCs = useRef(new Map()); // I am the sharer -> viewers (carries local tracks)
  const screenRecvPCs = useRef(new Map()); // viewer me <- sharer (receive-only)
  const audioPeerConnections = useRef(new Map());
  // File transfer: 'files' data channels riding the voice PCs' SCTP association.
  // One channel per peer, created by the offerer before createOffer so the
  // m=application line rides the existing webrtcAudio* signaling (no renegotiation).
  const fileChannels = useRef(new Map()); // peerId -> RTCDataChannel
  const fileChannelHandlerRef = useRef(null); // set by useFileTransfer: (peerId, dc) => void
  // Shares this client currently WANTS to receive — gates handleOffer so a
  // late offer after unviewShare cannot silently re-subscribe.
  const viewingIntent = useRef(new Set());

  const [activeSharers, setActiveSharers] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [localStream, setLocalStream] = useState(null);
  const [localAudioStream, setLocalAudioStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const localStreamRef = useRef(null);
  const localAudioStreamRef = useRef(null);
  const isMutedRef = useRef(false);
  const audioElements = useRef(new Map());

  // ── Screen: sharer -> viewer (send) ─────────────────────────
  const createSendPC = useCallback(
    (viewerId) => {
      const pc = new RTCPeerConnection(servers);
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtcIceCandidate', {
            to: viewerId,
            candidate: event.candidate,
          });
        }
      };
      pc.onconnectionstatechange = () => {
        if (socketRef.current) {
          socketRef.current.emit('connectionStatus', { id: viewerId, status: pc.connectionState });
        }
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          pc.close();
          screenSendPCs.current.delete(viewerId);
        }
      };
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }
      screenSendPCs.current.set(viewerId, pc);
      return pc;
    },
    [socketRef]
  );

  // ── Screen: viewer <- sharer (recv, receive-only) ───────────
  const createRecvPC = useCallback(
    (sharerId) => {
      const pc = new RTCPeerConnection(servers);
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtcRecvIceCandidate', {
            to: sharerId,
            candidate: event.candidate,
          });
        }
      };
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          setRemoteStreams((prev) => new Map(prev).set(sharerId, stream));
        }
      };
      pc.onconnectionstatechange = () => {
        if (socketRef.current) {
          socketRef.current.emit('connectionStatus', { id: sharerId, status: pc.connectionState });
        }
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          pc.close();
          screenRecvPCs.current.delete(sharerId);
          setRemoteStreams((prev) => {
            if (!prev.has(sharerId)) return prev;
            const next = new Map(prev);
            next.delete(sharerId);
            return next;
          });
        }
      };
      screenRecvPCs.current.set(sharerId, pc);
      return pc;
    },
    [socketRef]
  );

  const attachFileChannel = useCallback((peerId, dc) => {
    dc.bufferedAmountLowThreshold = 4 * 1024 * 1024;
    fileChannels.current.set(peerId, dc);
    dc.addEventListener('close', () => {
      if (fileChannels.current.get(peerId) === dc) fileChannels.current.delete(peerId);
    });
    fileChannelHandlerRef.current?.(peerId, dc);
  }, []);

  // useFileTransfer registers a handler; late registrations replay existing channels.
  const registerFileChannelHandler = useCallback((fn) => {
    fileChannelHandlerRef.current = fn;
    if (fn) {
      fileChannels.current.forEach((dc, peerId) => {
        if (dc.readyState !== 'closed') fn(peerId, dc);
      });
    }
  }, []);

  const startVoiceCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localAudioStreamRef.current = stream;
      setLocalAudioStream(stream);
      isMutedRef.current = false;
      setIsMuted(false);
      return stream;
    } catch (err) {
      console.error('Microphone access denied', err);
      throw err;
    }
  }, []);

  const stopVoiceCapture = useCallback(() => {
    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getTracks().forEach((track) => track.stop());
      localAudioStreamRef.current = null;
      setLocalAudioStream(null);
    }
    audioPeerConnections.current.forEach((pc) => pc.close());
    audioPeerConnections.current.clear();
    audioElements.current.forEach((audio) => {
      audio.srcObject = null;
    });
    audioElements.current.clear();
  }, []);

  const toggleMute = useCallback(() => {
    if (localAudioStreamRef.current) {
      const enabled = !isMutedRef.current;
      localAudioStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !enabled;
      });
      isMutedRef.current = enabled;
      setIsMuted(enabled);
    }
  }, []);

  // Stops MY outgoing share only — PCs where I am viewing someone else survive.
  const stopSharing = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('stopScreenShare');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    screenSendPCs.current.forEach((pc) => pc.close());
    screenSendPCs.current.clear();
    setIsSharing(false);
    setLocalStream(null);
  }, [socketRef]);

  const viewShare = useCallback(
    (sharerId) => {
      if (!socketRef.current) return;
      viewingIntent.current.add(sharerId);
      socketRef.current.emit('joinScreenShare', { sharerId });
    },
    [socketRef]
  );

  const unviewShare = useCallback(
    (sharerId) => {
      viewingIntent.current.delete(sharerId);
      if (socketRef.current) {
        socketRef.current.emit('leaveScreenShare', { sharerId });
      }
      const pc = screenRecvPCs.current.get(sharerId);
      if (pc) {
        pc.close();
        screenRecvPCs.current.delete(sharerId);
      }
      setRemoteStreams((prev) => {
        if (!prev.has(sharerId)) return prev;
        const next = new Map(prev);
        next.delete(sharerId);
        return next;
      });
    },
    [socketRef]
  );

  const hasRecvPC = useCallback((sharerId) => screenRecvPCs.current.has(sharerId), []);

  // ── Screen: sharer side ─────────────────────────────────────
  const handleNewViewer = useCallback(
    (viewerId, viewerName) => {
      // Idempotent: a repeated joinScreenShare (A->B->A switch) means any
      // existing PC for this viewer is stale — close it before recreating.
      const existing = screenSendPCs.current.get(viewerId);
      if (existing) {
        existing.close();
        screenSendPCs.current.delete(viewerId);
      }
      const pc = createSendPC(viewerId);
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (socketRef.current) {
            socketRef.current.emit('webrtcOffer', {
              to: viewerId,
              offer: pc.localDescription,
            });
          }
        })
        .catch(console.error);
    },
    [socketRef, createSendPC]
  );

  const handleViewerLeft = useCallback((viewerId) => {
    const pc = screenSendPCs.current.get(viewerId);
    if (pc) {
      pc.close();
      screenSendPCs.current.delete(viewerId);
    }
  }, []);

  // ── Screen: viewer side ─────────────────────────────────────
  const handleOffer = useCallback(
    (from, offer) => {
      // Drop offers for shares we no longer want (offer-after-leave race).
      if (!viewingIntent.current.has(from)) return;
      // An offer only ever originates from a fresh newViewer, so any existing
      // recv PC here is stale — close and recreate to stay idempotent.
      const existing = screenRecvPCs.current.get(from);
      if (existing) {
        existing.close();
        screenRecvPCs.current.delete(from);
      }
      const pc = createRecvPC(from);
      pc.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => pc.createAnswer())
        .then((answer) => pc.setLocalDescription(answer))
        .then(() => {
          if (socketRef.current) {
            socketRef.current.emit('webrtcAnswer', {
              to: from,
              answer: pc.localDescription,
            });
          }
        })
        .catch(console.error);
    },
    [socketRef, createRecvPC]
  );

  // Answer arrives at the SHARER (send PC).
  const handleAnswer = useCallback((from, answer) => {
    const pc = screenSendPCs.current.get(from);
    if (pc && pc.signalingState === 'have-local-offer') {
      pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(console.error);
    }
  }, []);

  // ICE from the sharer -> my recv PC.
  const handleIceCandidate = useCallback((from, candidate) => {
    const pc = screenRecvPCs.current.get(from);
    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
    }
  }, []);

  // ICE from a viewer -> my send PC to that viewer.
  const handleRecvIceCandidate = useCallback((from, candidate) => {
    const pc = screenSendPCs.current.get(from);
    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
    }
  }, []);

  const handleUserStartedSharing = useCallback((sharer) => {
    setActiveSharers((prev) => {
      const exists = prev.find((s) => s.id === sharer.id);
      return exists ? prev : [...prev, sharer];
    });
  }, []);

  const handleUserStoppedSharing = useCallback((sharer) => {
    setActiveSharers((prev) => prev.filter((s) => s.id !== sharer.id));
    viewingIntent.current.delete(sharer.id);
    const pc = screenRecvPCs.current.get(sharer.id);
    if (pc) {
      pc.close();
      screenRecvPCs.current.delete(sharer.id);
    }
    setRemoteStreams((prev) => {
      if (!prev.has(sharer.id)) return prev;
      const next = new Map(prev);
      next.delete(sharer.id);
      return next;
    });
  }, []);

  // ── Voice mesh (unchanged) ──────────────────────────────────
  const createAudioPeerConnection = useCallback(
    (partnerId, initiator = false) => {
      const pc = new RTCPeerConnection(servers);
      // Initiator creates the channel BEFORE createOffer so the offer carries
      // the m=application (SCTP) line; the answerer receives it via ondatachannel.
      if (initiator) {
        attachFileChannel(partnerId, pc.createDataChannel('files', { ordered: true }));
      }
      pc.ondatachannel = (event) => attachFileChannel(partnerId, event.channel);
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtcAudioIceCandidate', {
            to: partnerId,
            candidate: event.candidate,
          });
        }
      };
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          const existing = audioElements.current.get(partnerId);
          if (existing) {
            existing.srcObject = stream;
          } else {
            const audio = new Audio();
            audio.srcObject = stream;
            audio.autoplay = true;
            audioElements.current.set(partnerId, audio);
          }
        }
      };
      pc.onconnectionstatechange = () => {
        if (socketRef.current) {
          socketRef.current.emit('connectionStatus', { id: partnerId, status: pc.connectionState });
        }
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          pc.close();
          audioPeerConnections.current.delete(partnerId);
          const audio = audioElements.current.get(partnerId);
          if (audio) {
            audio.srcObject = null;
            audioElements.current.delete(partnerId);
          }
        }
      };
      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localAudioStreamRef.current);
        });
      }
      audioPeerConnections.current.set(partnerId, pc);
      return pc;
    },
    [socketRef, attachFileChannel]
  );

  const handleNewUser = useCallback(
    (user) => {
      if (user.id === socketRef.current?.id) return;
      const pc = createAudioPeerConnection(user.id, true);
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (socketRef.current) {
            socketRef.current.emit('webrtcAudioOffer', {
              to: user.id,
              offer: pc.localDescription,
            });
          }
        })
        .catch(console.error);
    },
    [socketRef, createAudioPeerConnection]
  );

  const handleAudioOffer = useCallback(
    (from, offer) => {
      let pc = audioPeerConnections.current.get(from);
      if (!pc) {
        pc = createAudioPeerConnection(from);
      }
      pc.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => pc.createAnswer())
        .then((answer) => pc.setLocalDescription(answer))
        .then(() => {
          if (socketRef.current) {
            socketRef.current.emit('webrtcAudioAnswer', {
              to: from,
              answer: pc.localDescription,
            });
          }
        })
        .catch(console.error);
    },
    [socketRef, createAudioPeerConnection]
  );

  const handleAudioAnswer = useCallback((from, answer) => {
    const pc = audioPeerConnections.current.get(from);
    if (pc && pc.signalingState === 'have-local-offer') {
      pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(console.error);
    }
  }, []);

  const handleAudioIceCandidate = useCallback((from, candidate) => {
    const pc = audioPeerConnections.current.get(from);
    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
    }
  }, []);

  const reset = useCallback(() => {
    stopVoiceCapture();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    screenSendPCs.current.forEach((pc) => pc.close());
    screenSendPCs.current.clear();
    screenRecvPCs.current.forEach((pc) => pc.close());
    screenRecvPCs.current.clear();
    audioPeerConnections.current.forEach((pc) => pc.close());
    audioPeerConnections.current.clear();
    audioElements.current.forEach((audio) => {
      audio.srcObject = null;
    });
    audioElements.current.clear();
    fileChannels.current.clear();
    viewingIntent.current.clear();
    setActiveSharers([]);
    setIsSharing(false);
    setLocalStream(null);
    setLocalAudioStream(null);
    setRemoteStreams(new Map());
    setIsMuted(false);
  }, [stopVoiceCapture]);

  const setLocalStreamManually = useCallback((stream) => {
    localStreamRef.current = stream;
    setLocalStream(stream);
  }, []);

  const setSharingState = useCallback((val) => {
    setIsSharing(val);
  }, []);

  return {
    activeSharers,
    isSharing,
    localStream,
    isMuted,
    remoteStreams,
    startVoiceCapture,
    toggleMute,
    stopSharing,
    viewShare,
    unviewShare,
    hasRecvPC,
    handleNewUser,
    handleNewViewer,
    handleViewerLeft,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleRecvIceCandidate,
    handleAudioOffer,
    handleAudioAnswer,
    handleAudioIceCandidate,
    handleUserStartedSharing,
    handleUserStoppedSharing,
    setActiveSharers,
    setLocalStreamManually,
    setSharingState,
    reset,
    fileChannels,
    registerFileChannelHandler,
  };
}
