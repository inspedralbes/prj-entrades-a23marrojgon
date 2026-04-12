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
console.log('--- Intentant connexió a Redis ---');
console.log('Host:', process.env.REDIS_HOST || 'localhost');
console.log('Password configurada:', process.env.REDIS_PASSWORD ? 'SÍ' : 'NO');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

redis.on('error', (err) => console.error('Error de Redis:', err));
redis.on('connect', () => console.log('Connectat a Redis correctament ✅'));

// Client Redis per a subscripcions (Pub/Sub)
const redisSub = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

redisSub.subscribe('ticket:sold', (err, count) => {
    if (err) console.error('Error subscrivint a Redis:', err);
    else console.log(`Subscrit a ${count} canals.`);
});

redisSub.on('message', async (channel, message) => {
    if (channel === 'ticket:sold') {
        const { concertId, zoneId, seatId, status } = JSON.parse(message);
        console.log(`Notificació de venda: ${seatId} @ ${zoneId} del concert ${concertId}`);
        
        // Marcar a Redis permanentment
        const key = `seat:${concertId}:${zoneId}:${seatId}`;
        await redis.set(key, 'sold');

        // NETEJA CRÍTICA: Traiem aquesta butaca de qualsevol tracker de reserves actiu
        // Així evitem que en desconnectar-se l'usuari la "alliberi" de Redis.
        for (const [sid, reserves] of socketReserves.entries()) {
            if (reserves.has(key)) {
                reserves.delete(key);
                console.log(`Eliminada reserva temporal de ${key} del socket ${sid} (Butaca VENTUDA)`);
            }
        }

        // Broadcast a tothom qui estigui veient el concert
        io.to(`concert:${concertId}`).emit('seat:update', { zoneId, seatId, status: 'sold' });
    }
});

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
            seatUpdates[zoneId][seatId] = value; // Ara value és el userId o 'sold'
        }

        socket.emit('seat:initial_state', seatUpdates);
    });

    // Bloquejar / Desbloquejar butaca
    socket.on('seat:toggle', async ({ concertId, zoneId, seatId, userId }) => {
        const key = `seat:${concertId}:${zoneId}:${seatId}`;
        const currentOwner = await redis.get(key);

        // SI JA ESTÀ VENUDA, NO ES POT FER RES
        if (currentOwner === 'sold') {
            console.log(`Intent de toggle en butaca VENUDA: ${key}`);
            return;
        }

        if (!currentOwner || currentOwner === 'available') {
            await redis.set(key, userId, 'EX', 600);
            
            // Guardar en el tracket local del socket
            if (!socketReserves.has(socket.id)) socketReserves.set(socket.id, new Set());
            socketReserves.get(socket.id).add(key);

            io.to(`concert:${concertId}`).emit('seat:update', { zoneId, seatId, status: 'reserved', userId });
            console.log(`Butaca ${seatId} (${zoneId}) reservada per ${userId}`);
        } else if (String(currentOwner) === String(userId)) {
            // Només permetem des-reservar si ets el propietari real
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
        await redis.set(key, 'sold'); 
        
        if (socketReserves.has(socket.id)) {
            socketReserves.get(socket.id).delete(key);
        }

        io.to(`concert:${concertId}`).emit('seat:update', { zoneId, seatId, status: 'sold' });
        console.log(`Butaca ${seatId} (${zoneId}) marcada manualment com a VENUDA.`);
    });

    // Alliberar totes les reserves d'aquest usuari (sense desconnectar el socket)
    socket.on('seat:release_all', async ({ concertId }) => {
        if (socketReserves.has(socket.id)) {
            const reserves = socketReserves.get(socket.id);
            for (const key of reserves) {
                const parts = key.split(':');
                if (concertId && parts[1] !== String(concertId)) continue;

                const cId = parts[1];
                const zId = parts[2];
                const sId = parts[3];

                await redis.del(key);
                io.to(`concert:${cId}`).emit('seat:update', { zoneId: zId, seatId: sId, status: 'available' });
                console.log(`Alliberament manual (SPA): Butaca ${sId} en concert ${cId}`);
                
                reserves.delete(key);
            }
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