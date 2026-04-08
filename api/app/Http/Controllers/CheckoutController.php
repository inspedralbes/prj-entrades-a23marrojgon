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
        
        // Comprovar límit de 5 entrades TOTALS per usuari
        $existingTicketsCount = Ticket::where('user_id', $user->id)->count();
        if (($existingTicketsCount + count($seats)) > 5) {
            return response()->json([
                'message' => "Has assolit el límit d'entrades. Ja tens $existingTicketsCount entrades i n'estàs intentant comprar " . count($seats) . ". El màxim és 5."
            ], 400);
        }

        $totalPrice = 0;

        // Intentem trobar el concert (encara que sigui un ID de Ticketmaster, 
        // podríem tenir-lo a la nostra DB o crear un placeholder).
        // Per simplicitat, usarem el nom que ens enviï el front si no el tenim.
        
        $ticketsCreated = [];

        foreach ($seats as $seat) {
            $ticket = Ticket::create([
                'user_id' => $user->id,
                'concert_id' => $concertId,
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
        }

        // Enviar Email amb QR
        try {
            Mail::to($request->input('email'))->send(new TicketPurchased($ticketsCreated, $request->input('name')));
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
