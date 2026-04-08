// socket/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const Redis = require("ioredis");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Configurem Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379
});

redis.on('error', (err) => console.error('Error de Redis:', err));
redis.on('connect', () => console.log('Connectat a Redis correctament ✅'));

// ─── Socket.IO Connexions ───────────────────────────────────

let connectedUsersCount = 0;

io.on('connection', (socket) => {
    connectedUsersCount++;
    console.log(`Un usuari s'ha connectat (${socket.id}). Total: ${connectedUsersCount}`);
    
    // Notificar a tothom el nou comptador
    io.emit('admin:stats', { activeUsers: connectedUsersCount });

    // Join record per un concert específic
    socket.on('join:concert', async (concertId) => {
        socket.join(`concert:${concertId}`);
        console.log(`Usuari ${socket.id} s'ha unit al concert ${concertId}`);

        // Enviar l'estat actual de les butaques a aquest usuari
        const keys = await redis.keys(`seat:${concertId}:*`);
        const seatUpdates = {};
        
        for (const key of keys) {
            const seatId = key.split(':').pop();
            const status = await redis.get(key);
            seatUpdates[seatId] = status;
        }

        socket.emit('seat:initial_state', seatUpdates);
    });

    // Bloquejar / Desbloquejar butaca
    socket.on('seat:toggle', async ({ concertId, seatId, userId }) => {
        const key = `seat:${concertId}:${seatId}`;
        const currentStatus = await redis.get(key);

        if (!currentStatus || currentStatus === 'available') {
            // Reservar per 10 minuts
            await redis.set(key, 'reserved', 'EX', 600);
            io.to(`concert:${concertId}`).emit('seat:update', { seatId, status: 'reserved', userId });
            console.log(`Butaca ${seatId} reservada al concert ${concertId}`);
        } else if (currentStatus === 'reserved') {
            // Només hauria de poder desbloquejar qui la va bloquejar? 
            // Per simplicitat en aquest prototip, qualsevol toggle sobre una reservada la desbloqueja si és el mateix flux
            await redis.del(key);
            io.to(`concert:${concertId}`).emit('seat:update', { seatId, status: 'available' });
            console.log(`Butaca ${seatId} alliberada al concert ${concertId}`);
        }
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