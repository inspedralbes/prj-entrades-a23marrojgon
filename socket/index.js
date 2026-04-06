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

io.on('connection', (socket) => {
    console.log(`Un usuari s'ha connectat al WebSocket (${socket.id})`);

    // Pot ser útil per a esdeveniments en temps real en el futur (ex: seients bloquejats)
    socket.on('join:concerts', () => {
        socket.join('concerts');
        console.log(`[${socket.id}] s'ha unit a la room 'concerts'`);
    });

    socket.on('leave:concerts', () => {
        socket.leave('concerts');
    });

    socket.on('disconnect', () => {
        console.log(`Usuari desconnectat (${socket.id})`);
    });
});

// ─── Arrencada del Servidor ─────────────────────────────────

const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
    console.log(`Servidor de Sockets actiu al port ${PORT} 🚀`);
    console.log(`Node.js dedicat només a funcionalitat de temps real.`);
});