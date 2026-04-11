# 🧪 GUÍA DE TESTS - Concurrencia y Race Conditions

**Actualización**: Abril 2026

---

## 📋 Cambios Implementados

### ✅ PASO 1: Transacciones Atómicas + Locks BD
**Archivo**: `api/app/Http/Controllers/CheckoutController.php`

```php
// ✨ NUEVAS CARACTERÍSTICAS:
- DB::transaction()           // Envuelve toda la compra
- lockForUpdate()            // Bloquea fila mientras se verifica
- Validación de asientos vendidos
- Reintentos automáticos (hasta 3 si hay deadlock)
- Mejor logging para auditoría
```

**Problema resuelto**:
- ❌ ANTES: 2 usuarios podían comprar el mismo asiento
- ✅ AHORA: Solo 1 logra comprar, el otro recibe `409 Conflict`

---

## 🧪 TESTS DISPONIBLES

### A) PHP Tests (Backend) - PHPUnit
**Ubicación**: `api/tests/Feature/ConcurrencyCheckoutTest.php`

#### Ejecución:
```bash
# Entrar en contenedor API
docker exec -it prj-entrades-api bash

# Ejecutar tests de concurrencia
php artisan test tests/Feature/ConcurrencyCheckoutTest.php

# O solo el test de race condition:
php artisan test tests/Feature/ConcurrencyCheckoutTest.php::test_two_users_buying_same_seat_only_one_succeeds

# Ver más verbose:
php artisan test tests/Feature/ConcurrencyCheckoutTest.php --verbose
```

#### Tests incluidos:
1. **test_two_users_buying_same_seat_only_one_succeeds()**
   - ✅ 1 usuario compra
   - ❌ 1 usuario obtiene 409 Conflict
   - Verifica: Exactamente 1 ticket en BD

2. **test_user_cannot_exceed_5_tickets_limit_with_concurrent_purchases()**
   - Compra 3, intenta comprar 5 más
   - Esperado: Segunda compra falla con 400

3. **test_multiple_users_concurrent_purchase()**
   - 10 usuarios vs 1 asiento
   - Esperado: 1 éxito, 9 conflictos

4. **test_multiple_users_buying_different_seats_all_succeed()**
   - 5 usuarios, 5 asientos distintos
   - Esperado: Todos 200 OK

---

### B) E2E Tests (Frontend) - Cypress
**Ubicación**: `client/cypress/e2e/concurrency.cy.js`

#### Prerequisites:
```bash
# Instalar Cypress (si no está)
cd client
npm install --save-dev cypress

# Generar usuarios de test en la BD (opcional)
docker exec -it prj-entrades-api php artisan tinker
> User::factory(10)->create();
```

#### Ejecución:
```bash
# Abrir Cypress UI interactivo
cd client
npx cypress open

# O ejecutar headless (sin interfaz)
npx cypress run --spec "cypress/e2e/concurrency.cy.js"

# Con salida verbose
npx cypress run --spec "cypress/e2e/concurrency.cy.js" --verbose

# Grabar video
npx cypress run --spec "cypress/e2e/concurrency.cy.js" --record
```

#### Tests incluidos:
1. **USER2 compra mismo asiento ANTES que USER1**
   - Simula: USER2 checkout → confirm (200)
   - Luego: USER1 checkout → confirm (❌ 409)

2. **5 requests paralelas para mismo asiento**
   - Envía 5 POST `/checkout` simultáneos
   - Verifica: 1 éxito (200), 4 conflictos (409)

3. **10 usuarios comprando asientos DIFERENTES**
   - Verifica que no hay overselling
   - Cada usuario obtiene UN asiento único

---

## 🏃 Quick Run: Ejecutar TODO

```bash
# Terminal 1: Backend
docker exec -it prj-entrades-api php artisan test tests/Feature/ConcurrencyCheckoutTest.php

# Terminal 2: Frontend
cd client && npx cypress run --spec "cypress/e2e/concurrency.cy.js"

# Esperado: ✅ Todos los tests pasan
```

---

## 📊 Resultados Esperados

### PHPUnit Output:
```
Tests:  4
Passed: 4 ✅
Failed: 0
Errors: 0
Time:   ~2.5s
```

### Cypress Output:
```
✓ USER2 compra mismo asiento ANTES que USER1
✓ 5 requests paralelas para mismo asiento  
✓ 10 usuarios comprando asientos DIFERENTES

3 passing (12.5s)
```

---

## 🔍 Verificación Manual (Sin Tests)

Si quieres verificar sin tests automatizados:

