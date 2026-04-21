<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\Concert;
use App\Mail\TicketPurchased;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    /**
     * Procesa la compra de entradas con protección contra race conditions
     * 
     * ⚠️ CRÍTICO: Usa DB::transaction() + lockForUpdate() para garantizar
     * que dos usuarios NO pueden comprar el mismo asiento simultáneamente
     */
    public function process(Request $request)
    {
        $request->validate([
            'concert_id' => 'required',
            'seats' => 'required|array|min:1|max:5',
            'email' => 'required|email',
            'name' => 'required|string',
        ]);

        $user = $request->user();
        $seats = $request->input('seats');
        $concertId = $request->input('concert_id');
        $seatIds = array_column($seats, 'id'); // Para verificar duplicados
        
        // ==================================================
        // 🔒 TRANSACCIÓN ATÓMICA: Evita race conditions
        // ==================================================
        try {
            return DB::transaction(function () use ($user, $seats, $concertId, $seatIds, $request) {
                
                // 1️⃣ Obtener concert (sin lock, info inmutable)
                $concert = Concert::where('tm_id', $concertId);
                if (is_numeric($concertId)) {
                    $concert = $concert->orWhere('id', $concertId);
                }
                $concert = $concert->lockForUpdate()->first();

                if (!$concert) {
                    return response()->json([
                        'message' => "El concert seleccionat no existeix a la base de dades local."
                    ], 404);
                }

                // 2️⃣ 🔐 LOCK: Verificar límite DE 5 ENTRADES (LOCK para este usuario)
                // Esto bloquea cualquier otra transacción que intente modificar tickets de este usuario
                $existingTicketsCount = Ticket::where('user_id', $user->id)
                    ->where('concert_id', $concert->id)
                    ->where('status', 'confirmed')
                    ->count();
                    
                if (($existingTicketsCount + count($seats)) > 5) {
                    return response()->json([
                        'message' => "Has assolit el límit d'entrades. Ja tens $existingTicketsCount i n'estàs comprant " . count($seats)
                    ], 400);
                }

                // 3️⃣ 🔐 VERIFICAR DISPONIBILIDAD ASIENTOS (SIMPLIFICADO PARA POSTGRESQL)
                foreach ($seatIds as $id) {
                    $isSold = Ticket::where('concert_id', $concert->id)
                        ->where('status', 'confirmed')
                        ->whereRaw("seat_info->>'id' = ?", [(string)$id])
                        ->exists();

                    if ($isSold) {
                        return response()->json([
                            'message' => "El seient $id ja està venut. Si us plau, selecciona'n un altre."
                        ], 409);
                    }
                }

                // 4️⃣ CREAR TICKETS
                $totalPrice = 0;
                $ticketsCreated = [];

                foreach ($seats as $seat) {
                    $ticket = Ticket::create([
                        'user_id' => $user->id,
                        'concert_id' => $concert->id,
                        'price' => $seat['price'],
                        'seat_info' => [
                            'id' => $seat['id'],
                            'row' => $seat['row'],
                            'col' => $seat['col'],
                            'zone' => $seat['zone'] ?? 'Unknown',
                        ],
                        'status' => 'confirmed',
                    ]);
                    
                    $ticketsCreated[] = $ticket;
                    $totalPrice += $seat['price'];

                    // 5️⃣ NOTIFICAR SOCKETS (Temporalment desactivat per estabilitat total)
                    // La notificació ja la fa el front-end quan rep el OK
                }

                // 6️⃣ ENVIAR EMAIL
                try {
                    Mail::to($request->input('email'))->send(
                        new TicketPurchased($ticketsCreated, $request->input('name'), $concert)
                    );
                    Log::info("Email enviat correctament a: " . $request->input('email'));
                } catch (\Exception $e) {
                    Log::error("Error enviant email: " . $e->getMessage());
                    // NO bloqueamos la compra si el email falla, pero lo registramos
                }

                // 7️⃣ RESPUESTA EXITOSA
                Log::info("Compra exitosa", [
                    'user_id' => $user->id,
                    'concert_id' => $concert->id,
                    'tickets_count' => count($ticketsCreated),
                    'total' => $totalPrice
                ]);

                return response()->json([
                    'message' => 'Compra realitzada correctament',
                    'tickets' => $ticketsCreated,
                    'total' => $totalPrice
                ]);

                // Si algo falla aquí, Laravel revierte automáticamente la transacción
            }, $attempts = 3); // 3 reintentos si hay deadlock
            
        } catch (\Exception $e) {
            Log::error("Checkout error: " . $e->getMessage());
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}

