# 📋 OpenSpec: Seat Liberation Notifications

## opsx:propose - Foundations

### Context (Contexto)
En TixFlow, cuando un usuario selecciona asientos, los bloquea durante 5 minutos (TTL en Redis). Si el usuario:
- Se va sin comprar
- Desconecta
- Navega a otra página

Los asientos vuelven a estar disponibles. El problema actual es que **otros usuarios NO se enteran** de que esos asientos se liberaron. Siguen viendo esos asientos como reservados/bloqueados.

### Objetivo
Implementar un sistema de **notificaciones en tiempo real** que notifique a otros usuarios cuando unos asientos se liberan, para mejorar la experiencia y evitar confusión.

### Restricciones
1. **Tiempo real**: Debe ser instantáneo (Socket.IO)
2. **Por concierto**: Solo notificar a usuarios viendo el mismo concierto
3. **Por zona**: Específico a la zona donde se liberaron asientos
4. **No crítico**: No debe bloquear compra aunque falle notificación
5. **Performance**: No debe sobrecargar servidor con eventos

### Actores Principales
- **Usuario A**: Ve asientos libres
- **Usuario B**: Bloquea asientos por 5 min
- **Usuario C**: También está viendo mismos asientos
- **Sistema**: Detecta expiración de TTL + notifica

### Dependencias
- Socket.IO (ya existe)
- Redis TTL (ya existe)
- ZoneSeatMap component (ya existe)

---

## Requisitos Funcionales

### RF-1: Detectar liberación de asientos
- **Actor**: Sistema
- **Trigger**: Expiración TTL en Redis O usuario libera manualmente
- **Acción**: Emitir evento Socket.IO 'seat:liberated'
- **Datos**: { concertId, zoneId, seatId, previousUserId }

### RF-2: Notificar a usuarios conectados
- **Actor**: Servidor Socket.IO
- **Trigger**: Evento 'seat:liberated'
- **Acción**: Broadcast a sala 'concert:concertId' en zona específica
- **Datos**: { zoneId, seatId, timestamp }

### RF-3: Actualizar UI en cliente
- **Actor**: Frontend (ZoneSeatMap)
- **Trigger**: Recibir evento 'seat:liberated'
- **Acción**: 
  - Cambiar status asiento 'available'
  - Mostrar notificación toast
  - Play sonido optional
- **Visual**: Efecto "pulse" en asiento liberado

### RF-4: Persistencia en Redis
- **Cambiar**: Estado de 'userId' a 'available' cuando TTL expira
- **Guardar**: Log de evento para analytics

---

## Requisitos No-Funcionales

### RNF-1: Latencia
- Máximo 200ms entre liberación y notificación en cliente
- Máximo 100ms en socket.io

### RNF-2: Confiabilidad
- No perder notificaciones si usuario reconecta
- Sincronizar estado si llega atrasado

### RNF-3: Escalabilidad
- Soportar 100+ usuarios simultáneos en mismo concierto
- No duplicar notificaciones

---

## Restricciones Técnicas

- ✅ Usar Socket.IO event 'seat:liberated'
- ✅ Usar Redis para persistencia
- ✅ No modificar schema BD (solo Redux state)
- ✅ Mantener TypeScript types
- ✅ Tests obligatorios (Jest + Cypress)
