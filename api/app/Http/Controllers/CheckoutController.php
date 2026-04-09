<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\Concert;
use App\Mail\TicketPurchased;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
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
        
        $concert = Concert::where('tm_id', $concertId);
        if (is_numeric($concertId)) {
            $concert = $concert->orWhere('id', $concertId);
        }
        $concert = $concert->first();

        if (!$concert) {
            return response()->json([
                'message' => "El concert seleccionat no existeix a la base de dades local. Si us plau, demana a l'administrador que sincronitzi la cartellera."
            ], 404);
        }

        // Comprovar límit de 5 entrades per CONCERT per usuari
        $existingTicketsCount = 0;
        if ($concert) {
            $existingTicketsCount = Ticket::where('user_id', $user->id)
                ->where('concert_id', $concert->id)
                ->where('status', 'confirmed')
                ->count();
        }
            
        if (($existingTicketsCount + count($seats)) > 5) {
            return response()->json([
                'message' => "Has assolit el límit d'entrades per aquest concert. Ja tens $existingTicketsCount entrades i n'estàs intentant comprar " . count($seats) . ". El màxim per concert és 5."
            ], 400);
        }
        
        $totalPrice = 0;
        $ticketsCreated = [];

        foreach ($seats as $seat) {
            $ticket = Ticket::create([
                'user_id' => $user->id,
                'concert_id' => $concert ? $concert->id : null,
                'price' => $seat['price'],
                'seat_info' => json_encode([
                    'id' => $seat['id'],
                    'row' => $seat['row'],
                    'col' => $seat['col'],
                    'zone' => $seat['zone'] ?? 'Unknown',
                ]),
                'status' => 'confirmed',
            ]);
            
            $ticketsCreated[] = $ticket;
            $totalPrice += $seat['price'];

            // Notificar al servidor de sockets via Redis
            try {
                \Illuminate\Support\Facades\Redis::publish('ticket:sold', json_encode([
                    'concertId' => $concertId,
                    'zoneId' => $seat['zone'] ?? 'Unknown',
                    'seatId' => $seat['id'],
                    'status' => 'sold'
                ]));
            } catch (\Exception $e) {
                Log::error("Error publicant a Redis: " . $e->getMessage());
            }
        }

        // Enviar Email amb QR i informació del concert
        try {
            Mail::to($request->input('email'))->send(new TicketPurchased($ticketsCreated, $request->input('name'), $concert));
        } catch (\Exception $e) {
            Log::error("Error enviant email: " . $e->getMessage());
            // No fallem el checkout si falla l'email, però avisem al log
        }

        return response()->json([
            'message' => 'Compra realitzada correctament',
            'tickets' => $ticketsCreated,
            'total' => $totalPrice
        ]);
    }
}
