<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Concert;
use App\Models\Ticket;

class AdminController extends Controller
{
    private const TM_API_KEY = 'lFJAG9ubY1mX21DlDpzmfL5ZORyKksyq';
    private const TM_BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';
    private const TARGET_VENUES = [
        ['name' => 'Palau Sant Jordi', 'ids' => ['Z598xZ2qZe6d7']],
        ['name' => 'Sant Jordi Club', 'ids' => ['Z198xZ2qZ1e1']],
        ['name' => 'Razzmatazz', 'ids' => ['Z198xZ2qZkeF', 'Z198xZ2qZd6k', 'Z198xZ2qZ771', 'Z598xZ2qZdvF1']],
    ];

    /**
     * Get dashboard statistics
     */
    public function stats()
    {
        return response()->json([
            'total_sales' => (float) Ticket::where('status', 'confirmed')->sum('price'),
            'tickets_sold' => 0, // Sol·licitat pel client (actualment 0 fins implementar selecció de seients)
            'users_count' => User::count(),
            'concerts_count' => Concert::count(),
        ]);
    }

    /**
     * List all users
     */
    public function users()
    {
        return response()->json(User::orderBy('created_at', 'desc')->get());
    }

    /**
     * Concert CRUD: List all concerts
     */
    public function concerts()
    {
        return response()->json(Concert::orderBy('date', 'asc')->get());
    }

    public function syncTicketmaster()
    {
        try {
            $syncedCount = 0;
            foreach (self::TARGET_VENUES as $venue) {
                foreach ($venue['ids'] as $venueId) {
                    $response = \Illuminate\Support\Facades\Http::get(self::TM_BASE_URL, [
                        'apikey' => self::TM_API_KEY,
                        'venueId' => $venueId,
                        'size' => 50,
                    ]);

                    if ($response->successful()) {
                        $data = $response->json();
                        $events = $data['_embedded']['events'] ?? [];

                        foreach ($events as $raw) {
                            $mapped = $this->mapTmEvent($raw);
                            
                            Concert::updateOrCreate(
                                ['tm_id' => $mapped['tm_id']],
                                [
                                    'name' => $mapped['name'],
                                    'description' => $mapped['description'],
                                    'date' => $mapped['date'],
                                    'venue' => $mapped['venue'],
                                    'price' => $mapped['price'],
                                    'total_tickets' => $mapped['total_tickets'],
                                    'available_tickets' => $mapped['total_tickets'], // Sincronització inicial
                                    'image_url' => $mapped['image_url'],
                                    'status' => 'active',
                                ]
                            );
                            $syncedCount++;
                        }
                    }
                    usleep(200000); // Rate limit protection
                }
            }

            return response()->json([
                'message' => "Sincronització completada: $syncedCount concerts processats.",
                'count' => $syncedCount
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error en la sincronització: ' . $e->getMessage()], 500);
        }
    }

    private function mapTmEvent($raw)
    {
        $venue = $raw['_embedded']['venues'][0] ?? null;
        $venueName = $venue['name'] ?? 'Recinte desconegut';
        
        $localTime = $raw['dates']['start']['localTime'] ?? '20:00:00';
        $dateTime = $raw['dates']['start']['localDate'] . ' ' . $localTime;

        $price = $raw['priceRanges'][0]['min'] ?? 45.00;

        return [
            'tm_id' => $raw['id'],
            'name' => $raw['name'],
            'description' => $raw['info'] ?? ($raw['description'] ?? 'Concert importat de Ticketmaster.'),
            'date' => $dateTime,
            'venue' => $venueName,
            'price' => $price,
            'total_tickets' => 500, // Valor per defecte si no ve de TM
            'image_url' => $this->getBestImage($raw['images'] ?? []),
        ];
    }

    private function getBestImage($images)
    {
        if (empty($images)) return null;
        $ratio16_9 = array_filter($images, function($img) {
            return ($img['ratio'] ?? '') === '16_9';
        });
        usort($ratio16_9, function($a, $b) {
            return ($b['width'] ?? 0) - ($a['width'] ?? 0);
        });
        return !empty($ratio16_9) ? $ratio16_9[0]['url'] : $images[0]['url'];
    }

    /**
     * Concert CRUD: Store a new concert
     */
    public function storeConcert(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'venue' => 'required|string',
            'price' => 'required|numeric',
            'total_tickets' => 'required|integer',
            'image_url' => 'nullable|url',
        ]);

        $validated['available_tickets'] = $validated['total_tickets'];
        
        $concert = Concert::create($validated);

        return response()->json($concert, 201);
    }

    /**
     * Concert CRUD: Update a concert
     */
    public function updateConcert(Request $request, $id)
    {
        $concert = Concert::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'date' => 'date',
            'venue' => 'string',
            'price' => 'numeric',
            'total_tickets' => 'integer',
            'available_tickets' => 'integer',
            'image_url' => 'nullable|url',
            'status' => 'string|in:active,cancelled,sold_out',
        ]);

        $concert->update($validated);

        return response()->json($concert);
    }

    /**
     * Concert CRUD: Delete a concert
     */
    public function destroyConcert($id)
    {
        $concert = Concert::findOrFail($id);
        $concert->delete();

        return response()->json(null, 204);
    }
}
