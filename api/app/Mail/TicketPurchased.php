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

    public function __construct($tickets, $userName)
    {
        $this->tickets = $tickets;
        $this->userName = $userName;
    }

    public function build()
    {
        return $this->subject('Les teves entrades per TixFlow')
                    ->view('emails.tickets');
    }
}
