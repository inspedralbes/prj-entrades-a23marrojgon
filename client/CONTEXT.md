# Context del Frontend (Next.js Client)

## 1. Rol en l'Arquitectura
És la interfície d'usuari reactiva. La seva responsabilitat principal és mostrar l'estat actual de l'esdeveniment i reaccionar **instantàniament** als esdeveniments rebuts pel servidor de WebSockets, actualitzant la UI sense recarregar la pàgina.

## 2. Stack Tecnològic
* **Framework:** Next.js (App Router) amb React.
* **Estils:** Tailwind CSS.
* **Estat Global:** Zustand (Requisit obligatori com a alternativa a Pinia en l'ecosistema React).
* **Temps Real:** `socket.io-client`.

## 3. Regles de Renderitzat (SSR vs CSR)
L'enunciat del projecte exigeix Server Side Rendering (SSR) per a la portada.
* Les pàgines com la portada (`app/page.tsx`) han de ser Server Components per fer fetch inicial de dades des de Laravel i afavorir el SEO.
* El mapa de seients interactiu (`app/events/[id]/page.tsx`) necessita temps real i estat global, per tant, el component del mapa haurà de portar la directiva `"use client"`.

## 4. Gestió d'Estat amb Zustand
L'estat global és obligatori per aprovar. Zustand ha d'emmagatzemar:
1. La llista de seients de l'esdeveniment actual i els seus estats.
2. Les reserves temporals de l'usuari actiu.
3. El temps restant del temporitzador de reserva.
Quan s'escolta un esdeveniment via Socket.io (ex: `seat:updated`), s'ha de disparar una acció de Zustand per mutar l'estat global, la qual cosa provocarà un re-renderitzat automàtic del seient a la UI.

## 5. Gestió d'Errors i UX
S'ha de donar feedback immediat a l'usuari. Si s'intenta reservar un seient i l'API de Laravel retorna un error de concurrència (Status 409 Conflict), s'ha de mostrar una notificació "Toast" i actualitzar el color del seient a "Reservat per un altre usuari".