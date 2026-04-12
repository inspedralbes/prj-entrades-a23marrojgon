<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConcertController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::get('/concerts', [ConcertController::class, 'index']);

// Diagnostic route for Mail
Route::get('/test-mail', function () {
    try {
        $email = request('email', 'marcrojanog@gmail.com');
        \Illuminate\Support\Facades\Mail::raw("TixFlow Test - Aquest correu confirma que la configuració SMTP funciona correctament a producció.", function ($message) use ($email) {
            $message->to($email)
                    ->subject('TixFlow Diagnostic Test');
        });
        return response()->json([
            'status' => 'success', 
            'message' => "Correu enviat correctament a $email! Revisa la teva bústia (i la carpeta de Spam)."
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'hint' => 'Assegura\'t que estas usant una "App Password" de Gmail i que el MAIL_MAILER és "smtp".'
        ], 500);
    }
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/checkout', [\App\Http\Controllers\CheckoutController::class, 'process']);
    Route::get('/concerts/{id}/user-count', [ConcertController::class, 'userTicketsCount']);
    Route::get('/concerts/{id}/user-tickets', [ConcertController::class, 'userTickets']);

    // Admin routes
    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/sync-ticketmaster', [AdminController::class, 'syncTicketmaster']);
        Route::get('/concerts', [AdminController::class, 'concerts']);
        Route::post('/concerts', [AdminController::class, 'storeConcert']);
        Route::put('/concerts/{id}', [AdminController::class, 'updateConcert']);
        Route::delete('/concerts/{id}', [AdminController::class, 'destroyConcert']);
    });
});
