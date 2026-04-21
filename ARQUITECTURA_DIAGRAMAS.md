# 🏗️ ARQUITECTURA & DIAGRAMAS - PROYECTO ENTRADAS

## 1. ARQUITECTURA GENERAL
```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTE FINAL (Navegador)                    │
├─────────────────────────────────────────────────────────────────────┤
│  Next.js (React 19 + Tailwind CSS)                                  │
│  - Pages: login, register, events, checkout, tickets, admin        │
│  - Components: SeatMap, Timer, VenueMapRouter                       │
│  - State: Zustand stores (auth, concerts, tickets)                 │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              ├──── HTTP REST ────► [API Gateway/Nginx]
              │                              │
              │                    ┌─────────┴──────────┐
              │                    │                    │
              │              [Laravel 11]         [PostgreSQL 15]
              │              (PHP 8.2)                 (DB)
              │              ┌──────────┐          ────────────
              │              │ Routes   │         √ Users
              │              │ │Auth    │         √ Concerts
              │              │ │Concerts│         √ Tickets
              │              │ │Checkout│         
              │              │ │Admin   │        
              │              └──────────┘
              │                   │
              │              [Ticketmaster]
              │              (API externa)
              │
              └──── WebSocket ────► [Node.js Socket.IO]
                                   │
                                   ├── [Redis] (Pub/Sub)
                                   │
                                   └── Real-time updates
                                       (seat:update)
```

---

## 2. FLUJO DE COMPRA (CHECKOUT)

```
┌─────────────────────────────────────────────────────────────────────┐
│ USUARIO SELECCIONA ASIENTOS EN FRONTEND                             │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ useTicketStore               │
        │ selectedSeats = [A1, B3, D2] │
        │ timerMinutes = 5             │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Navigate /checkout           │
        │ Resume Timer (5 min)         │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │ <CheckoutPage>                       │
        │ - Mostrar resumen asientos           │
        │ - Form: email, name                  │
        │ - Total: 150.00€                     │
        └──────────────┬──────────────────────┘
                       │
                       ▼ [USUARIO ENVÍA FORM]
        ┌──────────────────────────────────────────┐
        │ POST /api/checkout (Bearer token)        │
        │ {                                        │
        │   concert_id: "abc123",                  │
        │   seats: [                               │
        │     {id:"A1", price:75, row:"A", ...},  │
        │     {id:"B3", price:75, row:"B", ...}   │
        │   ],                                     │
        │   email: "user@...",                     │
        │   name: "John Doe"                       │
        │ }                                        │
        └──────────────┬──────────────────────────┘
                       │
                       ▼ [BACKEND LARAVEL]
        ┌──────────────────────────────────────────┐
        │ CheckoutController::process()            │
        ├──────────────────────────────────────────┤
        │ ⚠️ VALIDACIONES:                          │
        │ 1. Concert existe? ✅                   │
        │ 2. COUNT(user_tickets_concert) ≤ 5?    │ ❌ NO ATÓMICO
        │    (SIN LOCK - RACE CONDITION!)         │
        │ 3. Crear Ticket records...  ✅          │
        │ 4. PUBLISH Redis: ticket:sold ✅       │
        │ 5. SEND email ✅                        │
        └──────────────┬──────────────────────────┘
                       │
                       ├─────► [Redis]
                       │       PUBLISH ticket:sold
                       │       {concertId, seatId, ...}
                       │
                       ├─────► [PostgreSQL]
                       │       INSERT INTO tickets
                       │       (user_id, concert_id, price, seat_info)
                       │
                       └────► [Email Service]
                              SEND TicketPurchased
                              TO user@...
                              SUBJECT: "Les teves entrades"
                              
                       ▼ [RESPUESTA BACKEND]
        ┌──────────────────────────────────────────┐
        │ 200 OK {                                 │
        │   message: "Compra realitzada correcta", │
        │   tickets: [...],                        │
        │   total: 150.00                          │
        │ }                                        │
        └──────────────┬──────────────────────────┘
                       │
                       ├─────► [Socket.IO]
                       │       Backend notifica socket server
                       │       vía Redis Pub/Sub
                       │
                       ├─────► [Socket Broadcast]
                       │       io.to(`concert:abc123`)
                       │       .emit('seat:update', {
                       │         zoneId: "main",
                       │         seatId: "A1",
                       │         status: "sold"
                       │       })
                       │
                       ▼ [FRONTEND UPDATE]
        ┌──────────────────────────────────────────┐
        │ CheckoutPage recibe PUT status = 200     │
        ├──────────────────────────────────────────┤
        │ 1. Zustand updateSeatStatus('sold')      │
        │ 2. clearSelection()                      │
        │ 3. setTimer(0, 0)                        │
        │ 4. navigate('/tickets')                  │
        │ 5. localStorage actualizado              │
        └──────────────┬──────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────────┐
        │ /tickets page                            │
        │ Mostrar entradas compradas               │
        │ (Mock data por ahora)                    │
        └──────────────────────────────────────────┘

⚠️ PROBLEMA IDENTIFICADO:
   - Si 2 usuarios llegan simultáneamente a paso "Validaciones"
   - Ambos ven: count=0, pueden comprar 5
   - Ambos pasan y CREAN tickets en BD
   - OVERBOOKING posible
   
✅ SOLUCIÓN:
   DB::transaction(function() {
       Ticket::where('concert_id', $id)
             ->lockForUpdate()
             ->get();
       // Validar aquí dentro del lock
       // Crear ticket
   })
```

