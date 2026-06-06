const express = require('express');
const os = require('os');

// ── Auto-detect LAN IP ───────────────────────────────────────
function getLanIP() {
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const net of iface) {
      // IPv4, not internal (not 127.x.x.x), not link-local (169.x)
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.')) {
        return net.address;
      }
    }
  }
  return '127.0.0.1'; // fallback
}

const LAN_IP = getLanIP();
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// ── Expose server info to client ─────────────────────────────
// Client fetches this once on load to know where to connect.
app.get('/server-info', (req, res) => {
  res.json({ ip: LAN_IP, port: PORT });
});

let server;

const keyPath = path.join(__dirname, '..', '..', 'key.pem');
const certPath = path.join(__dirname, '..', '..', 'cert.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  const https = require('https');
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  server = https.createServer(options, app);
  console.log('[INFO] SSL certificates found. Running HTTPS server.');
} else {
  const http = require('http');
  server = http.createServer(app);
  console.log('[WARN] SSL certificates not found. Running HTTP server.');
  console.log('[WARN] Microphone and screen sharing will NOT work without HTTPS.');
}

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const users = new Map();
const messages = [];
const sharers = new Map();

io.on('connection', (socket) => {
  socket.on('join', (username) => {
    if (!username || username.trim() === '') {
      socket.emit('error', 'Username is required');
      return;
    }
    const cleanName = username.trim();
    users.set(socket.id, cleanName);
    socket.username = cleanName;

    io.emit('userList', Array.from(users.entries()).map(([id, name]) => ({ id, name })));
    socket.emit('messageHistory', messages);

    const activeSharers = Array.from(sharers.entries()).map(([id, name]) => ({ id, name }));
    socket.emit('activeSharers', activeSharers);

    socket.broadcast.emit('newUser', { id: socket.id, name: cleanName });

    io.emit('newMessage', {
      username: 'System',
      text: `${cleanName} joined the chat`,
      time: new Date().toISOString(),
    });
  });

  socket.on('sendMessage', (text) => {
    if (!socket.username) return;
    if (!text || text.trim() === '') return;
    const msg = {
      username: socket.username,
      text: text.trim(),
      time: new Date().toISOString(),
    };
    messages.push(msg);
    if (messages.length > 200) {
      messages.shift();
    }
    io.emit('newMessage', msg);
  });

  socket.on('startScreenShare', () => {
    if (!socket.username) return;
    sharers.set(socket.id, socket.username);
    io.emit('userStartedSharing', { id: socket.id, name: socket.username });
  });

  socket.on('stopScreenShare', () => {
    sharers.delete(socket.id);
    io.emit('userStoppedSharing', { id: socket.id, name: socket.username });
  });

  socket.on('joinScreenShare', ({ sharerId }) => {
    const sharerSocket = io.sockets.sockets.get(sharerId);
    if (sharerSocket) {
      sharerSocket.emit('newViewer', { viewerId: socket.id, viewerName: socket.username });
    }
  });

  socket.on('webrtcOffer', ({ to, offer }) => {
    const targetSocket = io.sockets.sockets.get(to);
    if (targetSocket) {
      targetSocket.emit('webrtcOffer', { from: socket.id, offer: offer });
    }
  });

  socket.on('webrtcAnswer', ({ to, answer }) => {
    const targetSocket = io.sockets.sockets.get(to);
    if (targetSocket) {
      targetSocket.emit('webrtcAnswer', { from: socket.id, answer: answer });
    }
  });

  socket.on('webrtcIceCandidate', ({ to, candidate }) => {
    const targetSocket = io.sockets.sockets.get(to);
    if (targetSocket) {
      targetSocket.emit('webrtcIceCandidate', { from: socket.id, candidate: candidate });
    }
  });

  socket.on('webrtcAudioOffer', ({ to, offer }) => {
    const targetSocket = io.sockets.sockets.get(to);
    if (targetSocket) {
      targetSocket.emit('webrtcAudioOffer', { from: socket.id, offer: offer });
    }
  });

  socket.on('webrtcAudioAnswer', ({ to, answer }) => {
    const targetSocket = io.sockets.sockets.get(to);
    if (targetSocket) {
      targetSocket.emit('webrtcAudioAnswer', { from: socket.id, answer: answer });
    }
  });

  socket.on('webrtcAudioIceCandidate', ({ to, candidate }) => {
    const targetSocket = io.sockets.sockets.get(to);
    if (targetSocket) {
      targetSocket.emit('webrtcAudioIceCandidate', { from: socket.id, candidate: candidate });
    }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      users.delete(socket.id);
      io.emit('userList', Array.from(users.entries()).map(([id, name]) => ({ id, name })));
      if (sharers.has(socket.id)) {
        sharers.delete(socket.id);
        io.emit('userStoppedSharing', { id: socket.id, name: socket.username });
      }
      io.emit('newMessage', {
        username: 'System',
        text: `${socket.username} left the chat`,
        time: new Date().toISOString(),
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ┌─────────────────────────────────────────┐');
  console.log(`  │  Holyroom server running                │`);
  console.log(`  │                                         │`);
  console.log(`  │  Local:   http://localhost:${PORT}         │`);
  console.log(`  │  Network: http://${LAN_IP}:${PORT}  │`);
  console.log(`  │                                         │`);
  console.log(`  │  Share the Network URL with teammates   │`);
  console.log('  └─────────────────────────────────────────┘');
  console.log('');
});