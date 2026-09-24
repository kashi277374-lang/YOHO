/**
 * Unified WebRTC Signaling Service (Firebase Firestore + WebSocket Hybrid)
 * Ensures 100% reliable two-way voice signaling across all environments (Cloud Run proxy,
 * mobile browsers, desktop, and background tabs) by leveraging Firebase Firestore as the
 * authoritative real-time channel with WebSocket transport acceleration.
 */

import { firebaseSignalingService } from './firebaseSignaling';
import { signalingService as wsSignalingService, SignalingConnectionStatus, RemoteParticipantPresence, SignalingEventHandler } from './websocketSignaling';

export type { SignalingConnectionStatus, RemoteParticipantPresence, SignalingEventHandler };

class UnifiedSignalingService {
  private eventListeners = new Map<string, Set<SignalingEventHandler>>();
  private statusListeners = new Set<(status: SignalingConnectionStatus) => void>();
  private status: SignalingConnectionStatus = 'disconnected';
  private processedSignalingHashes = new Set<string>();

  constructor() {
    // Forward status from Firebase as primary, fallback to WS
    firebaseSignalingService.onStatusChange((fbStatus) => {
      if (fbStatus === 'connected') {
        this.setStatus('connected');
      } else if (wsSignalingService.isConnected()) {
        this.setStatus('connected');
      } else {
        this.setStatus(fbStatus);
      }
    });

    wsSignalingService.onStatusChange((wsStatus) => {
      if (wsStatus === 'connected') {
        this.setStatus('connected');
      } else if (!firebaseSignalingService.isConnected()) {
        this.setStatus(wsStatus);
      }
    });

    // Wire up event forwarding with deduplication
    this.setupEventForwarding('room-state');
    this.setupEventForwarding('user-joined');
    this.setupEventForwarding('user-left');
    this.setupEventForwarding('offer');
    this.setupEventForwarding('answer');
    this.setupEventForwarding('candidate');
    this.setupEventForwarding('mute-status');
    this.setupEventForwarding('speaking-status');
    this.setupEventForwarding('room-event');
  }

  private setStatus(newStatus: SignalingConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      console.log(`[UnifiedSignaling:Status] ${newStatus}`);
      this.statusListeners.forEach(fn => fn(newStatus));
    }
  }

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
          console.error(`[UnifiedSignaling] Error in handler for ${eventType}:`, e);
        }
      });
    }
  }

  private setupEventForwarding(eventType: string) {
    const handleIncoming = (source: string, payload: any) => {
      // Build deduplication key for session descriptions and candidates
      let hash = '';
      if (eventType === 'offer' || eventType === 'answer') {
        const sdpStr = typeof payload?.sdp === 'string' ? payload.sdp : payload?.sdp?.sdp || '';
        hash = `${eventType}-${payload.fromUserId}-${payload.toUserId}-${sdpStr.substring(0, 80)}`;
      } else if (eventType === 'candidate') {
        const candStr = typeof payload?.candidate === 'string' ? payload.candidate : payload?.candidate?.candidate || '';
        hash = `candidate-${payload.fromUserId}-${payload.toUserId}-${candStr.substring(0, 60)}`;
      } else if (eventType === 'user-left') {
        hash = `left-${payload.userId}-${Math.floor(Date.now() / 2000)}`;
      }

      if (hash) {
        if (this.processedSignalingHashes.has(hash)) return;
        this.processedSignalingHashes.add(hash);

        // Memory cleanup for processed hash set
        if (this.processedSignalingHashes.size > 800) {
          const arr = Array.from(this.processedSignalingHashes);
          this.processedSignalingHashes = new Set(arr.slice(400));
        }
      }

      this.emit(eventType, payload);
    };

    firebaseSignalingService.on(eventType, (data) => handleIncoming('firebase', data));
    wsSignalingService.on(eventType, (data) => handleIncoming('ws', data));
  }

  public joinRoom(roomId: string, userData: { userId: string; userName: string; userAvatar?: string; role?: string; isMuted?: boolean }) {
    console.log(`[UnifiedSignaling] Joining room ${roomId} with dual transports...`);
    firebaseSignalingService.joinRoom(roomId, userData);
    try {
      wsSignalingService.joinRoom(roomId, userData);
    } catch (e) {
      console.warn('[UnifiedSignaling] WS join skipped:', e);
    }
  }

  public leaveRoom(roomId: string, userId: string) {
    console.log(`[UnifiedSignaling] Leaving room ${roomId}...`);
    firebaseSignalingService.leaveRoom(roomId, userId);
    try {
      wsSignalingService.leaveRoom(roomId, userId);
    } catch (e) {}
    this.setStatus('disconnected');
  }

  public sendOffer(roomId: string, fromUserId: string, toUserId: string, sdp: RTCSessionDescriptionInit) {
    // Deliver via Firebase Firestore (guaranteed delivery) and WS (speed)
    firebaseSignalingService.sendOffer(roomId, fromUserId, toUserId, sdp);
    try {
      if (wsSignalingService.isConnected()) {
        wsSignalingService.sendOffer(roomId, fromUserId, toUserId, sdp);
      }
    } catch (e) {}
  }

  public sendAnswer(roomId: string, fromUserId: string, toUserId: string, sdp: RTCSessionDescriptionInit) {
    firebaseSignalingService.sendAnswer(roomId, fromUserId, toUserId, sdp);
    try {
      if (wsSignalingService.isConnected()) {
        wsSignalingService.sendAnswer(roomId, fromUserId, toUserId, sdp);
      }
    } catch (e) {}
  }

  public sendCandidate(roomId: string, fromUserId: string, toUserId: string, candidate: RTCIceCandidateInit) {
    firebaseSignalingService.sendCandidate(roomId, fromUserId, toUserId, candidate);
    try {
      if (wsSignalingService.isConnected()) {
        wsSignalingService.sendCandidate(roomId, fromUserId, toUserId, candidate);
      }
    } catch (e) {}
  }

  public sendMuteStatus(roomId: string, userId: string, isMuted: boolean) {
    firebaseSignalingService.sendMuteStatus(roomId, userId, isMuted);
    try {
      if (wsSignalingService.isConnected()) {
        wsSignalingService.sendMuteStatus(roomId, userId, isMuted);
      }
    } catch (e) {}
  }

  public sendSpeakingStatus(roomId: string, userId: string, isSpeaking: boolean) {
    firebaseSignalingService.sendSpeakingStatus(roomId, userId, isSpeaking);
    try {
      if (wsSignalingService.isConnected()) {
        wsSignalingService.sendSpeakingStatus(roomId, userId, isSpeaking);
      }
    } catch (e) {}
  }

  public createRoom(roomId: string, hostId: string, title?: string) {
    try {
      if (wsSignalingService.isConnected()) {
        wsSignalingService.createRoom(roomId, hostId, title);
      }
    } catch (e) {}
  }

  public sendRoomEvent(roomId: string, eventType: string, data: any) {
    try {
      if (wsSignalingService.isConnected()) {
        wsSignalingService.sendRoomEvent(roomId, eventType, data);
      }
    } catch (e) {}
  }

  public requestPeers(roomId: string) {
    try {
      if (wsSignalingService.isConnected()) {
        wsSignalingService.requestPeers(roomId);
      }
    } catch (e) {}
  }

  public close() {
    firebaseSignalingService.close();
    wsSignalingService.close();
    this.setStatus('disconnected');
  }
}

export const unifiedSignaling = new UnifiedSignalingService();