---

## 3. FLUJO DE RESERVA TEMPORAL (WEBSOCKET)

```
┌────────────────────────────────────────────────────────────────────┐
│ CLIENTE A HACE CLICK EN ASIENTO                                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
                   ┌─────────────────────┐
                   │ Seat.tsx onClick()  │
                   │ useTicketStore      │
                   │ toggleSeatSelection │
                   └────────┬────────────┘
                            │
                            ▼
                   ┌──────────────────────────────────┐
                   │ socket.emit('seat:toggle', {     │
                   │   concertId: "abc123",           │
                   │   zoneId: "main",                │
                   │   seatId: "A1",                  │
                   │   userId: 42                     │
                   │ })                               │
                   └────────┬─────────────────────────┘
                            │
         ┌──────────────────┴──────────────────────┐
         │                                         │
         ▼ [SOCKET SERVER Node.js]               ▼ [OTROS CLIENTES]
    ┌────────────────────────────┐          (Escucha misma room)
    │ socket.on('seat:toggle')   │
    ├────────────────────────────┤
    │ 1. key = "seat:abc123:main:A1"
    │ 2. Redis GET key
    │    → null (disponible)
    │ 3. Redis SET key = 42
    │    EX 600 (10 min TTL)
    │ 4. socketReserves.set(socketId, key)
    │ 5. Broadcast:
    │    io.to(`concert:abc123`)
    │      .emit('seat:update', {
    │        zoneId: "main",
    │        seatId: "A1",
    │        status: "reserved",
    │        userId: 42
    │      })
    └──────────────────────────┘
                            │
         ┌──────────────────┴──────────────────────┐
         │                                         │
         ▼ [CLIENTE A recibe]                 ▼ [CLIENTE B recibe]
    ┌────────────────────┐                 ┌──────────────────────┐
    │ socket.on('seat:   │                 │ socket.on('seat:    │
    │   update')         │                 │   update')           │
    ├────────────────────┤                 ├──────────────────────┤
    │ IF userId === 42   │                 │ IF userId !== 42     │
    │   status = 'mine'  │                 │   status = 'reserved'│
    │   (AZUL)           │                 │   (AMARILLO)         │
    │ Zustand:           │                 │ Zustand:             │
    │   updateSeatStatus │                 │   updateSeatStatus   │
    │   ('mine')         │                 │   ('reserved')       │
    └──────────────────────┘                └──────────────────────┘
         │                                          │
         ▼                                          ▼
    ┌────────────────────┐                 ┌──────────────────────┐
    │ Render azul        │                 │ Render amarillo      │
    │ Click para deselect│                 │ No clickeable        │
    └──────────────────────┘                └──────────────────────┘

[DESPUÉS DE 10 MINUTOS - INACTIVIDAD]

    ┌──────────────────────────────────────┐
    │ Redis TTL expira automáticamente     │
    │ seat:abc123:main:A1 → DELETE         │
    └──────────────────────┬───────────────┘
                           │
                      ❌ ¡PROBLEMA!
                    Cliente A NO sabe
                    que su reserva expiró
                           │
                           ▼ [Si Cliente C hace click]
                    ┌─────────────────────┐
                    │ Redis GET key → null│
                    │ SET key = 43 (C)    │
                    │ Broadcast:          │
                    │   status='reserved' │
                    │   userId=43         │
                    └─────────────────────┘
                           │
                    ┌──────┴──────────┐
                    │                 │
                    ▼                 ▼
            [Cliente A]          [Cliente C]
        Sigue viendo            Ahora lo ve
        'mine' (azul)          'mine' (azul)
        ❌ INCONSISTENCIA      ✅ CORRECTO
        
        Si A intenta
        checkout ahora:
        › Backend verifica
          Redis = 43
        › Error: No disponible
        › A se frustra

✅ SOLUCIÓN: Implementar heartbeat o verificación pre-checkout
```

