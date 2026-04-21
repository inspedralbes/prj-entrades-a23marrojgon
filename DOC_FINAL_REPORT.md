# Informe del Projecte: **TixFlow**
**Alumne**: Marc Rojano (a23marrojgon)
**Data**: 21 d'abril de 2026

---

## 1. Explicació de la funcionalitat i Especificacions (Specs)

### Funcionalitat Principal
**TixFlow** és una plataforma de venda d'entrades d'alta demanda dissenyada per gestionar milers d'usuaris simultanis. La característica estrella és el seu **sistema de reserva i venda concurrent**, que garanteix que cap seient es vengui dues vegades (evitant l'overbooking).

**Característiques clau:**
- **Mapa de seients interactiu**: Visualització en temps real de l'estat dels seients.
- **Checkout segur**: Procés de compra protegit per transaccions atòmiques.
- **Control de concurrència**: Bloqueig a nivell de base de dades per evitar "race conditions".
- **Límits d'usuari**: Restricció de màxim 5 entrades per usuari per evitar l'especulació.
- **Notificacions en temps real**: Actualització instantània de l'estat del local mitjançant WebSockets.

### Especificacions Tècniques (Specs)
- **Frontend**: Next.js 15 (React) amb Tailwind CSS per a una interfície premium i responsiva.
- **Backend**: API RESTful amb Laravel 11.
- **Base de Dades**: MySQL 8.0 amb motor InnoDB (necessari per als locks de fila).
- **Temps Real**: Socket.io + Redis per a la sincronització de seients entre navegadors.
- **Infraestructura**: Docker i Docker Compose per a un entorn de desenvolupament i producció isolat.

---

## 2. Procés seguit amb la IA

El desenvolupament ha estat un procés de **Pair Programming** constant amb l'IA (Antigravity). El flux de treball ha seguit aquests passos:

1.  **Auditoria inicial**: Vaig demanar a l'IA que analitzés el codi del `CheckoutController` buscant vulnerabilitats sota pressió de trànsit. L'IA va identificar correctament que un "race condition" era possible.
2.  **Prototipat de solucions**: L'IA va proposar l'ús de `DB::transaction()` i `lockForUpdate()`. Vam iterar els prompts per assegurar que el bloqueig fos el més granular possible per no afectar el rendiment global.
3.  **Generació de Tests**: Un cop implementada la solució, l'IA va ajudar a escriure una suite de tests de concurrència complexos (`PHPUnit` i `Cypress`) que simulen molts usuaris comprant el mateix seient mil·lisegon a mil·lisegon.
4.  **Refactorització**: L'IA va suggerir millores en la gestió d'errors (com el codi 409 Conflict) i la implementació de reintents automàtics en cas de deadlocks.

---

## 3. Principals problemes trobats

1.  **Overbooking (Race Condition)**: Inicialment, dos usuaris podien comprar el mateix seient si feien clic exactament al mateix temps, ja que el sistema validava la disponibilitat abans de guardar, però sense bloquejar la fila.
2.  **Deadlocks de BD**: En aplicar bloquejos agressius, la base de dades a vegades es bloquejava si hi havia massa peticions creuades.
3.  **Sincronització de l'estat en el Client**: Mantenir el mapa de seients del frontend actualitzat amb el backend i Redis va ser complex, especialment en gestionar la desconnexió d'usuaris (un usuari que tanca el navegador ha d'alliberar els seients que tenia "seleccionats").
4.  **Configuració de Docker**: Orquestrar Redis, Laravel, Next.js i el servidor de Sockets en xarxes Docker diferents va presentar reptes de connectivitat.

---

## 4. Decisions preses (Canvis en prompts i specs)

- **Decisió Crítica: Bloqueig de Fila en lloc de Taula**: Vam decidir utilitzar `lockForUpdate()` especificament sobre les files dels seients sol·licitats. Això permet que el sistema sigui ràpid per a la resta d'usuaris mentre bloqueja només el que és necessari.
- **Ajust de l'Eina**: Inicialment, l'IA no considerava els reintents de transacció. Vaig haver d'ajustar el prompt per demanar-li que gestionés els `QueryException` de tipus deadlock, resultant en la inclusió del paràmetre `$attempts = 3` a la transacció de Laravel.
- **Inclusió de Cypress per concurrència**: Tot i que els unit tests son bons, vam decidir (via suggeriment de l'IA) implementar Cypress per validar que el mapa de seients realment canvia de color i bloqueja la interfície quan un altre usuari compra.

---

## 5. Valoració crítica real

Treballar amb una IA com a assistent de programació ha transformat completament la meva manera de desenvolupar:

**Punts positius:**
- **Velocitat**: Problemes que abans requerien hores de recerca a StackOverflow (com la configuració d'un Docker complex o lògica de transaccions) es resolen en minuts.
- **Qualitat**: L'IA actua com un segon parell d'ulls que no es cansa. M'ha obligat a escriure tests que d'una altra manera potser hauria ignorat.
- **Aprenentatge**: No només escriu codi; m'ha explicat *per què* un lock és millor que una simple validació, la qual cosa m'ha servit per entendre millor els internals de les bases de dades.

**Punts de reflexió:**
- Cal tenir un criteri propi. L'IA pot ser massa "optimista" o proposar solucions genèriques. Ajustar els prompts per donar el context del projecte (especialment sobre Docker i rutes de Laravel) és crucial per no perdre el temps amb al·lucinacions.

En conclusió, treballar així és com tenir un **Senior Developer** al costat 24/7. Fa que el procés sigui més creatiu i menys tediós, permetent-me centrar-me en la lògica de negoci i l'arquitectura.
