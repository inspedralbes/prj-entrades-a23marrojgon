// socket/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// ─── Socket.IO Connexions ───────────────────────────────────

let connectedUsersCount = 0;

io.on('connection', (socket) => {
    connectedUsersCount++;
    console.log(`Un usuari s'ha connectat (${socket.id}). Total: ${connectedUsersCount}`);
    
    // Notificar a tothom el nou comptador
    io.emit('admin:stats', { activeUsers: connectedUsersCount });

    socket.on('join:concerts', () => {
        socket.join('concerts');
    });

    socket.on('leave:concerts', () => {
        socket.leave('concerts');
    });

    socket.on('disconnect', () => {
        connectedUsersCount = Math.max(0, connectedUsersCount - 1);
        console.log(`Usuari desconnectat. Total: ${connectedUsersCount}`);
        io.emit('admin:stats', { activeUsers: connectedUsersCount });
    });
});

// ─── Arrencada del Servidor ─────────────────────────────────

const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
    console.log(`Servidor de Sockets actiu al port ${PORT} 🚀`);
    console.log(`Node.js dedicat només a funcionalitat de temps real.`);
});