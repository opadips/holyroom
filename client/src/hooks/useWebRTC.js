import { useRef, useCallback, useState } from 'react';

const servers = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function useWebRTC(socketRef, quality) {
  const peerConnections = useRef(new Map());
  const audioPeerConnections = useRef(new Map());
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

  const createPeerConnection = useCallback(
    (partnerId) => {
      const pc = new RTCPeerConnection(servers);
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtcIceCandidate', {
            to: partnerId,
            candidate: event.candidate,
          });
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
          peerConnections.current.delete(partnerId);
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.delete(partnerId);
            return next;
          });
        }
      };
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          setRemoteStreams((prev) => new Map(prev).set(partnerId, stream));
        }
      };
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }
      peerConnections.current.set(partnerId, pc);
      return pc;
    },
    [socketRef]
  );

  const createAudioPeerConnection = useCallback(
    (partnerId) => {
      const pc = new RTCPeerConnection(servers);
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
    [socketRef]
  );

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

  const stopSharing = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('stopScreenShare');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    setIsSharing(false);
    setLocalStream(null);
    setRemoteStreams(new Map());
  }, [socketRef]);

  const viewShare = useCallback(
    (sharerId) => {
      if (!socketRef.current) return;
      socketRef.current.emit('joinScreenShare', { sharerId });
    },
    [socketRef]
  );

  const handleNewViewer = useCallback(
    (viewerId, viewerName) => {
      const pc = createPeerConnection(viewerId);
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
    [socketRef, createPeerConnection]
  );

  const handleOffer = useCallback(
    (from, offer) => {
      let pc = peerConnections.current.get(from);
      if (!pc) {
        pc = createPeerConnection(from);
      }
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
    [socketRef, createPeerConnection]
  );

  const handleAnswer = useCallback((from, answer) => {
    const pc = peerConnections.current.get(from);
    if (pc && pc.signalingState === 'have-local-offer') {
      pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(console.error);
    }
  }, []);

  const handleIceCandidate = useCallback((from, candidate) => {
    const pc = peerConnections.current.get(from);
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
    const pc = peerConnections.current.get(sharer.id);
    if (pc) {
      pc.close();
      peerConnections.current.delete(sharer.id);
    }
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(sharer.id);
      return next;
    });
  }, []);

  const handleNewUser = useCallback(
    (user) => {
      if (user.id === socketRef.current?.id) return;
      const pc = createAudioPeerConnection(user.id);
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
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    audioPeerConnections.current.forEach((pc) => pc.close());
    audioPeerConnections.current.clear();
    audioElements.current.forEach((audio) => {
      audio.srcObject = null;
    });
    audioElements.current.clear();
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
  };
}