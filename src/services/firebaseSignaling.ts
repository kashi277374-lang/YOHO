/**
 * Firebase Firestore Real-Time Signaling Service for WebRTC Voice Chat
 * Provides reliable, serverless signaling for peer discovery, SDP offer/answer exchange,
 * and ICE candidate exchange using the liveRooms/{roomId}/signals and liveRooms/{roomId}/members collections.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  addDoc, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { ref as rtdbRef, set as setRtdb, remove as removeRtdb, onDisconnect } from 'firebase/database';
import { db, rtdb } from './firebase';
import { 
  SignalingConnectionStatus, 
  RemoteParticipantPresence, 
  SignalingEventHandler 
} from './websocketSignaling';

class FirebaseSignalingService {
  private currentRoomId: string | null = null;
  private currentUserId: string | null = null;
  private currentUserData: any = null;
  private status: SignalingConnectionStatus = 'disconnected';
  private statusListeners = new Set<(status: SignalingConnectionStatus) => void>();
  private eventListeners = new Map<string, Set<SignalingEventHandler>>();
  private unsubSignals: Unsubscribe | null = null;
  private unsubOffers: Unsubscribe | null = null;
  private unsubAnswers: Unsubscribe | null = null;
  private unsubCandidates: Unsubscribe | null = null;
  private unsubMembers: Unsubscribe | null = null;
  private processedDocIds = new Set<string>();
  private lastSpeakingReportTime = 0;

  public getStatus(): SignalingConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === 'connected';
  }

  public onStatusChange(callback: (status: SignalingConnectionStatus) => void) {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  private setStatus(newStatus: SignalingConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      console.log(`[FirebaseSignaling:Status] ${newStatus}`);
      this.statusListeners.forEach(fn => fn(newStatus));
    }
  }

  public on(eventType: string, handler: SignalingEventHandler) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(handler);
    return () => this.off(eventType, handler);
  }

  public off(eventType: string, handler: SignalingEventHandler) {
    const handlers = this.eventListeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(eventType: string, data: any) {
    const handlers = this.eventListeners.get(eventType);
    if (handlers) {
      handlers.forEach(h => {
        try {
          h(data);
        } catch (e) {
          console.error(`[FirebaseSignaling] Error in handler for ${eventType}:`, e);
        }
      });
    }
  }

  /**
   * Joins a room and starts listening for signals and room member changes in real time.
   */
  public joinRoom(roomId: string, userData: { userId: string; userName: string; userAvatar?: string; role?: string; isMuted?: boolean }) {
    if (!roomId || !userData?.userId) return;

    // Clean up any existing listeners for a previous room
    if (this.currentRoomId && this.currentRoomId !== roomId) {
      this.leaveRoom(this.currentRoomId, this.currentUserId || userData.userId);
    }

    this.currentRoomId = roomId;
    this.currentUserId = userData.userId;
    this.currentUserData = userData;
    this.setStatus('connecting');

    console.log(`[FirebaseSignaling] Joining room ${roomId} as user ${userData.userId} (${userData.userName})`);

    // 1. Register presence in liveRooms/{roomId}/members/{userId}
    const memberRef = doc(db, 'liveRooms', roomId, 'members', userData.userId);
    setDoc(memberRef, {
      userId: userData.userId,
      userName: userData.userName || 'StarLive User',
      userAvatar: userData.userAvatar || '',
      role: userData.role || 'member',
      joinedAt: new Date().toISOString(),
      isMuted: Boolean(userData.isMuted),
      isSpeaking: false,
    }, { merge: true }).catch(err => {
      console.warn('[FirebaseSignaling] Could not set room member presence:', err);
    });

    // 1b. Realtime Database onDisconnect presence setup (if RTDB is available)
    if (rtdb) {
      try {
        const presenceRef = rtdbRef(rtdb, `rooms/${roomId}/participants/${userData.userId}`);
        onDisconnect(presenceRef).remove().catch(() => {});
        setRtdb(presenceRef, {
          userId: userData.userId,
          userName: userData.userName || 'User',
          joinedAt: Date.now(),
          isMuted: Boolean(userData.isMuted)
        }).catch(() => {});
      } catch (e) {
        console.warn('[FirebaseSignaling] RTDB presence setup fallback:', e);
      }
    }

    // 2a. Listen for dedicated WebRTC offers (liveRooms/{roomId}/offers)
    const offersCol = collection(db, 'liveRooms', roomId, 'offers');
    this.unsubOffers = onSnapshot(offersCol, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;
          const data = change.doc.data();
          if (!data || data.fromUserId === this.currentUserId) return;
          if (data.toUserId !== this.currentUserId && data.toUserId !== 'all') return;
          if (this.processedDocIds.has(docId)) return;
          this.processedDocIds.add(docId);

          if (data.timestamp && Date.now() - data.timestamp > 30000) {
            deleteDoc(change.doc.ref).catch(() => {});
            return;
          }

          console.log(`[FirebaseSignaling] Received dedicated WebRTC offer from ${data.fromUserId}`);
          this.emit('offer', {
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            sdp: data.sdp,
            timestamp: data.timestamp,
          });

          // Delete consumed offer
          deleteDoc(change.doc.ref).catch(() => {});
        }
      });
    }, (err) => console.warn('[FirebaseSignaling] Offers snapshot error:', err));

    // 2b. Listen for dedicated WebRTC answers (liveRooms/{roomId}/answers)
    const answersCol = collection(db, 'liveRooms', roomId, 'answers');
    this.unsubAnswers = onSnapshot(answersCol, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;
          const data = change.doc.data();
          if (!data || data.fromUserId === this.currentUserId) return;
          if (data.toUserId !== this.currentUserId && data.toUserId !== 'all') return;
          if (this.processedDocIds.has(docId)) return;
          this.processedDocIds.add(docId);

          if (data.timestamp && Date.now() - data.timestamp > 30000) {
            deleteDoc(change.doc.ref).catch(() => {});
            return;
          }

          console.log(`[FirebaseSignaling] Received dedicated WebRTC answer from ${data.fromUserId}`);
          this.emit('answer', {
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            sdp: data.sdp,
            timestamp: data.timestamp,
          });

          // Delete consumed answer
          deleteDoc(change.doc.ref).catch(() => {});
        }
      });
    }, (err) => console.warn('[FirebaseSignaling] Answers snapshot error:', err));

    // 2c. Listen for dedicated WebRTC candidates (liveRooms/{roomId}/candidates)
    const candidatesCol = collection(db, 'liveRooms', roomId, 'candidates');
    this.unsubCandidates = onSnapshot(candidatesCol, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;
          const data = change.doc.data();
          if (!data || data.fromUserId === this.currentUserId) return;
          if (data.toUserId !== this.currentUserId && data.toUserId !== 'all') return;
          if (this.processedDocIds.has(docId)) return;
          this.processedDocIds.add(docId);

          if (data.timestamp && Date.now() - data.timestamp > 30000) {
            deleteDoc(change.doc.ref).catch(() => {});
            return;
          }

          this.emit('candidate', {
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            candidate: data.candidate,
            timestamp: data.timestamp,
          });

          // Delete consumed candidate
          deleteDoc(change.doc.ref).catch(() => {});
        }
      });
    }, (err) => console.warn('[FirebaseSignaling] Candidates snapshot error:', err));

    // 2d. Listen for signals targeting this user or room (broadcast & backward compatibility)
    const signalsCol = collection(db, 'liveRooms', roomId, 'signals');
    this.unsubSignals = onSnapshot(signalsCol, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;
          const data = change.doc.data();

          if (!data || data.fromUserId === this.currentUserId) return;
          if (data.toUserId !== this.currentUserId && data.toUserId !== 'all') return;

          if (this.processedDocIds.has(docId)) return;
          this.processedDocIds.add(docId);

          // Prevent excessive memory growth in processedDocIds
          if (this.processedDocIds.size > 500) {
            const arr = Array.from(this.processedDocIds);
            this.processedDocIds = new Set(arr.slice(250));
          }

          // Ignore stale signals from older sessions (> 30s)
          if (data.timestamp && Date.now() - data.timestamp > 30000) {
            deleteDoc(change.doc.ref).catch(() => {});
            return;
          }

          // Dispatch signal to listeners
          switch (data.type) {
            case 'offer':
              console.log(`[FirebaseSignaling] Received WebRTC offer from ${data.fromUserId}`);
              this.emit('offer', {
                fromUserId: data.fromUserId,
                toUserId: data.toUserId,
                sdp: data.sdp,
                timestamp: data.timestamp,
              });
              break;

            case 'answer':
              console.log(`[FirebaseSignaling] Received WebRTC answer from ${data.fromUserId}`);
              this.emit('answer', {
                fromUserId: data.fromUserId,
                toUserId: data.toUserId,
                sdp: data.sdp,
                timestamp: data.timestamp,
              });
              break;

            case 'candidate':
              this.emit('candidate', {
                fromUserId: data.fromUserId,
                toUserId: data.toUserId,
                candidate: data.candidate,
                timestamp: data.timestamp,
              });
              break;

            case 'mute-status':
              this.emit('mute-status', {
                userId: data.fromUserId,
                isMuted: data.isMuted,
              });
              break;

            case 'speaking-status':
              this.emit('speaking-status', {
                userId: data.fromUserId,
                isSpeaking: data.isSpeaking,
              });
              break;

            case 'user-left':
              this.emit('user-left', {
                userId: data.fromUserId,
                reason: data.reason || 'left',
              });
              break;

            default:
              break;
          }

          // Delete consumed 1-to-1 targeted signaling messages (offers, answers, candidates)
          if (data.toUserId === this.currentUserId) {
            deleteDoc(change.doc.ref).catch(() => {});
          }
        }
      });
    }, (err) => {
      console.warn('[FirebaseSignaling] Signals snapshot error:', err);
    });

    // 3. Listen for room members (presence tracking)
    const membersCol = collection(db, 'liveRooms', roomId, 'members');
    this.unsubMembers = onSnapshot(membersCol, (snapshot) => {
      const participants: RemoteParticipantPresence[] = [];
      snapshot.forEach(d => {
        const m = d.data();
        participants.push({
          userId: d.id,
          userName: m.userName || 'User',
          userAvatar: m.userAvatar || '',
          role: m.role || 'member',
          joinedAt: m.joinedAt || new Date().toISOString(),
          isMuted: Boolean(m.isMuted),
          isSpeaking: Boolean(m.isSpeaking),
        });
      });

      this.setStatus('connected');
      this.emit('room-state', { participants });

      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' && change.doc.id !== this.currentUserId) {
          const m = change.doc.data();
          this.emit('user-joined', {
            participant: {
              userId: change.doc.id,
              userName: m.userName || 'User',
              userAvatar: m.userAvatar || '',
              role: m.role || 'member',
              joinedAt: m.joinedAt || new Date().toISOString(),
              isMuted: Boolean(m.isMuted),
              isSpeaking: false,
            }
          });
        } else if (change.type === 'removed' && change.doc.id !== this.currentUserId) {
          this.emit('user-left', {
            userId: change.doc.id,
            reason: 'presence_removed',
          });
        }
      });
    }, (err) => {
      console.warn('[FirebaseSignaling] Members snapshot error:', err);
    });
  }

  /**
   * Leaves room and cleans up listeners and member presence.
   */
  public leaveRoom(roomId: string, userId: string) {
    console.log(`[FirebaseSignaling] Leaving room ${roomId} for user ${userId}`);

    if (this.unsubSignals) {
      try { this.unsubSignals(); } catch (e) {}
      this.unsubSignals = null;
    }
    if (this.unsubOffers) {
      try { this.unsubOffers(); } catch (e) {}
      this.unsubOffers = null;
    }
    if (this.unsubAnswers) {
      try { this.unsubAnswers(); } catch (e) {}
      this.unsubAnswers = null;
    }
    if (this.unsubCandidates) {
      try { this.unsubCandidates(); } catch (e) {}
      this.unsubCandidates = null;
    }
    if (this.unsubMembers) {
      try { this.unsubMembers(); } catch (e) {}
      this.unsubMembers = null;
    }

    if (roomId && userId) {
      // Remove presence doc from members subcollection
      const memberRef = doc(db, 'liveRooms', roomId, 'members', userId);
      deleteDoc(memberRef).catch(() => {});

      // Remove RTDB presence if provisioned
      if (rtdb) {
        try {
          const presenceRef = rtdbRef(rtdb, `rooms/${roomId}/participants/${userId}`);
          removeRtdb(presenceRef).catch(() => {});
        } catch (e) {}
      }

      // Broadcast leave signal
      const signalsCol = collection(db, 'liveRooms', roomId, 'signals');
      addDoc(signalsCol, {
        roomId,
        fromUserId: userId,
        toUserId: 'all',
        type: 'user-left',
        reason: 'normal_exit',
        timestamp: Date.now(),
      }).catch(() => {});
    }

    this.setStatus('disconnected');
    this.currentRoomId = null;
    this.currentUserId = null;
    this.currentUserData = null;
  }

  /**
   * Sends an SDP offer to a specific peer.
   * Uses isolated path liveRooms/{roomId}/offers/{toUserId}_{fromUserId} to prevent data collisions.
   */
  public async sendOffer(roomId: string, fromUserId: string, toUserId: string, sdp: RTCSessionDescriptionInit) {
    if (!roomId || !toUserId) return;
    try {
      const offerDocRef = doc(db, 'liveRooms', roomId, 'offers', `${toUserId}_${fromUserId}`);
      const payload = {
        roomId,
        fromUserId,
        toUserId,
        type: 'offer',
        sdp: {
          type: sdp.type,
          sdp: sdp.sdp,
        },
        timestamp: Date.now(),
      };
      await setDoc(offerDocRef, payload);

      // Also send to signals for dual fallback
      const signalsCol = collection(db, 'liveRooms', roomId, 'signals');
      addDoc(signalsCol, payload).catch(() => {});

      console.log(`[FirebaseSignaling] Sent offer to ${toUserId}`);
    } catch (err: any) {
      console.error('[FirebaseSignaling] Error sending offer:', err);
    }
  }

  /**
   * Sends an SDP answer to a specific peer.
   * Uses isolated path liveRooms/{roomId}/answers/{toUserId}_{fromUserId} to prevent data collisions.
   */
  public async sendAnswer(roomId: string, fromUserId: string, toUserId: string, sdp: RTCSessionDescriptionInit) {
    if (!roomId || !toUserId) return;
    try {
      const answerDocRef = doc(db, 'liveRooms', roomId, 'answers', `${toUserId}_${fromUserId}`);
      const payload = {
        roomId,
        fromUserId,
        toUserId,
        type: 'answer',
        sdp: {
          type: sdp.type,
          sdp: sdp.sdp,
        },
        timestamp: Date.now(),
      };
      await setDoc(answerDocRef, payload);

      // Also send to signals for dual fallback
      const signalsCol = collection(db, 'liveRooms', roomId, 'signals');
      addDoc(signalsCol, payload).catch(() => {});

      console.log(`[FirebaseSignaling] Sent answer to ${toUserId}`);
    } catch (err: any) {
      console.error('[FirebaseSignaling] Error sending answer:', err);
    }
  }

  /**
   * Sends an ICE candidate to a specific peer.
   * Uses dedicated collection liveRooms/{roomId}/candidates.
   */
  public async sendCandidate(roomId: string, fromUserId: string, toUserId: string, candidate: RTCIceCandidateInit) {
    if (!roomId || !toUserId) return;
    try {
      const candDocRef = doc(db, 'liveRooms', roomId, 'candidates', `${toUserId}_${fromUserId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
      const payload = {
        roomId,
        fromUserId,
        toUserId,
        type: 'candidate',
        candidate: {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid ?? null,
          sdpMLineIndex: candidate.sdpMLineIndex ?? null,
          usernameFragment: candidate.usernameFragment ?? null,
        },
        timestamp: Date.now(),
      };
      await setDoc(candDocRef, payload);

      // Also send to signals for dual fallback
      const signalsCol = collection(db, 'liveRooms', roomId, 'signals');
      addDoc(signalsCol, payload).catch(() => {});
    } catch (err: any) {
      console.error('[FirebaseSignaling] Error sending candidate:', err);
    }
  }

  /**
   * Sends mute status to all peers in the room.
   */
  public async sendMuteStatus(roomId: string, userId: string, isMuted: boolean) {
    if (!roomId || !userId) return;
    try {
      const signalsCol = collection(db, 'liveRooms', roomId, 'signals');
      await addDoc(signalsCol, {
        roomId,
        fromUserId: userId,
        toUserId: 'all',
        type: 'mute-status',
        isMuted,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.warn('[FirebaseSignaling] Error sending mute status:', err);
    }
  }

  /**
   * Sends speaking status (throttled to max 1 per 600ms).
   */
  public sendSpeakingStatus(roomId: string, userId: string, isSpeaking: boolean) {
    const now = Date.now();
    if (now - this.lastSpeakingReportTime < 600) return;
    this.lastSpeakingReportTime = now;

    if (!roomId || !userId) return;
    try {
      const signalsCol = collection(db, 'liveRooms', roomId, 'signals');
      addDoc(signalsCol, {
        roomId,
        fromUserId: userId,
        toUserId: 'all',
        type: 'speaking-status',
        isSpeaking,
        timestamp: now,
      }).catch(() => {});
    } catch (err) {}
  }

  public close() {
    if (this.currentRoomId && this.currentUserId) {
      this.leaveRoom(this.currentRoomId, this.currentUserId);
    }
  }
}

export const firebaseSignalingService = new FirebaseSignalingService();
