# 📋 INVENTARIO EXHAUSTIVO: PROYECTO ENTRADAS (TixFlow)
**Análisis Completo - Abril 2026**

---

## 📊 RESUMEN EJECUTIVO

| Aspecto | Estado | % Completado |
|--------|--------|--------------|
| **Backend (Laravel)** | ✅ Funcional | 85% |
| **Frontend (Next.js)** | ✅ Funcional | 80% |
| **Socket (Node.js)** | ✅ Funcional | 75% |
| **Flujo Checkout** | ✅ Completo | 100% |
| **Integración Ticketmaster** | ✅ Activa | 100% |
| **Concurrencia/Bloqueos** | ⚠️ Parcial | 40% |
| **Tests** | ❌ Mínimal | 10% |

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. **Race Condition en Compra (GRAVE)**
```
Escenario de fallo:
1. Usuario A selecciona asiento X
2. Usuario B selecciona asiento X
3. Ambos llegan a checkout casi simultáneamente
4. Ambos ven: "Tienes 0 entradas, puedes comprar 5"
5. checkout() cuenta en BD DESPUÉS de validar
6. ✗ AMBOS obtienen la misma entrada
```
**Solución**: Usar `lockForUpdate()` en CheckoutController

### 2. **Reservas Expiradas No = Notificación (IMPORTANTE)**
```
Flujo actual:
1. Usuario A reserva asiento X (Redis TTL 600s)
2. Espera 11 minutos inactivo
3. Redis TTL expira automáticamente
4. Usuario B lo reserva (socket recibe update)
5. Usuario A sigue viendo azul/mine pero NO lo puede comprar
```
**Solución**: Implementar "heartbeat" o verificación pre-checkout

### 3. **Sin Transacciones Atómicas en BD**
```
Falta en CheckoutController:
DB::transaction(function () {
    // Bloquear registros de asientos del evento
    // Verificar disponibilidad
    // Crear Ticket
    // Actualizar contador
})
```

---

## 📁 ESTRUCTURA DE CARPETAS

