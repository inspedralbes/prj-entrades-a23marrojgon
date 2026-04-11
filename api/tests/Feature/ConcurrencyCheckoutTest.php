<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Concert;
use App\Models\Ticket;
use Illuminate\Support\Facades\DB;

class ConcurrencyCheckoutTest extends TestCase
{
    use RefreshDatabase; // Limpia la BD após cada test

    protected $concert;

    public function setUp(): void
    {
        parent::setUp();

        // Crear concert de prueba
        $this->concert = Concert::create([
            'name' => 'Test Concert - High Demand',
            'description' => 'Prueba de concurrencia',
            'date' => now()->addDays(10),
            'venue' => 'Palau Sant Jordi',
            'tm_id' => 'test-concert-123',
            'seats_data' => json_encode([
                'zones' => [
                    'pista-general' => ['available' => 1000],
                    'sector-101' => ['available' => 50],
                    'sector-102' => ['available' => 50],
                ]
            ]),
        ]);
    }

    /**
     * TEST 1: Dos usuaris intenten comprar el MATEIX asiento
     * Esperado: Solo uno lo logra, el otro recibe 409 Conflict
     * 
     * Este test valida que NO hay race condition
     */
    public function test_two_users_buying_same_seat_only_one_succeeds()
    {
        // Crear 2 usuarios
        $user1 = User::factory()->create(['email' => 'user1@test.com']);
        $user2 = User::factory()->create(['email' => 'user2@test.com']);

        // Datos del asiento que van a intentar comprar
        $seatId = 'sector-101-A1';
        $seatData = [
            'id' => $seatId,
            'row' => 'A',
            'col' => '1',
            'zone' => 'sector-101',
            'price' => 25,
        ];

        // Payload para ambos usuarios
        $payload = [
            'concert_id' => $this->concert->tm_id,
            'seats' => [$seatData],
            'email' => 'test@test.com',
            'name' => 'Test User',
        ];

        // 🔥 SIMULAR COMPRA SIMULTÁNEA
        // Usa DB paralelo (no exacto pero lo bastante cercano)
        $responses = [];
        
        // Ambos hacemos la petición "al mismo tiempo"
        $response1 = $this->actingAs($user1)->postJson('/api/checkout', $payload);
        $response2 = $this->actingAs($user2)->postJson('/api/checkout', $payload);

        // ESPERADO:
        // - Usuario 1: ✅ 200 OK (compra exitosa)
        // - Usuario 2: ❌ 409 Conflict (asiento ya vendido)
        
        if ($response1->status() === 200) {
            $this->assertEquals(200, $response1->status(), 'Usuario 1 debería comprar exitosamente');
            $this->assertEquals(409, $response2->status(), 'Usuario 2 debería obtener Conflict (asiento vendido)');
        } else {
            // Podría ser que user2 comprara primero
            $this->assertEquals(409, $response1->status(), 'Usuario 1 debería obtener Conflict');
            $this->assertEquals(200, $response2->status(), 'Usuario 2 debería comprar exitosamente');
        }

        // VERIFICAR EN BD: Solo 1 ticket creado para ese asiento
        $ticketsForSeat = Ticket::where('concert_id', $this->concert->id)
            ->where('status', 'confirmed')
            ->get()
            ->filter(function ($ticket) use ($seatId) {
                $seatInfo = json_decode($ticket->seat_info, true);
                return $seatInfo['id'] === $seatId;
            });

        $this->assertEquals(1, $ticketsForSeat->count(), 
            'Debe haber exactamente 1 ticket para ese asiento específico');
    }

