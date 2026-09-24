/**
 * WebRTC Audio Service for Live Voice Chat
 * Handles AudioContext unlocking, mobile autoplay policies, STUN/TURN configuration,
 * and remote audio playback element management.
 */

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // Google Public STUN
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Cloudflare STUN
    { urls: 'stun:stun.cloudflare.com:3478' },
    // Twilio Global STUN
    { urls: 'stun:global.stun.twilio.com:3478' },
    // Mozilla STUN
    { urls: 'stun:stun.services.mozilla.com' },
    // Open Relay TURN servers for symmetric NAT / 4G / 5G / Wi-Fi traversal
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
        'turns:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelay',
      credential: 'openrelay',
    },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

let sharedAudioContext: AudioContext | null = null;
const remoteAudioElements = new Map<string, HTMLAudioElement>();
const remoteAudioSourceNodes = new Map<string, MediaStreamAudioSourceNode>();
let globalInteractionAttached = false;

/**
 * Ensures the Web Audio pipeline is unlocked for mobile browsers (iOS Safari / Android Chrome)
 * Must be triggered during user gestures (clicks, taps, joining room/mic).
 */
export const unlockAudioContext = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return false;

    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioCtx();
    }

    if (sharedAudioContext.state === 'suspended') {
      await sharedAudioContext.resume();
      console.log('[LiveAudio:Context] Shared AudioContext resumed successfully.');
    }

    // Play a 1-sample silent buffer to unlock the hardware output pipeline on iOS Safari
    const buffer = sharedAudioContext.createBuffer(1, 1, 22050);
    const source = sharedAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(sharedAudioContext.destination);
    source.start(0);

    // Also trigger resume on all currently existing remote audio elements
    resumeAllRemoteAudio();

    return true;
  } catch (err) {
    console.warn('[LiveAudio:Context] AudioContext unlock error:', err);
    return false;
  }
};

/**
 * Resumes playback on all registered remote audio elements and AudioContext
 */
export const resumeAllRemoteAudio = () => {
  if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }

  remoteAudioElements.forEach((audioEl, peerId) => {
    if (audioEl) {
      audioEl.muted = false;
      audioEl.defaultMuted = false;
      audioEl.volume = 1.0;
      if (audioEl.paused) {
        audioEl.play()
          .then(() => {
            console.log(`[LiveAudio:Playback] Successfully resumed audio for peer ${peerId}`);
          })
          .catch((e) => {
            console.warn(`[LiveAudio:Playback] Could not resume audio for peer ${peerId}:`, e.message);
          });
      }
    }
  });
};

/**
 * Attaches global user gesture listeners to unlock media as soon as the user touches the screen
 */
export const setupGlobalMediaUnlock = () => {
  if (typeof window === 'undefined' || globalInteractionAttached) return;
  globalInteractionAttached = true;

  const onUserGesture = () => {
    unlockAudioContext().catch(() => {});
    resumeAllRemoteAudio();
  };

  window.addEventListener('click', onUserGesture, { passive: true });
  window.addEventListener('touchstart', onUserGesture, { passive: true });
  window.addEventListener('touchend', onUserGesture, { passive: true });
  window.addEventListener('pointerdown', onUserGesture, { passive: true });
};

/**
 * Safely requests a high-quality VoIP microphone stream with echo cancellation and noise suppression
 */
export const requestMicrophoneStream = async (): Promise<MediaStream> => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const error = new Error('Microphone access is not supported by this browser.');
    console.error('[LiveAudio:Permission] Error:', error.message);
    throw error;
  }

  // First unlock the audio context so audio routing works on mobile
  await unlockAudioContext();

  console.log('[LiveAudio:Permission] Requesting microphone stream with voice-optimized constraints...');

  const constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: { ideal: true },
      noiseSuppression: { ideal: true },
      autoGainControl: { ideal: true },
      channelCount: 1,
      sampleRate: 48000,
      ...({ latency: { ideal: 0.01 } } as any),
    },
    video: false,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const tracks = stream.getAudioTracks();
    if (tracks.length === 0) {
      throw new Error('No audio tracks returned from getUserMedia.');
    }

    console.log(`[LiveAudio:Stream] Microphone stream acquired successfully. Track label: "${tracks[0].label}" (ID: ${tracks[0].id})`);
    return stream;
  } catch (err: any) {
    // If strict constraints failed, try fallback with simple audio: true
    try {
      console.warn('[LiveAudio:Permission] Retrying with generic audio constraints...');
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      return fallbackStream;
    } catch (fallbackErr: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        console.error('[LiveAudio:Permission:Denied] Microphone permission was denied by user or browser policy.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        console.error('[LiveAudio:Permission:NotFound] No microphone device was found on this system.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        console.error('[LiveAudio:Permission:Busy] Microphone is already in use by another tab or application.');
      } else {
        console.error('[LiveAudio:Permission:Error]', err.name, err.message);
      }
      throw err;
    }
  }
};

