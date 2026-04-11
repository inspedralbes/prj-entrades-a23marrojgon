# 📋 Implementation Plan: Seat Liberation Notifications

## opsx:propose - Estrategia de Implementación

### Phase 1: Socket.IO Backend (socket/index.js)

**Objetivo**: Detectar liberación y emitir eventos

#### Step 1.1: Agregar listener 'seat:release_all'
- Location: `socket/index.js` línea ~150
- Código:
  ```javascript
  socket.on('seat:release_all', async ({ concertId, zoneId, userId }) => {
    // 1. Obtener asientos del usuario en Redis
    // 2. Cambiar status a 'available'
    // 3. Emitir 'seat:liberated' a sala
    // 4. Log event
  })
  ```

#### Step 1.2: Hook TTL expiration
- Location: `socket/index.js` + Redis
- Objetivo: Detectar cuándo expira TTL
- Opción A: Polling (simple, lento)
- Opción B: Keyspace notificaciones Redis (complejo, rápido)
- **Decidir**: Opción A por MVP

#### Step 1.3: Broadcast 'seat:liberated'
- Target: `io.to('concert:${concertId}').emit('seat:liberated', data)`
- Debe incluir: concertId, zoneId, seatIds, timestamp

### Phase 2: Frontend Socket Listener (client/components/ZoneSeatMap.tsx)

**Objetivo**: Recibir eventos y actualizar UI

#### Step 2.1: Socket listener en useEffect
- Location: `ZoneSeatMap.tsx` línea ~200
- Código:
  ```typescript
  useEffect(() => {
    socket.on('seat:liberated', ({ zoneId, seatIds }) => {
      // Si es nuestra zona:
      if (zoneId === props.zoneId) {
        // 1. Actualizar Zustand (marcar asientos como available)
        // 2. Mostrar notificación toast
        // 3. Play sonido opcional
      }
    })
    
    return () => socket.off('seat:liberated');
  }, []);
  ```

#### Step 2.2: Zustand update (useTicketStore)
- Agregar: `liberatedSeats` state
- Agregar: `addLiberatedSeat()` action
- Limpieza: Clear después 2 segundos

#### Step 2.3: Visual feedback
- Renderizar asiento con efecto "pulse" si en `liberatedSeats`
- Duración: 2 segundos
- CSS: `@keyframes pulse { ... }`

### Phase 3: Notification Components (client/components)

**Objetivo**: UI para notificaciones

#### Step 3.1: NotificationToast component
- Nueva file: `client/components/NotificationToast.tsx`
- Props: { message, type, autoClose, duration, sound }
- Duración default: 4 segundos
- Opcional: Audio element para sonido

#### Step 3.2: Integración con ZoneSeatMap
- Import NotificationToast
- Mostrar cuando `liberatedSeats` cambia
- Auto-hide después 4 segundos

### Phase 4: Testing (Tests)

#### Step 4.1: Unit tests (Jest)
- File: `client/__tests__/socket/seat-liberated.test.ts`
- Tests:
  1. Recibir evento 'seat:liberated'
  2. Actualizar Zustand correctamente
  3. Calcular latencia
  4. Verificar no duplicación

#### Step 4.2: E2E test (Cypress)
- File: `client/cypress/e2e/seat-liberation.cy.js`
- Scenario:
  1. Abrir 2 browsers
  2. Usuario A reserva asientos
  3. Usuario A libera
  4. Usuario B ve actualización < 200ms

#### Step 4.3: Backend tests (PHPUnit)
- Backend NO necesita cambios (solo server Socket)
- Socket tests: Validar no duplicación

### Phase 5: Integration & Refinement

#### Step 5.1: Performance check
- Medir latencia real
- Ajustar timeouts si es necesario

#### Step 5.2: Error scenarios
- ¿Qué pasa si usuario se desconecta durante release?
- ¿Qué pasa si TTL expira simultáneamente?

---

## Cronología Propuesta

| Fase | Tiempo | Orden |
|------|--------|-------|
| Fase 1 (Socket backend) | 30 min | Primero |
| Fase 2 (Frontend listener) | 20 min | Segundo |
| Fase 3 (Notificación UI) | 15 min | Tercero |
| Fase 4 (Testing) | 20 min | Cuarto |
| Fase 5 (Refinement) | 15 min | Quinto |
| **TOTAL** | **100 min** | - |

---

## Dependency Graph

```
socket/index.js (Step 1)
    ↓
ZoneSeatMap.tsx (Step 2)
    ↓
useTicketStore.ts (Zustand update)
    ├─ NotificationToast.tsx (Step 3)
    └─ Tests (Step 4)
```

---

## Riesgos & Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|------------|--------|-----------|
| Race condition en Redis | Media | Alto | Usar transactions |
| Duplicación eventos | Media | Bajo | Deduplicar con Set |
| Latencia > 200ms | Baja | Medio | Optimizar query Redis |
| Socket desconexión | Baja | Bajo | Reconnect automático |

---

## Definition of Done

- ✅ Código escrito
- ✅ Tests: 90%+ coverage
- ✅ E2E test passing
- ✅ Performance validado
- ✅ Documentado en código
- ✅ Sin console.log en prod
- ✅ TypeScript sin errors
- ✅ PR ready

---

## Rollback Plan

Si algo falla:
1. Revert cambios en `socket/index.js`
2. Revert cambios en `ZoneSeatMap.tsx`
3. Tests automáticamente fallarían → detecta problema

---

## Success Criteria

1. **Funcional**: Evento llega en < 200ms ✅
2. **Testable**: 90%+ coverage ✅
3. **Escalable**: Soporta 100+ users ✅
4. **Documen**: Specs + prompts log ✅