---

## 4. DESCONEXIÓN & CLEANUP

```
┌─────────────────────────────────────────────┐
│ Usuario cierra browser / pierde conexión    │
└────────────────────────┬────────────────────┘
                         │
                         ▼
        ┌────────────────────────────┐
        │ Socket disconnect event    │
        │ io.on('disconnect')        │
        └────────────┬───────────────┘
                     │
                     ▼
    FOR each key en socketReserves[socketId]:
    
        key = "seat:abc123:main:A1"
        parts = ["seat", "abc123", "main", "A1"]
        
        ├─► Redis DEL key
        │
        └─► Broadcast:
            io.to(`concert:abc123`)
               .emit('seat:update', {
                 zoneId: "main",
                 seatId: "A1",
                 status: "available"  ✅ Liberado
               })
    
    connectedUsersCount--
    socketReserves.delete(socketId)
    io.emit('admin:stats', { activeUsers })

✅ Esto funciona correctamente = Auto-cleanup
```

---

## 5. STACK TECNOLÓGICO

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Client)                      │
├─────────────────────────────────────────────────────────────┤
│ • Next.js 16.2.1 (App Router)                              │
│ • React 19.2.4                                              │
│ • TypeScript 5                                              │
│ • Tailwind CSS 4 (+ PostCSS)                               │
│ • Zustand 5 (State management)                              │
│ • Socket.IO Client 4.8.3                                    │
│ • Node.js Runtime                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Server API)                     │
├─────────────────────────────────────────────────────────────┤
│ • Laravel 11 Framework                                      │
│ • PHP 8.2                                                   │
│ • Laravel Sanctum (Auth tokens)                             │
│ • Eloquent ORM                                              │
│ • Guzzle HTTP Client (Ticketmaster sync)                   │
│ • Redis (Pub/Sub + Caching)                                │
│ • Laravel Mail                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  REAL-TIME (WebSocket)                      │
├─────────────────────────────────────────────────────────────┤
│ • Node.js Runtime                                           │
│ • Express.js 5.2.1 (HTTP server)                            │
│ • Socket.IO 4.8.3 (Bidirectional WebSocket)               │
│ • ioredis 5.10.1 (Redis client for Pub/Sub)               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    DATABASE & CACHE                         │
├─────────────────────────────────────────────────────────────┤
│ • PostgreSQL 15 (Transactional DB)                          │
│ • Redis 7.x (Real-time pub/sub + seat state)              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL INTEGRATIONS                          │
├─────────────────────────────────────────────────────────────┤
│ • Ticketmaster API (Event data)                             │
│ • SMTP Mail Server (Email delivery)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. MODELO DE DATOS RELACIONAL

```
┌─────────────────────────┐      ┌──────────────────────┐
│       USERS TABLE       │◄─────┤   TICKETS TABLE      │
├─────────────────────────┤ 1:N  ├──────────────────────┤
│ id (PK)                 │      │ id (PK)              │
│ name                    │      │ user_id (FK) ──────┐│
│ email (UNIQUE)          │      │ concert_id (FK) ──┐││
│ password (hashed)       │      │ price              │││
│ role                    │      │ seat_info (JSON)   │││
│ timestamps              │      │ status             │││
└─────────────────────────┘      │ timestamps         │││
                                 └──────────────────────┘│
                                          │              │
                      ┌────────────────────┘              │
                      │                                   │
                      ▼                                   │
        ┌─────────────────────────┐                      │
        │   CONCERTS TABLE        │◄─────────────────────┘
        ├─────────────────────────┤ 1:N
        │ id (PK)                 │
        │ tm_id (UNIQUE)          │ ← Ticketmaster ID
        │ name                    │
        │ description             │
        │ date (DateTime)         │
        │ venue                   │ (Palau, Razzmatazz, etc)
        │ price (Decimal)         │
        │ total_tickets           │
        │ available_tickets       │
        │ image_url               │
        │ status                  │ (active, cancelled, sold_out)
        │ timestamps              │
        └─────────────────────────┘

INDEXES (para performance):
  ✅ users.email UNIQUE
  ✅ concerts.tm_id UNIQUE
  ✅ tickets.user_id
  ✅ tickets.concert_id
  ❌ tickets(user_id, concert_id) MISSING ← Para búsqueda rápida
```

