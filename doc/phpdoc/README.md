# 📖 PHPdoc Documentation

Aquí irá la documentación generada automáticamente desde el código PHP.

## Generación

```bash
cd api/
composer require --dev phpdocumentor/phpdocumentor
vendor/bin/phpdoc -d app -t ../doc/phpdoc
```

## Clases Principales Documentadas

- `App\Http\Controllers\CheckoutController` - Lógica de compra (con transacciones)
- `App\Http\Controllers\AuthController` - Autenticación
- `App\Http\Controllers\ConcertController` - Gestión de eventos
- `App\Models\User` - Modelo de usuario
- `App\Models\Concert` - Modelo de evento
- `App\Models\Ticket` - Modelo de entrada

## URL Publicada

Una vez generada, será publicada en: `https://daw.inspedralbes.cat/phpdoc/tixflow/`
