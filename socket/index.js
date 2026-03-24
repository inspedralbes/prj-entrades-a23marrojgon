// socket/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

io.on('connection', (socket) => {
    console.log('Un usuari s\'ha connectat al WebSocket');
});

server.listen(3001, () => {
    console.log('Servidor de Sockets actiu al port 3001 🚀');
});