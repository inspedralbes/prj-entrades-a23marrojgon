# PROJECT_CONCEPT.md

> **Nom del Projecte:** TixFlow (Plataforma de Venda d’Entrades en Temps Real)
> **Tipus:** E-commerce d'Alta Concurrència i Temps Real
> **Públic Objectiu:** Usuaris compradors d'esdeveniments massius i Administradors de recintes.
> **Estat:** Setup inicial de la infraestructura Dockeritzada (Dev/Prod) ✓

---

## 1. Visió del Producte
**TixFlow** no és una botiga web clàssica. És una plataforma dissenyada per suportar **alta concurrència** on centenars d'usuaris competeixen pels mateixos seients al mateix temps. 

L'objectiu principal és garantir la integritat de les dades (evitar l'overbooking) i oferir una experiència reactiva. Si un usuari selecciona un seient, la resta d'usuaris connectats han de veure com aquest seient es bloqueja instantàniament a les seves pantalles sense necessitat de recarregar la pàgina.

---

## 2. Arquitectura Conceptual: La Font de la Veritat
El sistema es basa en el principi d'autoritat del servidor: **El client mai decideix l'estat d'un seient**.
L'arquitectura es divideix en tres pilars que treballen de forma coordinada:

1. **Frontend (Next.js + Zustand):** Renderitza la interfície (SSR per a la portada) i manté l'estat global reactiu al navegador.
2. **Backend API (Laravel + PostgreSQL):** És el "cervell" i la font de la veritat. Valida regles de negoci, gestiona pagaments i utilitza bloquejos de fila a PostgreSQL (`SELECT ... FOR UPDATE`) per garantir que dos usuaris no puguin reservar el mateix seient.
3. **Backend Real-time (Node.js + Socket.io):** Actua com un altaveu. Escolta els canvis confirmats per Laravel i els emet a tots els clients connectats en mil·lisegons.

---

## 3. Funcionalitats i Estats dels Seients
El nucli de l'aplicació és el mapa de seients interactiu. Cada seient pot tenir un d'aquests 4 estats, reflectits visualment:

* 🟢 **Disponible:** El seient està lliure i qualsevol pot fer-hi clic.
* 🟡 **Reservat (Bloqueig temporal):** Un altre usuari hi ha fet clic. S'inicia un temporitzador (ex: 5 minuts). Si no es compra, torna a estar disponible.
* 🔵 **Seleccionat per mi:** Jo he fet clic al seient i el servidor m'ha donat el bloqueig temporal. Veig el meu propi temporitzador de compte enrere.
* 🔴 **Venut:** Compra finalitzada. El seient queda bloquejat permanentment.

### Procés de Compra
1. L'usuari selecciona fins a *N* seients.
2. El servidor valida i bloqueja temporalment.
3. L'usuari introdueix les dades personals.
4. El servidor consolida la venda i emet l'esdeveniment via Socket.io perquè tothom vegi el seient en vermell (Venut).

---

## 4. Rols d'Usuari

1. **Client (Usuari Final):** Pot veure esdeveniments, interactuar amb el mapa de seients en temps real, realitzar reserves temporals i finalitzar compres.
2. **Administrador:** Accedeix a un panell privat (Dashboard). Pot crear esdeveniments, definir plànols de seients, preus i veure estadístiques d'ocupació i recaptació en temps real gràcies als WebSockets.

---

## 5. Sistema de Disseny UI i UX

### Gestió de Conflictes (UX)
Com que molts usuaris competeixen, la UI ha de ser amigable davant els errors. Si un usuari fa clic a un seient just el mil·lisegon després que un altre, rebrà una notificació de tipus "Toast" clara i ràpida: *"Aquest seient acaba de ser reservat per un altre usuari"*, i el seient canviarà a color groc.

### Paleta de Colors Semàntica
| Estat del Seient | Color Visual | Propòsit |
|------------------|--------------|----------|
| `--seat-available` | `#10b981` (Verd) | Acció permesa |
| `--seat-reserved` | `#f59e0b` (Groc/Ambre)| Bloquejat per un tercer |
| `--seat-mine` | `#3b82f6` (Blau) | Selecció actual de l'usuari |
| `--seat-sold` | `#ef4444` (Vermell) | Acció denegada (Venut) |

---

## 6. Estructura de Pantalles (Next.js App Router)

| Ruta | Descripció | Tipus de Renderitzat |
|------|-------------|----------------------|
| `/` | Portada amb el llistat d'esdeveniments propers. | SSR (Server Side Rendering) |
| `/events/[id]` | Pàgina de l'esdeveniment amb el mapa de seients. | Client Component (Reactiu) |
| `/checkout` | Formulari de pagament i temporitzador. | Client Component |
| `/tickets` | Consulta d'entrades comprades per l'usuari. | SSR / CSR |
| `/admin` | Dashboard de gestió en temps real per al recinte. | CSR protegida |

---

## 7. Documentació Tècnica (Context de la IA)
Aquest projecte utilitza el concepte de "Specs-Driven Development". Per a detalls específics sobre la implementació tècnica de cada microservei, llegeix els següents fitxers de context abans de generar codi:

* 📄 **Backend (Laravel API):** `api/CONTEXT.md`
* 📄 **Frontend (Next.js Client):** `client/CONTEXT.md`
* 📄 **Real-time (Node.js Sockets):** `socket/CONTEXT.md`
* 📄 **Especificacions IA (OpenSpec):** `/specs/foundations.md`

---

## 8. Estat d'Implementació

### Fase 1: Setup i Arquitectura ✅
- [x] Estructura Monorepo (api, client, socket, docker).
- [x] `docker-compose.dev.yml` per a desenvolupament local.
- [x] `docker-compose.prod.yml` preparat per a producció amb SSL i Nginx.
- [x] Configuració de PostgreSQL per a persistència.
- [x] Documentació de Project Concept inicialitzada.

### Fase 2: Backend i Base de Dades (En procés) 🔄
- [ ] Migracions per a Taules: Events, Seats, Users, Reservations.
- [ ] Lògica de bloqueig de concurrència (`LockForUpdate`).
- [ ] Endpoints RESTful per obtenir mapes d'estat.
- [ ] Connexió de Laravel amb Node.js per emissió d'esdeveniments.

### Fase 3: Temps Real i Frontend ⏳
- [ ] Connexió de Next.js amb Socket.io i Zustand.
- [ ] Dibuixat del mapa de seients interactiu.
- [ ] Temporitzador de reserva sincronitzat.
- [ ] Integració de pagament simulada / Checkout.
- [ ] Panell d'Administració en temps real.