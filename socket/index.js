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

// Mapa per trackejar quines butaques té cada socket
const socketReserves = new Map();

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
            // Clau: seat:concertId:zoneId:seatId
            const parts = key.split(':');
            const zoneId = parts[2];
            const seatId = parts[3];
            const value = await redis.get(key);
            
            if (!seatUpdates[zoneId]) seatUpdates[zoneId] = {};
            seatUpdates[zoneId][seatId] = value; // Ara value és el userId
        }

        socket.emit('seat:initial_state', seatUpdates);
    });

    // Bloquejar / Desbloquejar butaca
    socket.on('seat:toggle', async ({ concertId, zoneId, seatId, userId }) => {
        const key = `seat:${concertId}:${zoneId}:${seatId}`;
        const currentOwner = await redis.get(key);

        if (!currentOwner || currentOwner === 'available') {
            await redis.set(key, userId, 'EX', 600);
            
            // Guardar en el tracket local del socket
            if (!socketReserves.has(socket.id)) socketReserves.set(socket.id, new Set());
            socketReserves.get(socket.id).add(key);

            io.to(`concert:${concertId}`).emit('seat:update', { zoneId, seatId, status: 'reserved', userId });
            console.log(`Butaca ${seatId} (${zoneId}) reservada per ${userId}`);
        } else if (String(currentOwner) === String(userId) || currentOwner === 'reserved') {
            // Permetem des-reservar si ets l'amo o si la clau era de l'antic sistema ('reserved')
            await redis.del(key);
            
            if (socketReserves.has(socket.id)) {
                socketReserves.get(socket.id).delete(key);
            }

            io.to(`concert:${concertId}`).emit('seat:update', { zoneId, seatId, status: 'available' });
            console.log(`Butaca ${seatId} (${zoneId}) alliberada per ${userId}`);
        }
    });

    // Marcar butaca definitivament com a venuda
    socket.on('seat:sold', async ({ concertId, zoneId, seatId }) => {
        const key = `seat:${concertId}:${zoneId}:${seatId}`;
        await redis.set(key, 'sold'); // Sense TTL, és permanent
        
        io.to(`concert:${concertId}`).emit('seat:update', { zoneId, seatId, status: 'sold' });
        console.log(`Butaca ${seatId} (${zoneId}) marcada com a VENUDA.`);
        
        // Treure del tracker de reserves perquè ja no és una reserva temporal
        if (socketReserves.has(socket.id)) {
            socketReserves.get(socket.id).delete(key);
        }
    });

    socket.on('disconnect', async () => {
        connectedUsersCount = Math.max(0, connectedUsersCount - 1);
        
        // Netejar reserves d'aquest socket
        if (socketReserves.has(socket.id)) {
            const reserves = socketReserves.get(socket.id);
            for (const key of reserves) {
                const parts = key.split(':');
                const concertId = parts[1];
                const zoneId = parts[2];
                const seatId = parts[3];
                
                await redis.del(key);
                io.to(`concert:${concertId}`).emit('seat:update', { zoneId, seatId, status: 'available' });
                console.log(`Neteja automàtica: Butaca ${seatId} alliberada per tancament de sessió.`);
            }
            socketReserves.delete(socket.id);
        }

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