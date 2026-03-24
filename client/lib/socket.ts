import { io, Socket } from "socket.io-client";

// L'URL del WebSocket ve de les variables d'entorn o utilitza el port 4000 per defecte
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

// Exportem una instància única de Socket per reutilitzar a tota l'App
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false, // Per controlar nosaltres mateixos quan es connecta
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
