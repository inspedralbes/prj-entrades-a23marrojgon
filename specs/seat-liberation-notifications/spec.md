# 📋 Specification: Seat Liberation Notifications

## opsx:propose - Comportamiento Esperado

### Scenario 1: Usuario libera asientos manualmente

```gherkin
Given Usuario B viendo ZoneSeatMap del concert A zona "Pista"
And asientos [A1, A2, A3] están reservados por B
And Usuario C viendo mismos asientos

When Usuario B hace click en botón "Liberar reserva"
Then Sistema emite evento 'seat:liberated' con:
    { concertId: 'A', zoneId: 'Pista', seatIds: ['A1', 'A2', 'A3'] }

And Usuario C recibe notificación en tiempo real
And UI de Usuario C muestra asientos en color 'available' (azul)
And Toast notificación dice: "3 asientos se han liberado en Pista"

And Redis estado se actualiza:
    seat:A:Pista:A1 = 'available' (no userId)
    seat:A:Pista:A2 = 'available'
    seat:A:Pista:A3 = 'available'
```

### Scenario 2: TTL expira (Usuario desconecta sin comprar)

```gherkin
Given Usuario B reservó asientos [C1, C2] hace 4m 59s
And TTL expires en 1 segundo

When Redis TTL expira
Then socket:index.js detecta expiración
And emite evento 'seat:liberated' a usuario B
And Pub/Sub redis notifica:
    message = { concertId, zoneId, seatIds }

And todos usuarios en 'concert:A:Pista' reciben notificación
And asientos cambian a 'available' en Zustand
And UI se actualiza automáticamente
```

### Scenario 3: Múltiples usuarios simultáneos

```gherkin
Given 5 usuarios viendo mismo mapa
And Usuario A libera 2 asientos
When Notificación Se emite
Then todos los 4 usuarios restantes ven actualización
And NO hay duplicación de notificaciones
And Estado en Redis es consistente
```

### Scenario 4: Asiento ya vendido (no se puede liberar)

```gherkin
Given asiento A1 tiene status 'sold'
When se intenta liberar
Then Sistema retorna error 409
And NO emite 'seat:liberated'
And otro usuario NO ve cambio
```

---

## API Specification

### Socket Events

#### Emitido por Cliente:

```typescript
socket.emit('seat:release_all', {
  concertId: string;      // "concert-123"
  zoneId: string;         // "Pista"
  userId: string;         // ID del usuario actual
})

Response:
{
  success: boolean;
  message: string;
  seatsReleased: number;
}
```

#### Emitido por Servidor:

```typescript
socket.on('seat:liberated', {
  concertId: string;
  zoneId: string;
  seatIds: string[];      // ["A1", "A2", "A3"]
  timestamp: number;      // Date.now()
  liberatedBy: string;    // "user-123" (opcional)
})
```

---

## UI Components

### NotificationToast Component

```typescript
<NotificationToast
  type="success"
  message={`${count} asientos liberados en ${zoneId}`}
  autoClose={true}
  sound={true}
  duration={4000}
/>
```

### ZoneSeatMap Changes

- Añadir listener para 'seat:liberated'
- Actualizar estado en Zustand
- Trigger efecto visual "pulse" en asientos
- Opcional: Play sonido notification

---

## State Management (Zustand)

### useTicketStore additions:

```typescript
interface TicketStore {
  // Existente...
  
  // NUEVO:
  liberatedSeats: Record<string, number>;  // seatId -> timestamp
  addLiberatedSeat: (seatId: string) => void;
  clearLiberatedSeats: () => void;
}
```

---

## Error Handling

| Error | Status | Acción |
|-------|--------|--------|
| Asiento ya vendido | 409 | Ignorar |
| Asiento no existe | 404 | Log warning |
| Usuario no autorizado | 401 | Disconnect |
| TTL ya expirado | - | No hacer nada |

---

## Performance Metrics

### Expected Results:
- ✅ Latencia: < 200ms
- ✅ No dropped events
- ✅ Memory: < 1MB per 100 users
- ✅ CPU: < 5% overhead

---

## Acceptance Criteria

- [ ] Evento 'seat:liberated' emitido correctamente
- [ ] Notificación llega a todos usuarios de concert+zona
- [ ] UI actualiza within 200ms
- [ ] Redis estado es consistente
- [ ] Tests: 90%+ coverage
- [ ] Cypress E2E: Multi-user scenario passing
- [ ] No race conditions
- [ ] Sonido opcional se reproduce
