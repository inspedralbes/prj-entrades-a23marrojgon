# 📋 PLAN DE ACCIÓN - Requisitos Específicos de Presentación

**Data**: Abril 11, 2026  
**Status**: Diagnosing

---

## ❌ FALTA (vs. Requisitos Específicos)

### 1. README.md - Falta info requerida ⚠️

Tu README tiene:
- ✅ Developer: "Marc Rojano (a23marrojgon)"
- ✅ Objetivo breve: "Plataforma d'Entrades en Temps Real"
- ✅ Estado breve: "Sprint 1-5 completados"

Pero FALTA:
- ❌ **URL PHPdoc**: `https://daw.inspedralbes.cat/phpdoc/...`
- ❌ **URL Deployment**: `https://tixflow.daw.inspedralbes.cat/`
- ❌ **Enlace a Penpot/Figma**: Con exportación de pantallas
- ❌ **Carpeta CSS/img/JS**: Bien estructurada

### 2. GitHub ⚠️
- ❌ ¿Está el repositorio en GitHub público?
- ❌ ¿Tiene buena descripción?
- ❌ ¿README actualizado?

### 3. Prototipaje (Penpot/Figma/Wireframes) ❌
- ❌ Wireframes diseñados
- ❌ Prototipos exportados
- ❌ Enlace documentado

### 4. Documentación PHPdoc ❌
- ❌ Generada desde código
- ❌ Publicada en daw.inspedralbes.cat

### 5. Deployment Producción ❌
- ❌ Servidor en daw.inspedralbes.cat
- ❌ URL funcional desde browser

### 6. Demo + Presentación (10 min) ⚠️
- ⚠️ Demo preparada
- ⚠️ Fragmento código interesante
- ⚠️ Narrativa: Problema/Solución

---

## 📊 CHECKLIST POR SPRINT

### Sprint 1 (Este fin de semana)
- ✅ [HECHO] Arreglar race condition
- ✅ [HECHO] Tests concurrencia
- ⚠️ [TODO] Actualizar README con URLs requeridas
- ⚠️ [TODO] Crear wireframes básicos (Penpot/Figma)
- ⚠️ [TODO] Subir todo a GitHub

### Sprint 2
- ⚠️ [TODO] Deployment staging (daw.inspedralbes.cat)
- ⚠️ [TODO] Generar PHPdoc
- ⚠️ [TODO] Tests E2E flux normal

### Sprint 3
- ⚠️ [TODO] Admin panel básico
- ⚠️ [TODO] Rate limiting

### Sprint 4
- ⚠️ [TODO] Refinamientos
- ✅ [TODO] Preparar presentación 10 minutos

---

## 🎯 PRIORIDADES INMEDIATAS

### MUST HAVE (Esta semana)
1. ✅ README.md con URLs correctas
2. ✅ GitHub repositorio público + README
3. ✅ Wireframes básicos (5-10 pantallas)
4. ✅ Enlace a Penpot/Figma en README

### NICE TO HAVE (Próxima semana)
1. ⚠️ Deployment en daw.inspedralbes.cat
2. ⚠️ PHPdoc generada

### OPCIONAL (Después)
1. Refinamientos UI
2. WebRTC

---

## 📁 ESTRUCTURA RECOMENDADA

```
prj-entrades-a23marrojgon/
├── README.md                    ← Incluir URLs
├── CHECKLIST_FINAL.md
├── ...documentación...
│
├── api/                         (Backend Laravel)
│   └── app/Http/Controllers/
│       └── CheckoutController.php (con phpdoc comments)
│
├── client/                      (Frontend Next.js)
│   ├── public/
│   │   ├── css/               ← CSS files
│   │   ├── img/               ← Images
│   │   └── js/                ← JS files
│   └── components/
│
├── docs/
│   ├── wireframes/            ← Exportación Penpot/Figma
│   ├── phpdoc/                ← HTML generated
│   └── prototypes/
│
└── .github/                    ← GitHub badges, workflows
```

---

## 🔗 TEMPLATES A RELLENAR

### 1. README.md - UPDATES REQUERIDAS

```markdown
# 🎟️ TixFlow - Plataforma d'Entrades en Temps Real

## 👥 Desenvolupador
- **Marc Rojano** (a23marrojgon)

## 📝 Objectiu Breu
Plataforma de venda d'entrades amb sincronització temps real, 
gestió de concurrència i protecció contra race conditions.

## 📊 Estat Breu
- ✅ Core funcionalitats: COMPLET
- ✅ Tests concurrencia: 7/7 PASAN
- ⚠️ Deployment: Pending
- 🔜 Admin panel: v2.0

## 🔗 Enllaços Requerits

| Recurso | URL |
|---------|-----|
| **Documentació PHPdoc** | https://daw.inspedralbes.cat/phpdoc/tixflow/ |
| **Aplicació Desplegada** | https://tixflow.daw.inspedralbes.cat |
| **Prototipatge** | [Penpot](https://penpot.app/...) |
| **GitHub Repository** | [a23marrojgon/prj-entrades](https://github.com/) |

## 📂 Estructura de Carpetes

```
- Carpeta CSS:   client/public/css/
- Carpeta IMG:   client/public/img/
- Carpeta JS:    client/public/js/
```

...rest de README...
```

