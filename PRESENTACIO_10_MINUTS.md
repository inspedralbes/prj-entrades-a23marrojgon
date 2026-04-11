# 🎤 PRESENTACIÓ 10 MINUTS - TixFlow

**Durada**: Exactament 10 minuts  
**Estructura**: Demo → Codi → Tests → Conclusió

---

## ⏱️ TIMELINE

| Minut | Segment | Contingut |
|-------|---------|-----------|
| 0-1 | **Salutació** | Presenter, project name |
| 1-2 | **Contexte** | Per què és important la concurrència |
| 2-4 | **DEMO en vivo** | 2 navegadors, race condition evitada |
| 4-5 | **El Problema** | Una dia va trobar un bug |
| 5-6 | **La Solució** | `DB::transaction()` + `lockForUpdate()` |
| 6-7 | **Codi Explicat** | Mostrar CheckoutController |
| 7-8 | **Tests Demostrat** | Ejecutar `php artisan test` |
| 8-9 | **Problemes → Solucions** | Que he après |
| 9-10 | **Conclusions** | Resum + Questions |

---

## 📝 GUION COMPLETO

### 0️⃣ INTRODUCCIÓ (30 sec)

```
"Bon dia. Soc Marc Rojano, a23marrojgon.

Present TixFlow: Una plataforma de venda d'entrades per a 
eventos d'alta demanda, com concerts o esports.

L'objectiu és que els usuaris puguin comprar entrades sense 
problemes, fins i tot quan múltiples persones compren simultaneament."
```

### 1️⃣ EL CONTEXT (1 min)

```
"Imagineu que sou en un concert molt popular. 5000 persones 
intentan comprar entrades al mateixa hora.

La pregunta és: com garantitzem que el seient X no és venut 
a DOS usuaris simultàniament?

Aquí entra la CONCURRÈNCIA. Un problema real, molt comú en 
sistemes de tickets."
```

### 2️⃣ DEMO EN VIVO (2 min)

```
Mostrar a pantalla:
1. Obrir 2 navegadors (Usuario A i Usuario B)
2. Ambdós van a l'es mateixa eventó
3. Ambdós seleccionen l'ANTIC ASIENTO "A1"
4. Usuario B fa click "Confirmar Compra" → ✅ SUCCESS

   A continuació, Usuario A intenta confirmar:
5. Usuario A fa click "Confirmar Compra" → ❌ ERROR 409

Explicar: "Com ves, Usuario B va comprar primer. El seient 
estava bloquejat, així que Usuario A va rebre un error.
IMPOSSÍVEL que los dos tinguin el mateix asiento."
```

### 3️⃣ EL PROBLEMA (1 min)

```
"Però aquí ve el tvist. En la versió anterior del projecte, 
aquest problema NO estava resolt.

Si 2 usuaris omplien les mateixes dades i confirmaven al mateixa hora:
- Usuario A creava els ticket
- Usuario B TAMBIÉN els creava

Resultat: OVERBOOKING. 2 persones tenien l'entrada del seient A1.

Problemes així són comuns en sistemes que no controlen concurrència.
Airbnb, Amazon, Ticketmaster... totes han tengut aquest problema."
```

### 4️⃣ LA SOLUCIÓ (1.5 min)

```
Mostrar en el codi (GitHub o IDE):

1. TRANSACCIÓ ATÓMICA:
   DB::transaction(function() {
       // Tot aquí o res
   })

2. BLOQUEIG DE FILA:
   Ticket::where(...)->lockForUpdate()->count()
   
   "El lockForUpdate() BLOQUEJA la fila a la base de dades.
   Si Usuario A la té bloquejada, Usuario B ha d'esperar.
   Quan Usuario A acaba, Usuario B veu les dades actualitzades."

3. REINTENTOS:
   }, $attempts = 3)
   
   "Si passava un deadlock, reintentem fins a 3 vegades."
```

### 5️⃣ CODI DETALLAT (1 min)

```php
// Mostrar aquest codi i explicar lína per línia:

public function process(Request $request) {
    return DB::transaction(function() use ($user, $seats) {
    
        // 1. LOCK: Verifica límit de 5 entrades (bloquea fila usuario)
        $existingTickets = Ticket::where('user_id', $user->id)
            ->lockForUpdate()  // ← AQUÍ!
            ->count();
        
        if (($existingTickets + count($seats)) > 5) {
            return response()->json(['error' => 'Limit'], 400);
        }
        
        // 2. LOCK: Verifica que l'asiento NO és venut ja
        $alreadySold = Ticket::whereIn('seat_id', $seats)
            ->where('status', 'confirmed')
            ->lockForUpdate()  // ← AQUÍ!
            ->count();
        
        if ($alreadySold > 0) {
            return response()->json(['error' => 'Sold'], 409);
        }
        
        // 3. Si arribes aquí, SEGUR que pots crear ticket
        Ticket::create([...]);
        
    }, $attempts = 3);
}

Preguntar: "Veu? El lock GARANTIZA que si dos usuaris van aquí
simultàniament, un espera a l'altre. No s'entrecreuen."
```

