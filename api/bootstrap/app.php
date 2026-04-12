<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);
        
        $middleware->redirectTo(
            guest: '/', // Fallback para web
        );

        // Aseguramos que las peticiones API no redirijan a login si no son JSON
        // Laravel 11/13 detecta Accept: application/json automáticamente, 
        // pero esto previene errores 500 si el cliente olvida la cabecera.
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
