<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TicketPurchased extends Mailable
{
    use Queueable, SerializesModels;

    public $tickets;
    public $userName;
    public $concert;

    public function __construct($tickets, $userName, $concert = null)
    {
        $this->tickets = $tickets;
        $this->userName = $userName;
        $this->concert = $concert;
    }

    public function build()
    {
        return $this->subject('Les teves entrades per TixFlow')
                    ->view('emails.tickets');
    }
}
