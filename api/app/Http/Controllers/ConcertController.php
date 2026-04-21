<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class ConcertController extends Controller
{
    private const TM_API_KEY = 'lFJAG9ubY1mX21DlDpzmfL5ZORyKksyq';
    private const TM_BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';
    private const POLL_INTERVAL_SECONDS = 300; // 5 minutos

    private const TARGET_VENUES = [
        ['name' => 'Palau Sant Jordi', 'ids' => ['Z598xZ2qZe6d7']],
        ['name' => 'Sant Jordi Club', 'ids' => ['Z198xZ2qZ1e1']],
        ['name' => 'Razzmatazz', 'ids' => ['Z198xZ2qZkeF', 'Z198xZ2qZd6k', 'Z198xZ2qZ771', 'Z598xZ2qZdvF1']],
    ];

    public function index()
    {
        // Usa Cache::remember para almacenar los eventos durante 5 minutos
        $eventsData = Cache::remember('ticketmaster_events', self::POLL_INTERVAL_SECONDS, function () {
            return $this->fetchAllVenueEvents();
        });

        if ($eventsData === null || isset($eventsData['error'])) {
            return response()->json([
                'events' => [],
                'lastUpdated' => now()->toIso8601String(),
                'error' => $eventsData['error'] ?? 'Error desconocido al obtener eventos.',
                'totalEvents' => 0,
            ], 500);
        }

        // Filtramos eventos pasados antes de enviar (en caso de que hayan caducado dentro de la caché)
        $validEvents = $this->filterPastEvents($eventsData);

        return response()->json([
            'events' => $validEvents,
            'lastUpdated' => now()->toIso8601String(),
            'error' => null,
            'totalEvents' => count($validEvents),
        ]);
    }

    private function fetchAllVenueEvents()
    {
        try {
            $allEvents = [];

            foreach (self::TARGET_VENUES as $venue) {
                foreach ($venue['ids'] as $venueId) {
                    try {
                        $events = $this->fetchEventsForVenue($venueId);
                        $allEvents = array_merge($allEvents, $events);
                    } catch (\Exception $e) {
                        \Log::error("Error Ticketmaster - {$venue['name']} ({$venueId}): " . $e->getMessage());
                    }
                    // Pequeño retardo si fuera necesario para rate limit en PHP
                    usleep(300000); // 300ms
                }
            }

            // Deduplicar por ID (un evento puede aparecer en múltiples salas Razzmatazz)
            $uniqueMap = [];
            foreach ($allEvents as $event) {
                $uniqueMap[$event['id']] = $event;
            }

            $uniqueEvents = array_values($uniqueMap);
            
            // Ordenar por fecha
            usort($uniqueEvents, function($a, $b) {
                if (!$a['dateTime']) return 1;
                if (!$b['dateTime']) return -1;
                return strtotime($a['dateTime']) - strtotime($b['dateTime']);
            });

            return $uniqueEvents;
        } catch (\Exception $e) {
            \Log::error("Error general Ticketmaster: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    private function fetchEventsForVenue($venueId)
    {
        $response = Http::get(self::TM_BASE_URL, [
            'apikey' => self::TM_API_KEY,
            'venueId' => $venueId,
            'size' => 200,
            'sort' => 'date,asc',
        ]);

        if (!$response->successful()) {
            throw new \Exception("HTTP {$response->status()} per venue {$venueId}");
        }

        $data = $response->json();
        $rawEvents = $data['_embedded']['events'] ?? [];
        
        return array_map([$this, 'mapEvent'], $rawEvents);
    }

    private function mapEvent($raw)
    {
        $venue = $raw['_embedded']['venues'][0] ?? null;
        $venueName = $venue['name'] ?? 'Recinte desconegut';
        $priceRanges = $raw['priceRanges'] ?? null;

        $dateTime = null;
        if (isset($raw['dates']['start']['localDate'])) {
            $localTime = $raw['dates']['start']['localTime'] ?? '00:00:00';
            $dateTime = $raw['dates']['start']['localDate'] . 'T' . $localTime;
        }

        return [
            'id' => $raw['id'],
            'name' => $raw['name'],
            'dateTime' => $dateTime,
            'venue' => $venueName,
            'venueGroup' => $this->getVenueLabel($venueName),
            'imageUrl' => $this->getBestImage($raw['images'] ?? []),
            'salesStatus' => $raw['dates']['status']['code'] ?? 'unknown',
            'priceMin' => $priceRanges[0]['min'] ?? null,
            'priceMax' => $priceRanges[0]['max'] ?? null,
            'ticketUrl' => $raw['url'] ?? '#',
            'isHighlightedVenue' => true,
            'genre' => $raw['classifications'][0]['genre']['name'] ?? null,
            'segment' => $raw['classifications'][0]['segment']['name'] ?? null,
        ];
    }

    public function userTicketsCount(Request $request, $concertId)
    {
        $user = $request->user();
        if (!$user) return response()->json(['count' => 0]);

        $count = \App\Models\Ticket::where('user_id', $user->id)
            ->whereIn('concert_id', function($query) use ($concertId) {
                $query->select('id')->from('concerts')
                    ->where('tm_id', $concertId)
                    ->orWhere('id', is_numeric($concertId) ? (int)$concertId : -1);
            })
            ->where('status', 'confirmed')
            ->count();

        return response()->json(['count' => $count]);
    }

    public function userTickets(Request $request, $concertId)
    {
        $user = $request->user();
        if (!$user) return response()->json(['tickets' => []]);

        $tickets = \App\Models\Ticket::where('user_id', $user->id)
            ->whereIn('concert_id', function($query) use ($concertId) {
                $query->select('id')->from('concerts')
                    ->where('tm_id', $concertId)
                    ->orWhere('id', is_numeric($concertId) ? (int)$concertId : -1);
            })
            ->where('status', 'confirmed')
            ->get();

        return response()->json(['tickets' => $tickets]);
    }

    private function getVenueLabel($venueName)
    {
        if (!$venueName) return 'Recinte desconegut';
        $lower = strtolower($venueName);
        if (str_contains($lower, 'sant jordi club')) return 'Sant Jordi Club';
        if (str_contains($lower, 'palau sant jordi')) return 'Palau Sant Jordi';
        if (str_contains($lower, 'razzmatazz') || str_contains($lower, 'razz')) return 'Razzmatazz';
        return $venueName;
    }

    private function getBestImage($images)
    {
        if (empty($images)) return '';
        
        // Filtrar ratio 16_9
        $ratio16_9 = array_filter($images, function($img) {
            return ($img['ratio'] ?? '') === '16_9';
        });

        // Ordenar por tamaño
        usort($ratio16_9, function($a, $b) {
            return ($b['width'] ?? 0) - ($a['width'] ?? 0);
        });

        if (!empty($ratio16_9)) {
            $first = reset($ratio16_9);
            return $first['url'];
        }

        usort($images, function($a, $b) {
            return ($b['width'] ?? 0) - ($a['width'] ?? 0);
        });

        $first = reset($images);
        return $first['url'];
    }

    private function filterPastEvents($events)
    {
        if (isset($events['error'])) return $events;

        $now = strtotime("today");
        
        return array_values(array_filter($events, function($event) use ($now) {
            if (empty($event['dateTime'])) return true;
            return strtotime($event['dateTime']) >= $now;
        }));
    }
}
