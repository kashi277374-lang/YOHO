/**
 * WebSocket Signaling Client for Real-Time WebRTC Voice Chat
 * Handles room presence, automatic reconnection, offer/answer routing, and ICE candidate exchange.
 */

export type SignalingConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface RemoteParticipantPresence {
  userId: string;
  userName: string;
  userAvatar: string;
  role: string;
  joinedAt: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

export type SignalingEventHandler = (event: any) => void;

class WebSocketSignalingService {
  private socket: WebSocket | null = null;
  private status: SignalingConnectionStatus = 'disconnected';
  private statusListeners = new Set<(status: SignalingConnectionStatus) => void>();
  private eventListeners = new Map<string, Set<SignalingEventHandler>>();
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private currentRoomId: string | null = null;
  private currentUserData: any = null;
  private pingInterval: any = null;
  private isIntentionallyClosed = false;

  constructor() {
    // Keep alive when tab visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.currentRoomId && !this.isConnected()) {
          console.log('[SignalingClient] Tab visible, reconnecting signaling...');
          this.connect();
        }
      });
    }
  }

  public getStatus(): SignalingConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === 'connected' && this.socket?.readyState === WebSocket.OPEN;
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
          console.error(`[SignalingClient] Error in handler for ${eventType}:`, e);
        }
      });
    }
  }

  private setStatus(newStatus: SignalingConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      console.log(`[SignalingClient:Status] ${newStatus}`);
      this.statusListeners.forEach(fn => fn(newStatus));
    }
  }

  public connect(): Promise<void> {
    this.isIntentionallyClosed = false;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    if (this.reconnectAttempts > 0) {
      this.setStatus('reconnecting');
    } else {
      this.setStatus('connecting');
    }

    return new Promise((resolve) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;

        console.log(`[SignalingClient] Connecting to ${wsUrl}...`);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('[SignalingClient] Connected successfully.');
          this.reconnectAttempts = 0;
          this.setStatus('connected');

          // Start client ping heartbeat
          this.startHeartbeat();

          // If we had an active room before disconnect, immediately rejoin
          if (this.currentRoomId && this.currentUserData) {
            console.log(`[SignalingClient] Auto-rejoining room ${this.currentRoomId}`);
            this.send({
              type: 'join',
              roomId: this.currentRoomId,
              ...this.currentUserData,
            });
          }

          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'pong') {
              return;
            }
            this.emit(data.type, data);
          } catch (err) {
            console.error('[SignalingClient] Message parse error:', err);
          }
        };

        this.socket.onclose = (event) => {
          console.warn(`[SignalingClient] Socket closed. Code: ${event.code}, reason: ${event.reason}`);
          this.stopHeartbeat();
          if (!this.isIntentionallyClosed) {
            this.scheduleReconnect();
          } else {
            this.setStatus('disconnected');
          }
        };

        this.socket.onerror = (err) => {
          console.warn('[SignalingClient] Socket error encountered:', err);
          // onclose will trigger next
        };
      } catch (err) {
        console.error('[SignalingClient] Connection error:', err);
        this.scheduleReconnect();
        resolve();
      }
    });
  }

  private scheduleReconnect() {
    if (this.isIntentionallyClosed) return;
    this.setStatus('reconnecting');
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectAttempts++;
    // Exponential backoff: 1s, 2s, 4s, capped at 8s
    const delay = Math.min(1000 * Math.pow(1.8, this.reconnectAttempts - 1), 8000);
    console.log(`[SignalingClient] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 12000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private send(payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      console.warn('[SignalingClient] Cannot send message, socket not open:', payload.type);
    }
  }

  public joinRoom(roomId: string, userData: { userId: string; userName: string; userAvatar?: string; role?: string; isMuted?: boolean }) {
    this.currentRoomId = roomId;
    this.currentUserData = userData;

    if (!this.isConnected()) {
      this.connect().then(() => {
        this.send({
          type: 'join',
          roomId,
          ...userData,
        });
      });
    } else {
      this.send({
        type: 'join',
        roomId,
        ...userData,
      });
    }
  }

  public leaveRoom(roomId: string, userId: string) {
    if (this.currentRoomId === roomId) {
      this.send({
        type: 'leave',
        roomId,
        userId,
      });
      this.currentRoomId = null;
      this.currentUserData = null;
    }
  }

  public sendOffer(roomId: string, fromUserId: string, toUserId: string, sdp: RTCSessionDescriptionInit) {
    this.send({
      type: 'offer',
      roomId,
      fromUserId,
      toUserId,
      sdp,
    });
  }

  public sendAnswer(roomId: string, fromUserId: string, toUserId: string, sdp: RTCSessionDescriptionInit) {
    this.send({
      type: 'answer',
      roomId,
      fromUserId,
      toUserId,
      sdp,
    });
  }

  public sendCandidate(roomId: string, fromUserId: string, toUserId: string, candidate: RTCIceCandidateInit) {
    this.send({
      type: 'candidate',
      roomId,
      fromUserId,
      toUserId,
      candidate,
    });
  }

  public sendMuteStatus(roomId: string, userId: string, isMuted: boolean) {
    this.send({
      type: 'mute-status',
      roomId,
      userId,
      isMuted,
    });
  }

  public sendSpeakingStatus(roomId: string, userId: string, isSpeaking: boolean) {
    this.send({
      type: 'speaking-status',
      roomId,
      userId,
      isSpeaking,
    });
  }

  public createRoom(roomId: string, hostId: string, title?: string) {
    this.send({
      type: 'create-room',
      roomId,
      hostId,
      title: title || 'Live Voice Room',
    });
  }

  public sendRoomEvent(roomId: string, eventType: string, data: any) {
    this.send({
      type: 'room-event',
      roomId,
      eventType,
      data,
    });
  }

  public requestPeers(roomId: string) {
    this.send({
      type: 'request-peers',
      roomId,
    });
  }

  public close() {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {}
      this.socket = null;
    }
    this.setStatus('disconnected');
    this.currentRoomId = null;
    this.currentUserData = null;
  }
}

export const signalingService = new WebSocketSignalingService();
