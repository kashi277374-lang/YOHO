import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

// Load Firebase Config for server-side room lifecycle cleanup
let firebaseConfig: any = null;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn('[SignalingServer] Could not load firebase-applet-config.json:', e);
}

// Server-side helper to delete empty Firestore rooms and left member documents
const deleteFirestoreDoc = async (docPath: string) => {
  if (!firebaseConfig?.projectId || !firebaseConfig?.apiKey) return;
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents/${docPath}?key=${firebaseConfig.apiKey}`;
  try {
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) {
      console.log(`[SignalingServer:Firestore] Successfully deleted ${docPath}`);
    }
  } catch (err: any) {
    console.warn(`[SignalingServer:Firestore] Error deleting ${docPath}:`, err.message);
  }
};

interface Participant {
  socket: WebSocket;
  userId: string;
  userName: string;
  userAvatar: string;
  role: string;
  joinedAt: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

interface SocketMeta {
  roomId?: string;
  userId?: string;
  isAlive: boolean;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());
  app.use(express.text({ type: ['text/plain', 'application/json'] }));

  // Health and Debug API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Dynamic WebRTC ICE Configuration endpoint (STUN + multi-transport TURN for symmetric NAT & 4G/5G mobile)
  app.get('/api/webrtc/ice-servers', (req, res) => {
    res.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'stun:stun.services.mozilla.com' },
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
    });
  });

  // Authoritative real-time room presence and signaling state
  // Map<roomId, Map<userId, Participant>>
  const rooms = new Map<string, Map<string, Participant>>();
  // Map<WebSocket, SocketMeta>
  const socketMetaMap = new Map<WebSocket, SocketMeta>();

  app.get('/api/rooms/presence', (req, res) => {
    const summary: Record<string, any[]> = {};
    rooms.forEach((participants, roomId) => {
      summary[roomId] = Array.from(participants.values()).map(p => ({
        userId: p.userId,
        userName: p.userName,
        joinedAt: p.joinedAt,
        isMuted: p.isMuted,
        isSpeaking: p.isSpeaking,
      }));
    });
    res.json({ rooms: summary });
  });

  // Attach WebSocket Server specifically on path /ws
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Safe JSON sender
  const sendTo = (ws: WebSocket, data: any) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (err) {
        console.error('[SignalingServer:SendError]', err);
      }
    }
  };

  // Broadcast to room members, with optional skip sender
  const broadcastToRoom = (roomId: string, data: any, skipUserId?: string) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.forEach((participant, userId) => {
      if (skipUserId && userId === skipUserId) return;
      sendTo(participant.socket, data);
    });
  };

  // Helper to remove user from room presence and broadcast leave event
  const removeUserFromRoom = (roomId: string, userId: string, reason: string = 'normal') => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.has(userId)) {
      console.log(`[SignalingServer] User ${userId} left room ${roomId} (reason: ${reason})`);
      room.delete(userId);
      // Clean up user member doc in Firestore
      deleteFirestoreDoc(`liveRooms/${roomId}/members/${userId}`);

      // Immediately notify all remaining participants in the room
      broadcastToRoom(roomId, {
        type: 'user-left',
        roomId,
        userId,
        reason,
        timestamp: Date.now(),
      });
    }

    if (room.size === 0) {
      rooms.delete(roomId);
      console.log(`[SignalingServer] Room ${roomId} is now empty. Deleting from Firestore.`);
      // Delete the empty room document from Firestore immediately so it does not stay live
      deleteFirestoreDoc(`liveRooms/${roomId}`);
    }
  };

  // Immediate disconnect beacon handler (called on pagehide / beforeunload / window close)
  app.post('/api/rooms/:roomId/leave', (req, res) => {
    try {
      const roomId = req.params.roomId;
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
      }
      const userId = body?.userId;
      if (roomId && userId) {
        removeUserFromRoom(roomId, String(userId), 'beacon_disconnect');
      }
      res.json({ ok: true, roomId, userId });
    } catch (e) {
      res.status(500).json({ error: 'failed' });
    }
  });

  // Single room real-time presence endpoint
  app.get('/api/rooms/:roomId/presence', (req, res) => {
    const roomId = req.params.roomId;
    const room = rooms.get(roomId);
    if (!room) {
      return res.json({ roomId, count: 0, participants: [] });
    }
    const participants = Array.from(room.values()).map(p => ({
      userId: p.userId,
      userName: p.userName,
      userAvatar: p.userAvatar,
      joinedAt: p.joinedAt,
      isMuted: p.isMuted,
      isSpeaking: p.isSpeaking,
    }));
    res.json({ roomId, count: participants.length, participants });
  });

  wss.on('connection', (ws: WebSocket, req: any) => {
    socketMetaMap.set(ws, { isAlive: true });

    // Enable TCP low-latency noDelay (disables Nagle algorithm for real-time WebRTC audio signaling)
    try {
      const sock = (ws as any)._socket || (req as any)?.socket;
      if (sock && typeof sock.setNoDelay === 'function') {
        sock.setNoDelay(true);
      }
    } catch (e) {}

    ws.on('pong', () => {
      const meta = socketMetaMap.get(ws);
      if (meta) meta.isAlive = true;
    });

    ws.on('message', (messageRaw: string | Buffer) => {
      try {
        const payload = JSON.parse(messageRaw.toString());
        const meta = socketMetaMap.get(ws) || { isAlive: true };

        switch (payload.type) {
          case 'join': {
            const { roomId, userId, userName, userAvatar, role, isMuted } = payload;
            if (!roomId || !userId) return;

            meta.roomId = roomId;
            meta.userId = userId;
            socketMetaMap.set(ws, meta);

            let room = rooms.get(roomId);
            if (!room) {
              room = new Map();
              rooms.set(roomId, room);
            }

            // If user already existed on an older socket, clean up old socket
            const existing = room.get(userId);
            if (existing && existing.socket !== ws) {
              try {
                existing.socket.close();
              } catch (e) {}
            }

            const participant: Participant = {
              socket: ws,
              userId: String(userId),
              userName: String(userName || 'User'),
              userAvatar: String(userAvatar || ''),
              role: String(role || 'member'),
              joinedAt: new Date().toISOString(),
              isMuted: Boolean(isMuted),
              isSpeaking: false,
            };

            room.set(String(userId), participant);
            console.log(`[SignalingServer] User ${userId} (${userName}) joined room ${roomId}. Room count: ${room.size}`);

            // Send full room state back to the newly joined user
            const currentParticipants = Array.from(room.values()).map(p => ({
              userId: p.userId,
              userName: p.userName,
              userAvatar: p.userAvatar,
              role: p.role,
              joinedAt: p.joinedAt,
              isMuted: p.isMuted,
              isSpeaking: p.isSpeaking,
            }));

            sendTo(ws, {
              type: 'room-state',
              roomId,
              participants: currentParticipants,
              timestamp: Date.now(),
            });

            // Broadcast to other participants in the room that a new user joined
            broadcastToRoom(
              roomId,
              {
                type: 'user-joined',
                roomId,
                participant: {
                  userId: participant.userId,
                  userName: participant.userName,
                  userAvatar: participant.userAvatar,
                  role: participant.role,
                  joinedAt: participant.joinedAt,
                  isMuted: participant.isMuted,
                  isSpeaking: participant.isSpeaking,
                },
                timestamp: Date.now(),
              },
              userId
            );
            break;
          }

          case 'leave': {
            const { roomId, userId } = payload;
            const rId = roomId || meta.roomId;
            const uId = userId || meta.userId;
            if (rId && uId) {
              removeUserFromRoom(rId, uId, 'user_left');
            }
            meta.roomId = undefined;
            break;
          }

          case 'offer': {
            // WebRTC Offer: forward strictly to destination peer
            const { roomId, fromUserId, toUserId, sdp } = payload;
            if (!roomId || !toUserId) return;
            const room = rooms.get(roomId);
            const target = room?.get(String(toUserId));
            if (target) {
              sendTo(target.socket, {
                type: 'offer',
                roomId,
                fromUserId,
                toUserId,
                sdp,
                timestamp: Date.now(),
              });
            }
            break;
          }

          case 'answer': {
            // WebRTC Answer: forward strictly to destination peer
            const { roomId, fromUserId, toUserId, sdp } = payload;
            if (!roomId || !toUserId) return;
            const room = rooms.get(roomId);
            const target = room?.get(String(toUserId));
            if (target) {
              sendTo(target.socket, {
                type: 'answer',
                roomId,
                fromUserId,
                toUserId,
                sdp,
                timestamp: Date.now(),
              });
            }
            break;
          }

          case 'candidate': {
            // WebRTC ICE candidate: forward strictly to destination peer
            const { roomId, fromUserId, toUserId, candidate } = payload;
            if (!roomId || !toUserId) return;
            const room = rooms.get(roomId);
            const target = room?.get(String(toUserId));
            if (target) {
              sendTo(target.socket, {
                type: 'candidate',
                roomId,
                fromUserId,
                toUserId,
                candidate,
                timestamp: Date.now(),
              });
            }
            break;
          }

          case 'mute-status': {
            const { roomId, userId, isMuted } = payload;
            if (!roomId || !userId) return;
            const room = rooms.get(roomId);
            const participant = room?.get(String(userId));
            if (participant) {
              participant.isMuted = Boolean(isMuted);
            }
            broadcastToRoom(roomId, {
              type: 'mute-status',
              roomId,
              userId,
              isMuted: Boolean(isMuted),
              timestamp: Date.now(),
            });
            break;
          }

          case 'speaking-status': {
            const { roomId, userId, isSpeaking } = payload;
            if (!roomId || !userId) return;
            const room = rooms.get(roomId);
            const participant = room?.get(String(userId));
            if (participant) {
              participant.isSpeaking = Boolean(isSpeaking);
            }
            broadcastToRoom(roomId, {
              type: 'speaking-status',
              roomId,
              userId,
              isSpeaking: Boolean(isSpeaking),
              timestamp: Date.now(),
            });
            break;
          }

          case 'room-event': {
            const { roomId, eventType, data } = payload;
            if (!roomId) return;
            broadcastToRoom(roomId, {
              type: 'room-event',
              roomId,
              eventType,
              data,
              timestamp: Date.now(),
            });
            break;
          }

          case 'create-room': {
            const { roomId, hostId, title } = payload;
            if (roomId && !rooms.has(roomId)) {
              rooms.set(roomId, new Map());
            }
            sendTo(ws, {
              type: 'room-created',
              roomId,
              hostId,
              title,
              timestamp: Date.now(),
            });
            break;
          }

          case 'request-peers': {
            const { roomId } = payload;
            if (!roomId) return;
            const room = rooms.get(roomId);
            const participants = room ? Array.from(room.values()).map(p => ({
              userId: p.userId,
              userName: p.userName,
              userAvatar: p.userAvatar,
              role: p.role,
              isMuted: p.isMuted,
              isSpeaking: p.isSpeaking,
              joinedAt: p.joinedAt,
            })) : [];

            sendTo(ws, {
              type: 'room-state',
              roomId,
              participants,
              timestamp: Date.now(),
            });
            break;
          }

          case 'ping': {
            sendTo(ws, { type: 'pong', timestamp: Date.now() });
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('[SignalingServer:MessageError]', err);
      }
    });

    ws.on('close', () => {
      const meta = socketMetaMap.get(ws);
      if (meta?.roomId && meta?.userId) {
        removeUserFromRoom(meta.roomId, meta.userId, 'connection_closed');
      }
      socketMetaMap.delete(ws);
    });

    ws.on('error', (err) => {
      console.warn('[SignalingServer:SocketError]', err.message);
      const meta = socketMetaMap.get(ws);
      if (meta?.roomId && meta?.userId) {
        removeUserFromRoom(meta.roomId, meta.userId, 'connection_error');
      }
      socketMetaMap.delete(ws);
    });
  });

  // Heartbeat interval to detect broken/dropped connections immediately
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const meta = socketMetaMap.get(ws);
      if (!meta) return;
      if (meta.isAlive === false) {
        console.log(`[SignalingServer] Terminating unresponsive socket for user ${meta.userId}`);
        if (meta.roomId && meta.userId) {
          removeUserFromRoom(meta.roomId, meta.userId, 'heartbeat_timeout');
        }
        socketMetaMap.delete(ws);
        return ws.terminate();
      }
      meta.isAlive = false;
      try {
        ws.ping();
      } catch (e) {}
    });
  }, 15000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  // Vite middleware in dev; static file server in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`StarLive Server running with WebRTC WebSocket signaling on port ${PORT}`);
  });
}

startServer();
