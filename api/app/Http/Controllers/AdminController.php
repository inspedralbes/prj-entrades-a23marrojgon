<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Concert;

class AdminController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function stats()
    {
        return response()->json([
            'users_count' => User::count(),
            'concerts_count' => Concert::count(),
            'total_sales' => 1284.50, // Simulated for now
            'tickets_sold' => 42,      // Simulated for now
        ]);
    }

    /**
     * List all users
     */
    public function users()
    {
        return response()->json(User::all());
    }

    /**
     * Concert CRUD: List all concerts
     */
    public function concerts()
    {
        return response()->json(Concert::all());
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