### 2. GitHub - Descripción Repositorio

```
Title: TixFlow - Plataforma d'Entrades en Temps Real
Description: 
Aplicació de venda d'entrades amb Socket.IO, concurrència 
segura (@lockForUpdate + DB::transaction), i tests.
Topics: php, laravel, nodejs, socket-io, concurrency, tickets
```

### 3. Wireframes - CREAR EN PENPOT/FIGMA

```
Pantallas mímimas:
1. Login/Register
2. Llistat events
3. Mapa seients (amb timer)
4. Checkout
5. Historial entrades
6. Admin dashboard (opcional)
```

---

## 🎤 PRESENTACIÓN - ESTRUCTURA 10 MINUTOS

```
Minuto 1-2:   Intro + Que es TixFlow (problema = race condition)
Minuto 3-4:   Demo en vivo (2 navegadores, mismo asiento)
Minuto 5-6:   Código interesante: DB::transaction + lockForUpdate
Minuto 7-8:   Tests (mostrar que pasan 7/7)
Minuto 9-10:  Problemas/Soluciones aprendidas
```

### Fragmento de Código a Explicar

```php
// CheckoutController.php - Lo más interesante

DB::transaction(function() {
    // 🔒 LOCK: Bloquea fila de usuario
    $existingTickets = Ticket::where('user_id', $user->id)
        ->lockForUpdate()  // ← CRÍTICO para evitar race condition
        ->count();
    
    // Verifica que asiento NO está vendido
    if ($alreadySold > 0) {
        return response()->json(['message' => '409 Conflict'], 409);
    }
    
    // Crear ticket SEGURO
    Ticket::create(/*...*/);
    
}, $attempts = 3);  // Reintentos si deadlock
```

**Explicar**:
- Problema: 2 usuarios podían comprar el mismo asiento
- Solución: Usar lockForUpdate() + transaction
- Resultado: Imposible race condition

---

## 📋 CHECKLIST SEMANAL

### Hoy (Viernes Abril 11)
- [ ] Actualizar README.md con URLs placeholders
- [ ] Crear repositorio GitHub público
- [ ] Subir código actual
- [ ] Crear wireframes básicos (Penpot/Figma)

### Próxima semana
- [ ] Deployment en staging (daw.inspedralbes.cat)
- [ ] PHPdoc configurada
- [ ] URLs finales en README

### Antes de defensa
- [ ] Demo grabada (backup)
- [ ] Slides preparadas (10 minutos)
- [ ] Código explicado y memorizado

---

## 🚀 COMANDOS RÁPIDOS

### GitHub Setup
```bash
# Si no existe:
git init
git add .
git commit -m "Initial commit: TixFlow platform"
git branch -M main
git remote add origin https://github.com/a23marrojgon/prj-entrades.git
git push -u origin main

# Si existe, verificar:
git remote -v
git log --oneline
```

### Wireframes - Crear en Penpot
```
1. Registrarse en penpot.app
2. Crear proyecto "TixFlow"
3. Diseñar 5-10 pantallas básicas
4. Exportar como PDF
5. Compartir enlace en README
```

### PHPdoc Generación (después)
```bash
# Instalar phpdocumentor (en api/)
composer require --dev phpdocumentor/phpdocumentor

# Generar
vendor/bin/phpdoc -d api/app -t docs/phpdoc

# Publicar en servidor
# (Instrucciones específicas del servidor daw.inspedralbes.cat)
```

---

## ⚠️ COSAS QUE FALTARÍAN

| Item | Riesgo | Solución |
|------|--------|----------|
| URLs deployment | Alto | Contactar admin daw.inspedralbes.cat |
| PHPdoc publicada | Medio | Generar localmente, subir después |
| Wireframes profesionales | Bajo | Básicos en Penpot suficiente |
| GitHub bien documentado | Alto | Escribir buenas commits messages |

---

## PRÓXIMOS PASOS

1. **Hoy**: Actualizar README + GitHub
2. **Mañana**: Crear wireframes en Penpot
3. **Próxima semana**: Deployment + PHPdoc
4. **Antes defensa**: Preparar slides + demo

---

**Status**: 🟡 PARCIAL - Necesita action plan
**Documento**: PLAN_DE_ACCION_PRESENTACION.md

