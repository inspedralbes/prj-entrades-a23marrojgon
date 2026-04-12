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
                $concert = $concert->first();

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
                    ->lockForUpdate() // 🔒 CRÍTICO: Bloquea esta fila mientras dure la transacción
                    ->count();
                    
                if (($existingTicketsCount + count($seats)) > 5) {
                    return response()->json([
                        'message' => "Has assolit el límit d'entrades. Ja tens $existingTicketsCount i n'estàs comprant " . count($seats)
                    ], 400);
                }

                // 3️⃣ 🔐 VERIFICAR DISPONIBILIDAD ASIENTOS (CRÍTICO para concurrencia)
                // Contar cuántos asientos ya existen como "confirmados"
                $alreadySoldCount = Ticket::where('concert_id', $concert->id)
                ->where('status', 'confirmed')
                ->where(function($query) use ($seatIds) {
                    foreach ($seatIds as $id) {
                        $query->orWhereRaw("seat_info->>'id' = ?", [(string)$id]);
                    }
                })
                ->lockForUpdate() // 🔒 Bloquea estos registros
                ->count();

                if ($alreadySoldCount > 0) {
                    return response()->json([
                        'message' => 'Alguno de los asientos que intentas comprar ya ha sido vendido. Por favor selecciona otros.'
                    ], 409); // 409 Conflict
                }

                // 4️⃣ CREAR TICKETS (ahora sí que sabemos que están disponibles)
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

                    // 5️⃣ NOTIFICAR SOCKETS (dentro de transacción)
                    try {
                        \Illuminate\Support\Facades\Redis::publish('ticket:sold', json_encode([
                            'concertId' => $concert->tm_id ?? $concert->id,
                            'zoneId' => $seat['zone'] ?? 'Unknown',
                            'seatId' => $seat['id'],
                            'status' => 'sold'
                        ]));
                    } catch (\Exception $e) {
                        Log::error("Error Redis: " . $e->getMessage());
                        // Continuamos, pero lo registramos
                    }
                }

                // 6️⃣ ENVIAR EMAIL (al final, si todo va bien)
                try {
                    Mail::to($request->input('email'))->send(
                        new TicketPurchased($ticketsCreated, $request->input('name'), $concert)
                    );
                } catch (\Exception $e) {
                    Log::error("Error email: " . $e->getMessage());
                    // NO fallamos, pero lo anotamos
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
                'message' => 'Error processant la compra. Si us plau intenta-ho més tard.'
            ], 500);
        }
    }
}