---

## 7. FLUJO DE DATOS EN TIEMPO REAL

```
TIMELINE DE EVENTOS SÍNCRONOS:

0 seg   → Usuario A hace click asiento A1
          └─ Frontend: socket.emit('seat:toggle')

0.1 seg → Socket server recibe
          └─ Redis SET key=userA, EX 600
          └─ Broadcast a room concert:123

0.15 seg → Usuario A recibe update
          └─ Zustand updateSeatStatus('mine')
          └─ Render botón azul

        → Usuario B recibe update
          └─ Zustand updateSeatStatus('reserved')
          └─ Render botón amarillo

0.2 seg → Usuario B intenta click
          └─ Disabled button (reserved)
          └─ Sin hacer nada

5 min   → Usuario A va a /checkout
          └─ POST /api/checkout
          └─ Servidor crea Ticket
          └─ Publica a Redis: ticket:sold

5.1 seg → Socket recibe ticket:sold
          └─ Redis SET key='sold', sin TTL
          └─ Broadcast seat:update status='sold'
          └─ Quita de socketReserves

5.15 seg→ Usuarios A y B reciben
          └─ Render botón rojo
          └─ Disabled

10 min  → Usuario A cierra browser
          └─ Evento disconnect
          └─ Limpia socketReserves
          └─ (No hay cambio aquí pq ya vendido)

600 seg (10 min) → Si Usuario C tenía reservado:
          └─ Redis TTL expira
          └─ ⚠️ Sin notificación automática
          └─ Usuario D puede reservarlo
          └─ Usuario C no lo sabe
```

---

## 8. MATRIZ DE VALIDACIONES

```
LAYER                    VALIDACIÓN                  ESTADO
────────────────────────────────────────────────────────────
FRONTEND:
  Input Form            Email pattern                ✅
                        Password length              ✅
                        Name required                ✅
                        
  Seat Selection        Max 5 total                  ✅
                        Only available status        ✅
                        
  Checkout              Email format                 ✅
                        Name length                  ✅

BACKEND (API):
  Auth                  Token valid (Sanctum)        ✅
                        Admin check middleware       ✅
                        
  Checkout              Concert exists               ✅
                        Count(user_tickets) ≤ 5      ⚠️ NO ATÓMICO
                        Email format                 ✅
                        
  Admin                 User is admin                ✅

DATABASE:
  Constraints           UNIQUE email                 ✅
                        FK user (on delete cascade)   ✅
                        FK concert (on delete cascade) ✅
                        
  Indexes               concert.tm_id UNIQUE        ✅
                        users.email UNIQUE          ✅
                        tickets.user_id             ✅
                        tickets(user_id + concert_id) ❌

WEBSOCKET:
  Authentication        ⚠️ CORS abierto (*)         ⚠️ INSEGURO
                        Sin validación token         ❌
  
  Rate Limiting         ❌ Sin implementar           ❌
```

---

## 9. FLUJO ADMIN - SINCRONIZACIÓN TICKETMASTER