```
prj-entrades-a23marrojgon/
├─ 📂 api/                          (Backend - Laravel 11)
│ ├── routes/
│ │   └─ api.php                    📍 [Rutas API]
│ ├── app/Http/
│ │   ├── Controllers/
│ │   │   ├─ AuthController.php     ✅ Login/Register
│ │   │   ├─ ConcertController.php  ✅ Ticketmaster sync
│ │   │   ├─ CheckoutController.php ⚠️ Compra (vulnerable a race)
│ │   │   └─ AdminController.php    ✅ CRUD
│ │   ├── Middleware/
│ │   │   └─ AdminMiddleware.php    ✅ Protección admin
│ │   └── Mail/
│ │       └─ TicketPurchased.php    ✅ Email
│ ├── app/Models/
│ │   ├─ User.php                   ✅ 1 role field
│ │   ├─ Concert.php                ✅ Ticketmaster integration
│ │   └─ Ticket.php                 ✅ seat_info JSON
│ ├── database/
│ │   ├── migrations/
│ │   │   ├─ 0001_01_01_000000_create_users_table.php
│ │   │   ├─ 2026_04_07_081655_create_concerts_table.php
│ │   │   ├─ 2026_04_08_092100_create_tickets_table.php
│ │   │   └─ [otras]
│ │   └── seeders/
│ │       └─ DatabaseSeeder.php     ❌ Vacío
│ ├── config/
│ │   ├─ auth.php                   ✅ Sanctum config
│ │   └─ [otras]
│ ├── tests/
│ │   ├── Feature/
│ │   │   └─ ExampleTest.php        ❌ Solo test trivial
│ │   └── Unit/
│ ├── package.json                  ✅ Vite + Laravel
│ └── composer.json                 ✅ Dependencias PHP
├─ 📂 client/                        (Frontend - Next.js 16)
│ ├── app/
│ │   ├── page.tsx                  ✅ Dashboard eventos
│ │   ├── layout.tsx                ✅ Root layout
│ │   ├── login/
│ │   │   └─ page.tsx               ✅ Login form
│ │   ├── register/
│ │   │   └─ page.tsx               ✅ Register form
│ │   ├── events/
│ │   │   ├── layout.tsx
│ │   │   └── [id]/
│ │   │       └─ page.tsx           ✅ Mapa asientos
│ │   ├── checkout/
│ │   │   └─ page.tsx               ✅ Resumen + compra
│ │   ├── tickets/
│ │   │   └─ page.tsx               ✅ Mis entradas (mock)
│ │   ├── admin/
│ │   │   ├── page.tsx              ✅ Dashboard
│ │   │   ├── concerts/
│ │   │   │   └─ page.tsx           ✅ CRUD concerts
│ │   │   └── users/
│ │   │       └─ page.tsx           ✅ Tabla usuarios
│ │   ├── globals.css               ✅ Tailwind CSS
│ ├── components/
│ │   ├── Navbar.tsx                ✅ Header
│ │   ├── AuthProvider.tsx          ✅ Zustand init
│ │   ├── AuthGuard.tsx             ✅ Route protection
│ │   ├── SeatMap.tsx               ✅ Grid 8x12 mock
│ │   ├── Seat.tsx                  ✅ Botón individual
│ │   ├── ZoneSeatMap.tsx           ✅ Zona manager
│ │   ├── VenueMapRouter.tsx        ✅ Router dinámico
│ │   ├── maps/
│ │   │   ├─ PalauSantJordiMap.tsx  ✅ Mapa venue
│ │   │   ├─ RazzmatazzMap.tsx      ✅ Mapa venue
│ │   │   └─ SantJordiClubMap.tsx   ✅ Mapa venue
│ │   ├── Timer.tsx                 ✅ Contador 5 min
│ │   ├── ConcertCard.tsx           ✅ Tarjeta evento
│ │   ├── ConcertDashboard.tsx      ✅ Listado fetch
│ │   └── EventCard.tsx             ✅ Alternativa
│ ├── store/
│ │   ├── useAuthStore.ts           ✅ Auth (localStorage)
│ │   ├── useConcertStore.ts        ✅ Eventos
│ │   └── useTicketStore.ts         ✅ Asientos + timer
│ ├── types/
│ │   ├── auth.ts                   ✅ User, AuthResponse
│ │   ├── ticketmaster.ts           ✅ TicketmasterEvent
│ │   └── map.ts                    ✅ MapZone
│ ├── lib/
│ │   └── socket.ts                 ✅ Socket.IO client
│ ├── package.json                  ✅ Next.js 16.2.1
│ └── tsconfig.json                 ✅ TypeScript config
├─ 📂 socket/                        (Real-time - Node.js)
│ ├── index.js                      ✅ Socket.IO + Redis
│ ├── package.json                  ✅ Express, Socket.IO
│ └── Dockerfile                    ✅ Prod container
├─ 📂 docker/
│ ├── nginx/                        ✅ Reverse proxy
│ ├── php/                          ✅ PHP-FPM
│ └── postgres/                     ✅ DB init
├── docker-compose.dev.yml          ✅ Dev: 5 servicios
├── docker-compose.prod.yml         ✅ Prod: 4 servicios
├── Dockerfile (api)                ✅ Multi-stage
├── Dockerfile (client)             ✅ Multi-stage
├── Dockerfile (socket)             ✅ Node lean
├── README.md                       ❌ Template vacío
├── instructions.md                 ✅ Enunciado proyecto
├── LICENSE                         ✅ Licencia
└── response.json                   ✅ Respuesta API ejemplo
```

---

## ✅ FUNCIONALIDADES COMPLETADAS

### 🔐 Autenticación
- ✅ Registro con validación
- ✅ Login con Sanctum tokens
- ✅ Logout (revocación token)
- ✅ Protected routes (middleware auth:sanctum)
- ✅ Admin check (email hardcoded)
- ✅ Persistencia en localStorage

### 🎭 Eventos
- ✅ Integración Ticketmaster API
- ✅ 3 Venues: Palau Sant Jordi, Sant Jordi Club, Razzmatazz
- ✅ 4 salas Razzmatazz sincronizadas
- ✅ Caché 5 minutos
- ✅ Deduplicación por tm_id
- ✅ CRUD admin para eventos