### Escenario 1: Mismo asiento, 2 navegadores
```
1. Abrir 2 navegadores incognito
2. Login usuario1 en navegador1, usuario2 en navegador2
3. Ambos van a MISMO evento
4. Ambos seleccionan MISMO asiento (ej: A1)
5. usuario1 click "Checkout", pero NO confirma
6. usuario2 click "Checkout" y le da a "Confirmar Compra"
   ✅ DEBE IR: usuario2 recibe "Compra realitzada"
7. usuario1 intenta "Confirmar Compra"
   ❌ DEBE FALLAR: "El asiento ya ha sido vendido"
```

### Escenario 2: Verificar BD
```bash
# Ver tickets vendidos
docker exec -it prj-entrades-db psql -U postgres -d entradas_db -c \
  "SELECT id, user_id, concert_id, seat_info, status FROM tickets WHERE status='confirmed' ORDER BY created_at DESC LIMIT 10;"

# Buscar duplicados de asiento (NUNCA debería haber):
docker exec -it prj-entrades-db psql -U postgres -d entradas_db -c \
  "SELECT seat_info, COUNT(*) as duplicates FROM tickets WHERE status='confirmed' GROUP BY seat_info HAVING COUNT(*) > 1;"
  
# Resultado esperado: 0 filas (sin duplicados)
```

---

## 🐛 Debugging

Si los tests **fallan**, verifica:

### 1. ¿El servidor API está corriendo?
```bash
curl http://localhost:8000/api/health
# Debería retornar: { "status": "ok" }
```

### 2. ¿La BD está iniciada?
```bash
docker container ps
# Debería mostrar: prj-entrades-db (PostgreSQL)
```

### 3. ¿Laravel tiene permisos?
```bash
docker exec -it prj-entrades-api php artisan migrate:fresh --seed
# Si falla: `docker exec -it prj-entrades-api chmod -R 777 storage/`
```

### 4. ¿Cypress conecta a frontend?
```bash
curl http://localhost:3000/
# Debería retornar HTML del Next.js app
```

### 5. Logs de Laravel
```bash
docker exec -it prj-entrades-api tail -50 storage/logs/laravel.log
```

---

## 📈 Métricas de Éxito

Cuando TODO esté correcto:

✅ **Tests PHPUnit**: 4/4 pasan  
✅ **Tests Cypress**: 3/3 pasan  
✅ **Race Condition**: IMPOSIBLE (locked por BD)  
✅ **Stock Overselling**: IMPOSIBLE (transaction atómica)  
✅ **Limit 5 entradas**: ENFORCED (verified en lock)  

---

## 🎓 Para la Defensa

**Puntos a explicar**:

1. **¿Cómo evitamos race conditions?**
   - "Usamos `DB::transaction()` + `lockForUpdate()`"
   - "Esto crea un lock en la fila mientras se verifica"
   - "Otros usuarios no pueden acceder hasta que se libera"

2. **¿Qué pasa si 2 usuarios intentan comprar el mismo asiento?**
   - "El primero obtiene 200 OK"
   - "El segundo obtiene 409 Conflict"
   - "Verificamos en la BD: solo 1 ticket"

3. **¿Por qué usar transacciones?**
   - "Garantiza que O todos los pasos se ejecutan O ninguno"
   - "Si algo falla en mitad, Laravel revierte todo automáticamente"
   - "Protege contra cortes de red, fallos del servidor, etc."

4. **¿Cómo lo demuestras?**
   - "Mostrar test pasando: `php artisan test ConcurrencyCheckoutTest.php`"
   - "Mostrar query BD: mismo asiento en tabla tickets = solo 1 fila"
   - "Abrir 2 navegadores y intentar comprar = uno falla"

---

## 📝 Resumen de Cambios

| Cambio | Archivo | Líneas | Descripción |
|--------|---------|--------|-------------|
| ✅ DB::transaction() | CheckoutController.php | 20-80 | Envuelve checkout completo |
| ✅ lockForUpdate() | CheckoutController.php | 45, 62 | Bloquea filas de usuario y asientos |
| ✅ Validar vendidos | CheckoutController.php | 60-75 | Verifica que asiento NO está vendido |
| ✅ PHPUnit tests | ConcurrencyCheckoutTest.php | 1-250 | 4 tests de concurrencia |
| ✅ Cypress tests | concurrency.cy.js | 1-180 | 3 tests E2E de concurrencia |
| ✅ Mejor logging | CheckoutController.php | 95-105 | log::info para auditoría |

---

**Status**: ✅ LISTO PARA DEFENSA

