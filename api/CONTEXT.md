# Context del Backend (Laravel API)

## 1. Rol en l'Arquitectura
Aquest microservei actua com la **única font de la veritat** (`Single Source of Truth`). És l'encarregat de validar la lògica de negoci, processar pagaments, assegurar la integritat de les dades i notificar els canvis. 

**IMPORTANT:** El backend MAI confia en el client. Si el client diu "he reservat el seient 4", el backend comprova la base de dades, intenta fer el bloqueig i, només si té èxit, confirma la reserva.

## 2. Stack Tecnològic
* **Framework:** Laravel 11 (PHP 8.2)
* **Base de dades:** PostgreSQL 15 (Escollida expressament per la seva robustesa en concurrència).
* **Caché i Pub/Sub:** Redis (utilitzat per comunicar-se amb el servidor de Sockets).

## 3. Regles de Concurrència (CRÍTIC)
Per evitar l'overbooking (que dos usuaris comprin el mateix seient), TOTA operació de reserva ha d'utilitzar bloquejos de fila a la base de dades.
* S'ha d'utilitzar el mètode `lockForUpdate()` d'Eloquent en les transaccions de reserva.
* Exemple de flux: Iniciar transacció -> Llegir seient amb `lockForUpdate` -> Comprovar si està lliure -> Canviar estat a 'reservat' -> Crear registre de reserva amb `expires_at` -> Fer Commit.

## 4. Comunicació amb els Sockets
Aquest servei **no** gestiona connexions WebSocket directament. Quan l'estat d'un seient canvia (ex: de Lliure a Reservat), Laravel emet un esdeveniment cap a Redis (Pub/Sub) o fa una petició HTTP interna al microservei de Sockets perquè aquest últim ho retransmeti als usuaris.

## 5. Models Principals
* `Event`: L'esdeveniment (Concert, Partit).
* `Seat`: El seient físic. Relacionat amb Event. Té un camp `status` (available, reserved, sold).
* `Reservation`: El bloqueig temporal. Relacionat amb User i Seat. Té un camp `expires_at`.
* `Ticket`: La compra final confirmada.