/**
 * Attaches a remote MediaStream to a dedicated HTML5 <audio> element.
 * Uses safe offscreen styling instead of display:none (which pauses playback on iOS Safari).
 */
export const playRemoteAudioTrack = (peerId: string, stream: MediaStream, explicitTrack?: MediaStreamTrack): HTMLAudioElement => {
  if (explicitTrack && !stream.getTracks().some(t => t.id === explicitTrack.id)) {
    try {
      stream.addTrack(explicitTrack);
    } catch (e) {}
  }

  const tracks = stream.getAudioTracks();
  console.log(`[LiveAudio:Playback] Attaching remote audio stream for peer ${peerId}. Track count: ${tracks.length}`);

  // Ensure all incoming audio tracks are enabled and unmuted
  tracks.forEach(track => {
    track.enabled = true;
  });

  let audioEl = remoteAudioElements.get(peerId);

  if (!audioEl) {
    audioEl = document.createElement('audio');
    audioEl.id = `remote-audio-${peerId}`;
    audioEl.autoplay = true;
    (audioEl as any).playsInline = true;
    audioEl.setAttribute('playsinline', 'true');
    audioEl.setAttribute('webkit-playsinline', 'true');
    audioEl.muted = false;
    audioEl.defaultMuted = false;
    audioEl.volume = 1.0;

    // Use offscreen fixed positioning rather than display: none
    // (display:none breaks audio playback in iOS Safari and mobile WebKit)
    audioEl.style.position = 'fixed';
    audioEl.style.top = '-9999px';
    audioEl.style.left = '-9999px';
    audioEl.style.width = '1px';
    audioEl.style.height = '1px';
    audioEl.style.opacity = '0.01';
    audioEl.style.pointerEvents = 'none';

    document.body.appendChild(audioEl);
    remoteAudioElements.set(peerId, audioEl);
  }

  // Explicitly ensure element is unmuted, has playsInline, and full volume
  audioEl.autoplay = true;
  (audioEl as any).playsInline = true;
  audioEl.setAttribute('playsinline', 'true');
  audioEl.setAttribute('webkit-playsinline', 'true');
  audioEl.muted = false;
  audioEl.defaultMuted = false;
  audioEl.volume = 1.0;

  // Track ID comparison: if new tracks arrived or srcObject differs, re-bind srcObject
  const currentSrc = audioEl.srcObject as MediaStream | null;
  const currentTrackIds = currentSrc ? currentSrc.getAudioTracks().map(t => t.id).sort().join(',') : '';
  const newTrackIds = tracks.map(t => t.id).sort().join(',');

  if (!audioEl.srcObject || audioEl.srcObject !== stream || currentTrackIds !== newTrackIds) {
    console.log(`[LiveAudio:Playback] Updating srcObject for peer ${peerId} (tracks: ${tracks.length})`);
    audioEl.srcObject = stream;
  }

  const triggerSafePlay = () => {
    if (!audioEl) return;
    audioEl.muted = false;
    audioEl.defaultMuted = false;
    audioEl.volume = 1.0;
    try {
      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`[LiveAudio:Playback] Audio playing successfully for peer ${peerId}`);
          })
          .catch(err => {
            console.warn(`[LiveAudio:Playback] Autoplay blocked for peer ${peerId}. Will resume on next user gesture:`, err.message);
          });
      }
    } catch (e: any) {
      console.warn(`[LiveAudio:Playback] Play trigger exception for peer ${peerId}:`, e.message);
    }
  };

  audioEl.onloadedmetadata = () => {
    triggerSafePlay();
  };

  audioEl.oncanplay = () => {
    triggerSafePlay();
  };

  // Listen to track unmute event: when first RTP packets arrive from remote peer
  tracks.forEach(track => {
    track.enabled = true;

    track.onunmute = () => {
      console.log(`[LiveAudio:Playback] Remote track unmuted for peer ${peerId}. Playing audio.`);
      triggerSafePlay();
    };

    // If track is already unmuted when attached, trigger immediate play attempt
    if (!track.muted) {
      triggerSafePlay();
    }
  });

  // Route remote stream through Web Audio destination for instant mobile speaker output
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
        sharedAudioContext = new AudioCtx();
      }
      if (sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume().catch(() => {});
      }
      const existingNode = remoteAudioSourceNodes.get(peerId);
      if (existingNode) {
        try { existingNode.disconnect(); } catch (e) {}
        remoteAudioSourceNodes.delete(peerId);
      }
      if (tracks.length > 0) {
        const sourceNode = sharedAudioContext.createMediaStreamSource(stream);
        sourceNode.connect(sharedAudioContext.destination);
        remoteAudioSourceNodes.set(peerId, sourceNode);
        console.log(`[LiveAudio:Playback] Connected Web Audio stream to hardware destination for peer ${peerId}`);
      }
    }
  } catch (e: any) {
    console.warn(`[LiveAudio:Playback] Web Audio output routing fallback: ${e.message}`);
  }

  // Attempt immediate playback
  triggerSafePlay();

  // Also setup fallback gesture unlock in case browser policy blocked initial attempt
  const onUserUnlock = () => {
    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
    if (audioEl) {
      audioEl.muted = false;
      audioEl.defaultMuted = false;
      audioEl.volume = 1.0;
      audioEl.play().catch(() => {});
    }
    window.removeEventListener('click', onUserUnlock);
    window.removeEventListener('touchstart', onUserUnlock);
    window.removeEventListener('touchend', onUserUnlock);
    window.removeEventListener('keydown', onUserUnlock);
  };

  window.addEventListener('click', onUserUnlock, { once: true, passive: true });
  window.addEventListener('touchstart', onUserUnlock, { once: true, passive: true });
  window.addEventListener('touchend', onUserUnlock, { once: true, passive: true });
  window.addEventListener('keydown', onUserUnlock, { once: true, passive: true });

  return audioEl;
};

