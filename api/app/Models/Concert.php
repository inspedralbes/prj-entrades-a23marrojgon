<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Concert extends Model
{
    use HasFactory;

    protected $fillable = [
        'tm_id',
        'name',
        'description',
        'date',
        'venue',
        'price',
        'total_tickets',
        'available_tickets',
        'image_url',
        'status',
    ];

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }
}
