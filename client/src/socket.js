// socket.js — Socket.io client singleton.
//
// Why a singleton?  React components mount/unmount, but we want a single
// persistent connection for the lifetime of the browser session.
// Components call `getSocket()` and the same object is always returned.
//
// Auth:  We pass the JWT stored in localStorage as handshake auth so the
//        server can add this socket to the personal "user:<id>" room.

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')   // strip /api suffix
  : 'http://localhost:5000';

let socket = null;

// Call this once (e.g. after login) or lazily from components.
// If already connected, the existing instance is returned.
export const getSocket = () => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    // Pass JWT for personal notification room; server verifies this
    auth: { token: localStorage.getItem('token') || '' },
    // Prefer websocket but allow polling fallback
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.debug('[socket] connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.debug('[socket] disconnected:', reason);
  });

  return socket;
};

// Reconnect with an updated token (called after login so the server can
// place the socket into the correct "user:<id>" room).
export const reconnectSocket = () => {
  if (socket) {
    socket.auth.token = localStorage.getItem('token') || '';
    socket.disconnect().connect();
  }
};

// Tear down on explicit logout
export const destroySocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