### 🎫 Compra de Entradas
- ✅ Selección múltiple asientos (máx 5)
- ✅ Timer countdown 5 minutos
- ✅ Checkout con email/nombre
- ✅ Creación de Ticket en BD
- ✅ Email de confirmación
- ✅ Límite 5 por usuario+concert
- ✅ Redis pub/sub notificación

### 🗺️ Mapas Interactivos
- ✅ Mapa de asientos 8x12 (mock)
- ✅ Colores por estado (available/reserved/mine/sold)
- ✅ Sombras glowing CSS
- ✅ Mapas específicos por venue
- ✅ Asientos discount PMR (movilidad reducida)

### 👥 Administración
- ✅ Dashboard con stats (ventas, tickets, usuarios)
- ✅ CRUD concerts (crear/editar/eliminar)
- ✅ Lista usuarios con gastos totales
- ✅ Sync manual Ticketmaster
- ✅ Contador usuarios activos (socket)

### 🔌 Real-time
- ✅ Socket.IO conexión bidireccional
- ✅ Reservas temporales (10 min TTL)
- ✅ Sync asientos entre clientes
- ✅ Limpieza automática al desconectar
- ✅ Broadcast seat:update a room

### 📉 Estado & Persistencia
- ✅ Zustand stores (auth, concerts, tickets)
- ✅ localStorage para token+user
- ✅ Persist middleware en useTicketStore
- ✅ Sincronización cross-tab

---

## ❌ FUNCIONALIDADES FALTANTES

### 🔐 Seguridad
- ❌ Transacciones atómicas con lockForUpdate()
- ❌ Validación 409 Conflict en checkout
- ❌ Rate limiting en API
- ❌ CORS restricto en Socket
- ❌ TLS/SSL en socket
- ❌ Autenticación socket tokens

### 💳 Pagos
- ❌ Integración Stripe/PayPal
- ❌ Procesamiento real de pagos
- ❌ Webhook confirmación pago
- ❌ Refunds/cancelaciones

### 🎫 Entradas
- ❌ Generación QR real (ahora mock)
- ❌ Descarga PDF entradas
- ❌ Validación en puerta (NFC/QR scanner)
- ❌ Transferencia entre usuarios
- ❌ Reembolso entradas

### 🔔 Notificaciones
- ❌ Websocket alert cuando reserva expira
- ❌ Email si seat se vende antes compra
- ❌ SMS confirmación
- ❌ Push notifications

### 🔍 Búsqueda/Filtro
- ❌ Filtro por fecha
- ❌ Filtro por venue
- ❌ Búsqueda text artista
- ❌ Filtro por precio
- ❌ Ordenamiento (más vendidos, nuevos)

### 📱 UX/UI
- ❌ Dark mode toggle
- ❌ Internationalization (i18n)
- ❌ Mobile-first responsive (partial)
- ❌ Accesibilidad WCAG
- ❌ Cancelación entradas

### ⭐ Extras
- ❌ Wishlist de eventos
- ❌ Historial de búsquedas
- ❌ Recomendaciones personalizadas
- ❌ Sistema de reviews/ratings
- ❌ Early bird pricing
- ❌ Dynamic pricing

---

## 🛡️ VALIDACIONES IMPLEMENTADAS

### Backend
- ✅ `register`: email unique, password >=8
- ✅ `login`: email exists, password match
- ✅ `checkout`: 5 max tickets + concert exists
- ✅ `admin`: email = admin@tixflow.com OR role=admin
- ❌ `lockForUpdate`: NO implementado
- ❌ `409 Conflict`: NO si otro usuario compra mismo asiento simultáneo

### Frontend
- ✅ `login`: email pattern, password required
- ✅ `register`: password match, email pattern
- ✅ `checkout`: email pattern, name required
- ✅ Seat selection: max 5 total
- ✅ Timer: countdown 5 min

### Socket
- ❌ Validar token en conexión
- ❌ Rate limit por socket
- ❌ Valide userId matches token

---

## 📊 RUTAS API ENDPOINTS

