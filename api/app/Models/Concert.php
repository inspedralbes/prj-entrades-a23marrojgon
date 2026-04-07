<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Concert extends Model
{
    use HasFactory;

    protected $fillable = [
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
}