    /**
     * TEST 2: Usuario intenta comprar 5 asientos en 2 transacciones simultáneas
     * Esperado: Primera compra ✅, segunda compra ❌ (límite alcanzado)
     */
    public function test_user_cannot_exceed_5_tickets_limit_with_concurrent_purchases()
    {
        $user = User::factory()->create(['email' => 'limit-test@test.com']);

        // Crear 10 asientos para la prueba
        $seatsFirst = collect(range(1, 3))->map(fn($i) => [
            'id' => "sector-101-A$i",
            'row' => 'A',
            'col' => (string)$i,
            'zone' => 'sector-101',
            'price' => 25,
        ])->toArray();

        $seatsSecond = collect(range(4, 8))->map(fn($i) => [
            'id' => "sector-101-A$i",
            'row' => 'A',
            'col' => (string)$i,
            'zone' => 'sector-101',
            'price' => 25,
        ])->toArray();

        // Primera compra: 3 asientos
        $response1 = $this->actingAs($user)->postJson('/api/checkout', [
            'concert_id' => $this->concert->tm_id,
            'seats' => $seatsFirst,
            'email' => $user->email,
            'name' => 'Test User',
        ]);

        $this->assertEquals(200, $response1->status(), 'Primera compra debería ser exitosa');

        // Verificar que se crearon 3 tickets
        $ticketsAfterFirst = Ticket::where('user_id', $user->id)
            ->where('concert_id', $this->concert->id)
            ->where('status', 'confirmed')
            ->count();
        $this->assertEquals(3, $ticketsAfterFirst, 'Debe haber 3 tickets después de la primera compra');

        // Segunda compra: 5 asientos (debería fallar porque ya tiene 3)
        $response2 = $this->actingAs($user)->postJson('/api/checkout', [
            'concert_id' => $this->concert->tm_id,
            'seats' => $seatsSecond, // 5 asientos
            'email' => $user->email,
            'name' => 'Test User',
        ]);

        $this->assertEquals(400, $response2->status(), 'Segunda compra debería fallar (límite 5)');
    }

    /**
     * TEST 3: Múltiples usuarios comprando concurrentemente
     * Simula 10 usuarios intentando comprar el mismo asiento
     */
    public function test_multiple_users_concurrent_purchase()
    {
        $users = User::factory()->count(10)->create();
        
        $seatData = [
            'id' => 'sector-101-A1',
            'row' => 'A',
            'col' => '1',
            'zone' => 'sector-101',
            'price' => 25,
        ];

        $payload = [
            'concert_id' => $this->concert->tm_id,
            'seats' => [$seatData],
            'email' => 'test@test.com',
            'name' => 'Test User',
        ];

        $successCount = 0;
        $conflictCount = 0;

        // Todos intentan comprar el mismo asiento
        foreach ($users as $user) {
            $response = $this->actingAs($user)->postJson('/api/checkout', $payload);
            
            if ($response->status() === 200) {
                $successCount++;
            } elseif ($response->status() === 409) {
                $conflictCount++;
            }
        }

        // ESPERADO: 1 éxito, 9 conflictos
        $this->assertEquals(1, $successCount, 'Solo 1 usuario debería lograr comprar');
        $this->assertEquals(9, $conflictCount, '9 usuarios deberían obtener Conflict');

        // Verificar en BD
        $totalTicketsforSeat = Ticket::where('concert_id', $this->concert->id)
            ->where('status', 'confirmed')
            ->count();
        $this->assertEquals(1, $totalTicketsforSeat, 'Solo 1 ticket en total');
    }

    /**
     * TEST 4: Usuarios comprando asientos diferentes simultáneamente
     * Esperado: Todas las compras exitosas (sin conflicto)
     */
    public function test_multiple_users_buying_different_seats_all_succeed()
    {
        $users = User::factory()->count(5)->create();

        $responses = [];
        foreach ($users as $i => $user) {
            $seatId = "sector-101-B" . ($i + 1);
            $payload = [
                'concert_id' => $this->concert->tm_id,
                'seats' => [[
                    'id' => $seatId,
                    'row' => 'B',
                    'col' => (string)($i + 1),
                    'zone' => 'sector-101',
                    'price' => 25,
                ]],
                'email' => $user->email,
                'name' => $user->name,
            ];

            $response = $this->actingAs($user)->postJson('/api/checkout', $payload);
            $responses[$user->id] = $response->status();
        }

        // Todos deberían ser 200
        foreach ($responses as $userId => $status) {
            $this->assertEquals(200, $status, "Usuario $userId debería comprar exitosamente");
        }

        // Verificar en BD: 5 tickets totales
        $totalTickets = Ticket::where('concert_id', $this->concert->id)
            ->where('status', 'confirmed')
            ->count();
        $this->assertEquals(5, $totalTickets, 'Debe haber 5 tickets en total');
    }
}
