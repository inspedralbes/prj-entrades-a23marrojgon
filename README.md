# 🎟️ TixFlow - Plataforma d'Entrades en Temps Real

## 👥 Desenvolupador
- **Marc Rojano** (a23marrojgon)
- **Classe**: DAW 2 (2024-2026)
- **Centre**: IES Pedralbes

## 📝 Objectiu Breu
Desenvolupa una **plataforma de venda d'entrades en temps real** amb **socket.io** que gestiona la concurrència quan múltiples usuaris competeixen pels mateixos seients. La solució utilitza **transaccions ACID** i **locks de BD** per evitar race conditions.

## 📊 Estat Breu
```
✅ CORE COMPLET:
   - Concurrencia segura (race condition eliminada)
   - Socket.IO sincronització temps real
   - 7/7 Tests de concurrència PASSEN
   - Documentació completa

⚠️ PENDING:
   - Deployment en daw.inspedralbes.cat
   - Admin panel stats real-time (v2.0)
   
🔜 OPCIONAL:
   - WebRTC assistència (v2.0)
```

---

## 🔗 Enllaços Requerits

| Recurso | URL |
|---------|-----|
| **📖 Documentació PHPdoc** | https://daw.inspedralbes.cat/phpdoc/tixflow/ |
| **🌐 Aplicació Desplegada** | https://tixflow.daw.inspedralbes.cat |
| **🎨 Prototipatge (Penpot)** | [Wireframes TixFlow](https://penpot.app/...) (pending) |
| **💾 GitHub Repository** | [a23marrojgon/prj-entrades](https://github.com/) |
| **📋 Taiga Project** | [TixFlow Tasks](https://taiga.inspedralbes.cat/) (pending) |

---

## 📂 Estructura de Carpetes

```
Carpeta CSS:      client/public/css/
Carpeta IMG:      client/public/img/
Carpeta JS:       client/public/js/
Documentació:     /doc/ (wireframes, PHPdoc, etc.)
```

---

## 📊 Estat Actual

### ✅ COMPLETAT (Abril 2026)

**Sprint 1 - Arquitectura Base**
- ✅ Setup Docker (frontend + backend + socket + BD)
- ✅ Estructura carpetes scaffolding
- ✅ Models BD (users, concerts, tickets)
- ✅ Migraciones Laravel

**Sprint 2 - Auth & Funcionlit**
- ✅ Login/Registro (email)
- ✅ Sanctum tokens
- ✅ CRUD concerts (admin)
- ✅ Sincronització Ticketmaster

**Sprint 3 - Mapa de Seients**
- ✅ SVG maps (3 venues)
- ✅ Selecció seients
- ✅ Timer 5 minutos visible
- ✅ Socket.IO estado seients

**Sprint 4 - CRÍTICO: Concurrencia Segura**
- ✅ `DB::transaction()` en checkout
- ✅ `lockForUpdate()` para bloquear filas
- ✅ Tests PHPUnit (4/4 passan)
- ✅ Tests Cypress (3/3 passan)
- ✅ Validación asientos vendidos

**Sprint 5 - Documentación & Tests**
- ✅ README.md (AQUEST)
- ✅ TESTS_CONCURRENCIA.md
- ✅ INVENTARIO_PROYECTO.md
- ✅ ARQUITECTURA_DIAGRAMAS.md

### 🟡 EN PROGRESO

- ⚠️ Dashboard admin temps real (v2.0)
- ⚠️ Informes i estadístiques
- ⚠️ Rate limiting per a protecció spam

### ❌ NO INICIAT

- ❌ WebRTC (opcional, v2.0)
- ❌ Deployment a producció

---

## 🚀 Instal·lació Ràpida

### Requisits
- Docker + Docker Compose
- Git

### Passes
```bash
# 1. Clonar
git clone <repo>
cd prj-entrades-a23marrojgon

# 2. Copiar .env
cp api/.env.example api/.env
cp client/.env.local.example client/.env.local

# 3. Iniciar dockers
docker compose -f docker-compose.dev.yml up --build

# 4. Migraciones BD
docker exec -it prj-entrades-api php artisan migrate:fresh --seed

# 5. Acceder
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# Adminer:  http://localhost:8080
```

**Usuaris de test**: Veure [TESTS_CONCURRENCIA.md](./TESTS_CONCURRENCIA.md)

---

## 🧪 Test de Concurrència

**Objectiu**: Demostrar que NO hi ha race condition si 2 usuaris intenten comprar el MATEIX asiento.

```bash
# Backend (PHPUnit)
docker exec -it prj-entrades-api php artisan test tests/Feature/ConcurrencyCheckoutTest.php

# Frontend (Cypress E2E)
cd client && npx cypress run --spec "cypress/e2e/concurrency.cy.js"
```

**Resultat esperat**: ✅ Tots els tests passen (4 PHPUnit + 3 Cypress)

Veure [TESTS_CONCURRENCIA.md](./TESTS_CONCURRENCIA.md) per a detalls.

---

## 📁 Estructura del Projecte

```
prj-entrades-a23marrojgon/
├── README.md (AQUEST)
├── TESTS_CONCURRENCIA.md      ← Com executar tests
├── INVENTARIO_PROYECTO.md     ← Status detallat
├── ARQUITECTURA_DIAGRAMAS.md  ← Diagrammes
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── api/                       (Backend - Laravel)
├── client/                    (Frontend - Next.js)
├── socket/                    (WebSocket - Node.js)
└── doc/                       (Docs adicional)
```

---

## 🔑 Tecnologies Utilitzades

- **Frontend**: Next.js 16 (TypeScript) + Tailwind CSS + Socket.IO client
- **Backend**: Laravel 11 (PHP 8.2) + PostgreSQL
- **WebSocket**: Node.js 18 + Socket.IO
- **BD**: PostgreSQL 15 + Redis (TTL)
- **Tests**: PHPUnit + Cypress
- **Deployment**: Docker + Docker Compose

---

## 📖 Documentació Completa

1. **[TESTS_CONCURRENCIA.md](./TESTS_CONCURRENCIA.md)** - Guide complet de tests i debugging
2. **[INVENTARIO_PROYECTO.md](./INVENTARIO_PROYECTO.md)** - Checklist de requisits (✅/❌)
3. **[ARQUITECTURA_DIAGRAMAS.md](./ARQUITECTURA_DIAGRAMAS.md)** - Diagrammes d'arquitectura
4. **[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)** - Guia de deployment (si existeix)

---

## 🎓 Punts per a la Defensa

### Problema Principal: Race Condition
❌ **ABANS**: 2 usuaris podien comprar el MATEIX asiento  
✅ **AHORA**: Solo 1 logra comprar, el otro recibe error 409 (Conflict)

**Solució**: Transaccions atómiques + Locks de BD
```php
DB::transaction(function () {
    $tickets = Ticket::where(...)->lockForUpdate()->count();
    // Aquí els usuarios NO poten accedir fins que s'acabe la transacció
});
```

### Com Demostrar
1. Executar: `php artisan test tests/Feature/ConcurrencyCheckoutTest.php` ✅
2. Abrir 2 navegadores → mismo concert → mismo asiento → 1 compra, 1 error
3. Verificar BD: `SELECT COUNT(*) FROM tickets WHERE seat='A1'` = 1 ✅

---

## 📞 Contacte

- **Autor**: Marc Rojano
- **Email**: [Tu email]
- **Clase**: DAW 2 (2024-2026)

---

**Última actualització**: Abril 11, 2026  
**Status**: ✅ Llest per a defensa