### Public
```
POST   /api/register
POST   /api/login
GET    /api/concerts                          [Fetch Ticketmaster + cache]
```

### Protected (auth:sanctum)
```
GET    /api/user
POST   /api/logout
POST   /api/checkout                          [⚠️ Race condition]
GET    /api/concerts/{id}/user-count
GET    /api/concerts/{id}/user-tickets
```

### Admin Only
```
GET    /api/admin/stats
GET    /api/admin/users                       [+ sum(price) per user]
GET    /api/admin/concerts
POST   /api/admin/concerts                    [Create]
PUT    /api/admin/concerts/{id}               [Update]
DELETE /api/admin/concerts/{id}               [Delete]
POST   /api/admin/sync-ticketmaster           [Sync TM API]
```

---

## 🗄️ MODELOS DE BD

### Users Table
```sql
id (PK) | name | email (UNIQUE) | password* | role | created_at | updated_at
1       | John | john@... | $2y$... | user   | 2026-04-07 | ...
2       | Admin| admin@... | $2y$... | admin  | 2026-04-07 | ...
```

### Concerts Table
```sql
id | tm_id | name | description | date | venue | price | total_tickets | available_tickets | image_url | status | created_at
1  | ABC123| ... | ... | 2026-05-15 | Palau | 45.00 | 2000 | 1950 | ... | active | ...
```

### Tickets Table
```sql
id | user_id | concert_id | price | seat_info (JSON) | status | created_at
1  | 1       | 1          | 45.00 | {"id":"A1","row":"A","col":1,"zone":"VIP"} | confirmed | ...
```

### Key Indexes
- ✅ UNIQUE concerts(tm_id)
- ✅ FK users(id)
- ✅ FK concerts(id)
- ❌ MISSING: INDEX tickets(user_id, concert_id) [para búsqueda rápida]

---

## 🔗 FLUJOS CRÍTICOS

### 1️⃣ CHECKOUT (Vulnerable a Race Condition)
```
CLIENT:
  1. Selecciona asientos → Zustand selectedSeats []
  2. Click "Continuar" → /checkout
  3. Timer inicia/resume 5 minutos
  4. Submit form { concert_id, seats[...], email, name }

SERVER (⚠️ NO ATÓMICO):
  5. Valida concert existe
  6. COUNT(tickets_confirmed) WHERE user_id=X AND concert_id=Y
  7. IF count + new_count > 5 → ERROR
  8. LOOP por seats:
       - CREATE Ticket { user_id, concert_id, price, seat_info, status=confirmed }
       - PUBLISH Redis: ticket:sold
  9. SEND email

SOCKET:
  10. Recibe ticket:sold → Redis SET key='sold'
  11. Broadcast seat:update { status='sold' }

CLIENTE:
  12. Zustand updateSeatStatus ('sold')
  13. Clear selectedSeats
  14. Reset timer
  15. Navigate /tickets
```

**PROBLEMA**: Paso 6-7 no es atómico. 2 usuarios simultáneos ven ambos count=0, ambos llegan a paso 8.
**SOLUCIÓN**: Usar DB::transaction() + lockForUpdate()

### 2️⃣ RESERVA TEMPORAL (Websocket)
```
CLIENT A:
  1. Click asiento → socket.emit('seat:toggle', {concertId, zoneId, seatId, userId})

SOCKET SERVER:
  2. Valida no está='sold'
  3. Redis SET key=userIdA EX 600
  4. Broadcast seat:update { status='reserved', userId=A }

CLIENT A (recibe update):
  5. Zustand updateSeatStatus():
       IF userId === currentUser → status='mine' (azul)

CLIENT B (recibe update):
  6. Zustand updateSeatStatus():
       IF userId !== currentUser → status='reserved' (amarillo)

[10 minutos después]

  7. ⚠️ Redis TTL expira automáticamente
  8. ❌ Cliente A NO recibe notificación
  9. ❌ Cliente A puede seguir viendo status='mine'
  10. ❌ Si intenta checkout → FAIL (server verifica es unavailable)
```

**PROBLEMA**: Sin heartbeat, cliente no sabe si su reserva expiró.
**SOLUCIÓN**: Implementar verificación pre-checkout o heartbeat socket.