```
┌─────────────────────────────────────────────────────┐
│ Admin Panel → Button "Sincronizar Ticketmaster"   │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │ POST /api/admin/sync-ticketmaster  │
        │ ("Auth": Bearer admin_token)       │
        └────────────────────┬───────────────┘
                             │
                             ▼
        ┌───────────────────────────────────────┐
        │ AdminController::syncTicketmaster()   │
        ├───────────────────────────────────────┤
        │ FOR each VENUE in TARGET_VENUES:     │
        │   - Palau Sant Jordi                  │
        │   - Sant Jordi Club                   │
        │   - Razzmatazz (4 venues IDs)         │
        │                                       │
        │   FOR each venueId:                   │
        │     HTTP GET Ticketmaster API:        │
        │     /discovery/v2/events.json?        │
        │       apikey={KEY}                    │
        │       &venueId={ID}                   │
        │       &size=50                        │
        │       &sort=date,asc                  │
        │                                       │
        │     FOR each event en respuesta:      │
        │       Concert::updateOrCreate(        │
        │         ['tm_id' => $raw['id']],      │
        │         [                             │
        │           'name' => ...,              │
        │           'date' => ...,              │
        │           'venue' => ...,             │
        │           'price' => ...,             │
        │           'image_url' => ...,         │
        │           'status' => 'active'        │
        │         ]                             │
        │       );                              │
        │       $syncedCount++;                 │
        │                                       │
        │     WAIT 200ms (rate limit)           │
        │                                       │
        │ RETURN { message: "...", count }      │
        └───────────────────────────────────────┘
                             │
                             ▼
        ┌───────────────────────────────────────┐
        │ PostgreSQL: INSERT/UPDATE concerts    │
        │ (deduplicación por tm_id)             │
        └───────────────────────────────────────┘
                             │
                             ▼
        ┌───────────────────────────────────────┐
        │ Frontend: Alert "Sincr. completa"    │
        │ Tabla se actualiza con nuevos events  │
        └───────────────────────────────────────┘

VENUES CONFIGURADAS:
  • Palau Sant Jordi   - ID: Z598xZ2qZe6d7
  • Sant Jordi Club    - ID: Z198xZ2qZ1e1
  • Razzmatazz (4 room):
    - Z198xZ2qZkeF
    - Z198xZ2qZd6k
    - Z198xZ2qZ771
    - Z598xZ2qZdvF1

API KEY (HARDCODED ⚠️):
  lFJAG9ubY1mX21DlDpzmfL5ZORyKksyq
  
CACHÉ:
  5 minutos entre fetch
  (vía Cache::remember en index())
```

---

## 10. SEGURIDAD - ANÁLISIS DE RIESGOS

```
NIVEL CRÍTICO 🔴:

1. RACE CONDITION (Overbooking)
   └─ Compra simultánea mismo asiento
   └─ Impacto: Alto (dinero, reputación)
   └─ Solución: lockForUpdate() + DB transaction

2. TTL EXPIRADO SIN NOTIFICACIÓN
   └─ Usuario no sabe que su reserva expiró
   └─ Impacto: Medio (UX pobre)
   └─ Solución: Heartbeat socket o pre-check

3. CORS ABIERTO EN SOCKET
   └─ accept: origins: "*"
   └─ Impacto: Medio (CSRF/XSS posible)
   └─ Solución: Restringir a dominio específico

NIVEL IMPORTANTE 🟡:

4. API KEY HARDCODED EN CÓDIGO
   └─ Ticketmaster API key visible
   └─ Impacto: Bajo-Medio (rate limit abuso)
   └─ Solución: Mover a .env

5. ADMIN IDENTIFICADO POR EMAIL
   └─ 'admin@tixflow.com' hardcoded
   └─ Impacto: Bajo (cambio fácil)
   └─ Solución: Usar columna role verific ado

NIVEL BAJO 🟢:

6. SIN AUTENTICACIÓN EN SOCKET
   └─ Cualquiera puede conectar
   └─ Impacto: Bajo (datos no sensibles)
   └─ Solución: Validar token en handshake

7. SIN RATE LIMITING EN API
   └─ Posible DoS
   └─ Impacto: Bajo-Medio
   └─ Solución: Middleware rate limiter
```

---

## 11. COMPARATIVA: ESPERADO vs REAL

```
FUNCIONALIDAD              ESPERADO        IMPLEMENTADO   SEVERIDAD
──────────────────────────────────────────────────────────────────
Autenticación             ✅ Obligatorio   ✅ Completo    Normal
Límite 5 entradas         ✅ Obligatorio   ✅ Funciona    Crítico
Timer 5 minutos           ✅ Obligatorio   ✅ Funciona    Normal
WebSocket sync            ✅ Obligatorio   ✅ Funciona    Crítico
Zustand state mgt         ✅ Obligatorio   ✅ Completo    Crítico
Transacciones BD          ✅ Recomendado   ❌ No hay      CRÍTICO
Lock/Concurrencia         ✅ Recomendado   ⚠️ Parcial     CRÍTICO
Pago real                 ❌ Opcional      ❌ No hay      Baja
QR Real                   ✅ Bonificación  ❌ Mock        Baja
Tests concurrencia        ✅ Recomendado   ❌ No hay      Media
Validación 409            ✅ Esperado      ❌ No hay      Crítico
Notif. TTL expira         ✅ Recomendado   ❌ No hay      Media
Email real                ✅ Recomendado   ✅ Configurado Normal
```

---

*Diagramas arquitectónicos generados - Abril 2026*
