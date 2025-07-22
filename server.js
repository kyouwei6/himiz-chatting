const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store connected users
const users = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user joining
  socket.on('join', (username) => {
    users.set(socket.id, username);
    socket.broadcast.emit('user joined', username);
    io.emit('user list', Array.from(users.values()));
    console.log(`${username} joined the chat`);
  });

  // Handle chat messages
  socket.on('chat message', (data) => {
    const username = users.get(socket.id);
    const message = {
      username: username,
      message: data.message,
      timestamp: new Date().toLocaleTimeString()
    };
    io.emit('chat message', message);
  });

  // Handle typing indicator
  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing');
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      socket.broadcast.emit('user left', username);
      io.emit('user list', Array.from(users.values()));
      console.log(`${username} left the chat`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});