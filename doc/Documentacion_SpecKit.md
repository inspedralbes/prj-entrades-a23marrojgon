# Documentación SpecKit: Sistema de Butacas en Tiempo Real

## 1. Prompt Original
> Implementar la sincronización en tiempo real del estado de las butacas para evitar duplicidad en las compras.
> - **Estado de Selección:** Marcar como "En proceso de compra" para el resto inmediatamente.
> - **Bloqueo de Compra:** Evitar selección si ya está gestionada o comprada.
> - **Estado de Comprado:** Cambio permanente a "Ocupada".
> - **Zonas de Aforo:** Contador para zonas sin asiento.

## 2. Explicación Técnica
Se ha elegido una solución basada en **WebSockets (Socket.io)** y **Redis** para garantizar baja latencia y gestión eficiente de bloqueos temporales.

### Arquitectura de Sincronización:
- **Client (Next.js):** Se conecta al servidor de sockets al entrar en un mapa de butacas (`join:concert`). Al hacer clic en una butaca, emite un evento `seat:toggle`.
- **Server (Node.js):** Recibe el toggle y verifica el estado en **Redis**.
  - Si está disponible: Se marca como `reserved` con un TTL (Time To Live) de 10 minutos en Redis.
  - Si está reservada: Se libera (esto permite al mismo usuario o al sistema gestionar el timeout).
  - DIFUSIÓN: El servidor emite un evento `seat:update` a todos los usuarios en la sala del concierto.
- **Persistencia Temporal (Redis):** Permite que si el servidor de Node se reinicia, los bloqueos no se pierdan inmediatamente (si Redis es persistente) y maneja automáticamente la expiración de las reservas sin tareas programadas pesadas.

## 3. Archivos Modificados

| Archivo | Función |
| :--- | :--- |
| `socket/index.js` | Implementa la lógica de gestión de estados con Redis y la salas de socket. |
| `socket/package.json` | Añadida dependencia `ioredis`. |
| `client/lib/socket.ts` | Configuración del cliente para conexión bajo demanda. |
| `client/store/useTicketStore.ts` | Actualizado para sincronizar el estado global con los eventos de sockets. |
| `client/components/ZoneSeatMap.tsx` | Refactorizado para usar datos reales del servidor en lugar de aleatorios. |
| `client/components/Seat.tsx` | Adaptado para emitir eventos a través del componente padre. |
| `client/app/events/[id]/page.tsx` | Pasa el `concertId` real al mapa de butacas. |

## 4. Cómo Probar
1. Levantar el entorno con Docker: `docker compose up --build`.
2. Abrir el navegador en `http://localhost:3000`.
3. Navegar a un concierto del **Palau Sant Jordi** (ej: Estopa o Hans Zimmer).
4. Seleccionar una zona de grada para abrir el mapa de butacas.
5. **Prueba de Sincronización:** Abrir una segunda pestaña o ventana de incógnito en el mismo concierto.
6. Al seleccionar un asiento en la pestaña A, verás cómo cambia instantáneamente a color naranja (Reservado) en la pestaña B.
7. Al deseleccionarlo en A, volverá a verde (Disponible) en B.
