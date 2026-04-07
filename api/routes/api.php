<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConcertController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/concerts', [ConcertController::class, 'index']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

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
