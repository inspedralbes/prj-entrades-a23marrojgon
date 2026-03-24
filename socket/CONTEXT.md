# Context del Backend Real-time (Node.js Sockets)

## 1. Rol en l'Arquitectura
Aquest és un microservei **lleuger i dedicat exclusivament a la comunicació bidireccional**. No té lògica de negoci complexa ni es connecta a la base de dades PostgreSQL. El seu únic objectiu és fer de pont (mensatger) entre Laravel i els clients Next.js.

## 2. Stack Tecnològic
* **Entorn:** Node.js
* **Llibreries:** `express`, `socket.io`, `ioredis` (per escoltar Laravel).

## 3. Flux de Dades
1. Els usuaris (Next.js) es connecten a aquest servidor i s'uneixen a una "Room" (Sala) corresponent a l'ID de l'esdeveniment que estan mirant.
2. Aquest servidor Node.js està subscrit a Redis.
3. Quan Laravel bloqueja un seient, publica un missatge a Redis.
4. Node.js rep el missatge de Redis i fa un `io.to('event_room_1').emit('seat:updated', payload)` cap a tots els clients connectats a aquella sala en temps real.

## 4. Seguretat Bàsica
* S'han de configurar els CORS correctament per acceptar connexions només des del domini del client Next.js (`NEXT_PUBLIC_API_URL` / `DOMAIN`).
* Tot i que el Socket.io pot rebre missatges dels clients, qualsevol acció crítica (com intentar reservar un seient) ha de ser enviada pel client al backend de Laravel via REST API primer, mai resoldre-ho únicament a través del socket per motius de seguretat i validació.