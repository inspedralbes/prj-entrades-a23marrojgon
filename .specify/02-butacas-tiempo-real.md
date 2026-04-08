# Spec: Sistema de Butacas en Tiempo Real

## Objetivo
Implementar la sincronización en tiempo real del estado de las butacas para evitar duplicidad en las compras.

## Requisitos Funcionales
1. **Estado de Selección:** Si un usuario selecciona las butacas (ej: 2, 3 y 4), estas deben marcarse como "En proceso de compra" para el resto de usuarios inmediatamente.
2. **Bloqueo de Compra:** Un usuario no puede seleccionar butacas que ya están siendo gestionadas por otro o que ya han sido compradas.
3. **Estado de Comprado:** Una vez finalizado el pago/proceso, la butaca debe cambiar permanentemente a "Ocupada".
4. **Zonas sin Butacas (Aforo):** Para las zonas de "pie" o sin asiento asignado, implementar un contador de aforo máximo. Al llegar al límite, el botón de compra debe deshabilitarse.

## Detalles Técnicos (Instrucciones para el Agente)
- Analiza mi estructura actual de base de datos/archivos para ver dónde se guardan los estados de las butacas.
- Utiliza **WebSockets** o **Server-Sent Events (SSE)** si el stack lo permite para el tiempo real. Si no, implementa un **polling eficiente** (consultas frecuentes).
- Mantén el diseño coherente con el CSS existente en el proyecto.

## Documentación Requerida
- Crea un archivo llamado `Documentacion_SpecKit.md` en la la capeta doc.
- Incluye en ese archivo:
  1. El prompt original que define esta tarea.
  2. Una explicación técnica de qué solución has elegido (WebSockets, SSE o Polling).
  3. Una lista de los archivos modificados y qué hace cada uno.
  4. Cómo probar que el tiempo real funciona.