### 6️⃣ TESTS DEMOSTRAÇÃO (1 min)

```
Ejecutar en terminal:

$ php artisan test tests/Feature/ConcurrencyCheckoutTest.php

Mostrar output:
✓ test_two_users_buying_same_seat_only_one_succeeds
✓ test_user_cannot_exceed_5_tickets_limit...
✓ test_multiple_users_concurrent_purchase
✓ test_multiple_users_buying_different_seats...

Tests:  4
Passed: 4 ✅
Failed: 0
```

Explicar: "Aquests 4 tests simulan múltiples usuaris. 
Cada test confirma que és impossible fer overbooking."
```

### 7️⃣ PROBLEMES → SOLUCIONS (1 min)

```
"Durant aquest projecte, encontré 3 problemes greus:

1. PROBLEMA: Race condition (2 usuarios = mismo ticket)
   SOLUCIÓ: lockForUpdate() + DB::transaction()
   
2. PROBLEMA: Sense reintentos en deadlock
   SOLUCIÓ: Agregar $attempts = 3
   
3. PROBLEMA: Sense tests de concurrència
   SOLUCIÓ: Crear 7 tests (4 PHPUnit + 3 Cypress)

L'aprenentatge més important? Que la concurrència és DIFÍCIL
i que sempre necessita tests, no només intuïció."
```

### 8️⃣ CONCLUSIONS (1 min)

```
"En resumen:

✅ TixFlow és una plataforma completa de venda d'entrades
✅ Gestiona concurrència de forma SEGURA
✅ Fins i tot amb 5000 usuaris simulants, funciona correcte
✅ Els tests demostran que és impossible fer overbooking

El projecte està llest per a producció.
Les úniques coses pending són:
- Admin panel amb més estadístiques (v2.0)
- WebRTC per a suport en live (opcional)

Qualsevol pregunta? Estem aquí per respons-la."
```

---

## 🎯 PUNTS CLAUS A RECORDAR

1. **No parlar massa ràpid** - Els de la audiència no coneixen el projecte
2. **Mostrar codi, no descriure** - Una imatge val 1000 paraules
3. **Demo sempre funciona** - Fer proves previ
4. **Prepara respostes a preguntes comunes**:
   - Per què Vue/Nuxt NO?
   - Per què Next.js?
   - Com deplojar en producció?
   - Quin és el cost de lockForUpdate()?

---

## 🔔 RECOMENDACIONS

### Dia de la Presentació

- ✅ Arribar 15 minuts antes
- ✅ Provar els cables, fonts, resolution
- ✅ Tester conexió WiFi/Ethernet
- ✅ Tenir el navegador obert amb les 2 pestanyes (A i B)
- ✅ Terminal Linux lista amb comando `php artisan test` llegit
- ✅ GitHub abertt (backup si fallaba la demo)

### Slides PowerPoint (Opcional)

- Slide 1: Portada (TixFlow, nom, data)
- Slide 2: Problema (race condition explained)
- Slide 3: Solució (lockForUpdate + transaction)
- Slide 4: El codi (captura de pantalla)
- Slide 5: Resultats (2 usuarios, 1 compra)
- Slide 6: Tests (4 tests passen)
- Slide 7: Conclusions

---

## ⚠️ COSES QUE NO MOSTRAR

- ❌ Errors de Docker/BD
- ❌ Código sin comentar
- ❌ Admin panel incomplete (si no funciona)
- ❌ WebRTC (si no funciona)
- ❌ Debugger breakpoints en vivo

---

## 📋 CHECKLIST PRE-PRESENTACIÓ

- [ ] Docker up and running
- [ ] Frontend + Backend funcionan
- [ ] Test de concurrència preparat
- [ ] 2 navegadores oberts (usuario A + B)
- [ ] GitHub repo públic i funcionant
- [ ] Código CheckoutController a man
- [ ] Presentación slides si les hay
- [ ] Preguntas preparadas per fer al tribunal

---

**Última verificación**: Día anterior a la presentación  
**Tiempo total**: 10:00 minutos exactos

