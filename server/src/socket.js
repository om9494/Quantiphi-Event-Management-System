// socket.js — Socket.io singleton.
//
// We keep the `io` instance here so any service can call `getIo()` to emit
// events without importing from server.js (which would create a circular dep).
//
// Initialisation flow:
//   1. server.js calls initSocket(httpServer) once on startup.
//   2. Services call getIo() to emit targeted room events.
//
// Room naming convention:
//   - "event:<tmId>"   — joined by any client viewing that event
//   - "user:<userId>"  — joined by the authenticated owner (for personal notifications)

import { Server } from 'socket.io';
import { env } from './config/env.js';
import jwt from 'jsonwebtoken';

let io = null;

// Called once in server.js after the HTTP server is created
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Recommended transport order — polling fallback for restricted networks
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    // ── Optional JWT auth for personal notification room ──────────────────
    // The client sends the token as a handshake auth header.
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, env.jwtSecret);
        socket.userId = decoded.id;
        // Join the personal room so we can push notifications to this user only
        socket.join(`user:${decoded.id}`);
      } catch {
        // Invalid token — socket is still connected but won't join personal room
      }
    }

    // ── Client joins an event room to receive live friends-count updates ──
    // Client emits: socket.emit('join:event', tmId)
    socket.on('join:event', (tmId) => {
      if (typeof tmId === 'string' && tmId.length < 64) {
        socket.join(`event:${tmId}`);
      }
    });

    socket.on('leave:event', (tmId) => {
      socket.leave(`event:${tmId}`);
    });

    socket.on('disconnect', () => {
      // Rooms are cleaned up automatically on disconnect
    });
  });

  console.log('🔌  Socket.io initialised');
  return io;
};

// Getter used by services — throws if initSocket wasn't called first
export const getIo = () => {
  if (!io) throw new Error('Socket.io not initialised — call initSocket(httpServer) first');
  return io;
};