### 3️⃣ DISCONNECT CLEANUP
```
CLIENTE A desconecta/cierra tab:

SOCKET SERVER:
  1. Evento 'disconnect'
  2. FOR each key en socketReserves.get(socketId):
       - Redis DEL key
       - Broadcast seat:update { status='available' }
  3. socketReserves.delete(socketId)
  4. Decrement connectedUsersCount
```

✅ Esto sí funciona correctamente. Las reservas se limpian automáticamente.

---

## 📱 COMPONENTES REACT

| Componente | Propósito | Estado |
|-----------|---------|--------|
| **Navbar** | Header + nav | ✅ |
| **AuthProvider** | Zustand init | ✅ |
| **AuthGuard** | Route protection | ✅ |
| **SeatMap** | Grid 8x12 mock | ✅ |
| **Seat** | Botón individual | ✅ |
| **ZoneSeatMap** | Handler zonas | ✅ |
| **VenueMapRouter** | Dinámico venue | ✅ |
| **PalauSantJordiMap** | Venue específico | ✅ |
| **RazzmatazzMap** | Venue específico | ✅ |
| **SantJordiClubMap** | Venue específico | ✅ |
| **Timer** | Countdown 5 min | ✅ |
| **ConcertCard** | Tarjeta evento | ✅ |
| **ConcertDashboard** | Listado principale | ✅ |

---

## 🎣 SOCKET.IO EVENTS

### Client → Server
```javascript
'join:concert'          { concertId }
'seat:toggle'           { concertId, zoneId, seatId, userId }
'seat:sold'             { concertId, zoneId, seatId }
'seat:release_all'      { concertId }
```

### Server → Client
```javascript
'seat:initial_state'    { zoneId: { seatId: status } }
'seat:update'           { zoneId, seatId, status, userId? }
'admin:stats'           { activeUsers }
```

---

## 🚀 DEPLOYMENT

### Dev
- 5 servicios: frontend, backend, socket, postgres, adminer
- Ports: 3000 (next), 8000 (laravel), 3001 (socket), 5432 (db), 8080 (adminer)
- Hot reload habilitado

### Prod
- 4 servicios: frontend, backend, socket, postgres
- Nginx reverse proxy (80/443)
- Adminer eliminado (seguridad)
- DB puerto interno (no expuesto)
- Multi-stage builds

---

## ⚡ RENDIMIENTO

### Caché
- ✅ ConcertController: 5 min (Ticketmaster)
- ✅ useTicketStore: localStorage persist

### Optimizaciones Faltantes
- ❌ Pagination en APIs
- ❌ Lazy loading componentes
- ❌ Image optimization (next/image)
- ❌ Database indexes
- ❌ Redis connection pooling

---

## 🎓 DEFENSA - PUNTOS CLAVE

1. **Arquitectura de 3 servicios**: Frontend reactivo, Backend SSOT, Socket tiempo real
2. **Concurrencia manejada con**: Redis TTL + Websocket + Session cleanup
3. **Límite 5 entradas**: Controlado en BD con contador
4. **Integración Ticketmaster**: API real, 3 venues, caché 5 min
5. **Tecnologías modernas**: Next.js SSR, Laravel 11, Socket.IO, Zustand
6. **Seguridad**: Auth tokens Sanctum, AdminMiddleware, Flash emails

**Problemas a mencionar**:
- Race condition sin lockForUpdate() → solución propuesta
- Reservas expiradas sin notificación → solución: heartbeat
- CORS socket abierto → ajustar en producción

---

## 📌 TODO CHECKLIST PARA DEFENSA

- [ ] Explicar flujo checkout de principio a fin
- [ ] Demostrar sincronización real-time entre pestañas
- [ ] Mencionar problema race condition + solución
- [ ] Mostrar admin panel con stats
- [ ] Detallar integración Ticketmaster
- [ ] Explicar límite 5 entradas por usuario+concert
- [ ] Mostrar persistencia datos (localStorage)
- [ ] Hablar de seguridad (tokens, middleware)

---

*Documento generado automáticamente - Actualizado: Abril 2026*