/**
 * Cleans up remote audio element when a peer leaves the room
 */
export const stopRemoteAudio = (peerId: string) => {
  const sourceNode = remoteAudioSourceNodes.get(peerId);
  if (sourceNode) {
    try { sourceNode.disconnect(); } catch (e) {}
    remoteAudioSourceNodes.delete(peerId);
  }

  const audioEl = remoteAudioElements.get(peerId);
  if (audioEl) {
    console.log(`[LiveAudio:Playback] Removing audio element for peer ${peerId}`);
    try {
      audioEl.pause();
      audioEl.srcObject = null;
      if (audioEl.parentNode) {
        audioEl.parentNode.removeChild(audioEl);
      }
    } catch (e) {
      console.warn(`[LiveAudio:Playback] Error stopping audio for peer ${peerId}:`, e);
    }
    remoteAudioElements.delete(peerId);
  }
};

/**
 * Cleans up all remote audio elements when unmounting or leaving room
 */
export const cleanupAllRemoteAudio = () => {
  console.log('[LiveAudio:Playback] Cleaning up all remote audio elements');
  remoteAudioSourceNodes.forEach((node) => {
    try { node.disconnect(); } catch (e) {}
  });
  remoteAudioSourceNodes.clear();

  remoteAudioElements.forEach((audioEl, peerId) => {
    try {
      audioEl.pause();
      audioEl.srcObject = null;
      if (audioEl.parentNode) {
        audioEl.parentNode.removeChild(audioEl);
      }
    } catch (e) {}
  });
  remoteAudioElements.clear();
};
