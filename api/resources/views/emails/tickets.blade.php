<!DOCTYPE html>
<html lang="ca">
<head>
    <meta charset="utf-8">
    <style>
        body {
            background-color: #020617;
            color: #ffffff;
            font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            padding: 20px 0;
        }
        .logo {
            font-size: 32px;
            font-weight: 900;
            color: #00f0ff;
            text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
            letter-spacing: 2px;
        }
        
        /* Disseny del Ticket */
        .ticket-card {
            background-color: #0f172a;
            border: 2px solid #00f0ff;
            border-radius: 20px;
            margin-bottom: 30px;
            overflow: hidden;
            position: relative;
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.15);
        }
        
        /* Efecte "perforat" lateral */
        .ticket-card::before, .ticket-card::after {
            content: "";
            position: absolute;
            top: 50%;
            width: 30px;
            height: 30px;
            background-color: #020617;
            border-radius: 50%;
            transform: translateY(-50%);
            z-index: 10;
        }
        .ticket-card::before { left: -15px; border-right: 2px solid #00f0ff; }
        .ticket-card::after { right: -15px; border-left: 2px solid #00f0ff; }

        .ticket-header {
            background: linear-gradient(90deg, #00f0ff 0%, #ff00a0 100%);
            padding: 15px;
            text-align: center;
            font-weight: bold;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 3px;
        }

        .ticket-body {
            padding: 30px;
            display: table;
            width: 100%;
            box-sizing: border-box;
        }

        .ticket-info {
            display: table-cell;
            vertical-align: top;
            width: 60%;
        }

        .ticket-qr-container {
            display: table-cell;
            vertical-align: middle;
            text-align: center;
            width: 40%;
            padding-left: 20px;
        }

        .concert-name {
            font-size: 24px;
            font-weight: 800;
            color: #fff;
            margin-bottom: 15px;
            line-height: 1.2;
        }

        .label {
            color: #94a3b8;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .value {
            color: #00f0ff;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
        }

        .qr-code {
            background-color: #fff;
            padding: 10px;
            border-radius: 12px;
            width: 180px;
            height: 180px;
            display: block;
            margin: 0 auto;
        }

        .footer-msg {
            text-align: center;
            color: #64748b;
            font-size: 14px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid rgba(148, 163, 184, 0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">TIXFLOW</div>
        </div>

        <div style="margin-bottom: 40px;">
            <h1 style="font-size: 24px;">Hola, {{ $userName }}!</h1>
            <p style="color: #94a3b8;">La teva compra s'ha realitzat amb èxit. Aquí tens les teves entrades digitals per al festival.</p>
        </div>
        
        @foreach($tickets as $ticket)
            @php
                $info = json_decode($ticket->seat_info);
                // Usant una API de QR més moderna i nítida
                $qrData = "TICKET:" . $ticket->id . "|CONCERT:" . $ticket->concert_id;
                $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" . urlencode($qrData) . "&bgcolor=ffffff&color=000000&margin=1";
            @endphp
            
            <div class="ticket-card">
                <div class="ticket-header">ENTRADA OFICIAL</div>
                <div class="ticket-body">
                    <div class="ticket-info">
                        <div class="concert-name">NEON CITY FESTIVAL</div>
                        
                        <div class="label">CODI DE TICKET</div>
                        <div class="value">#{{ str_pad($ticket->id, 6, '0', STR_PAD_LEFT) }}</div>

                        <div style="display: table; width: 100%;">
                            <div style="display: table-cell; width: 50%;">
                                <div class="label">ZONA</div>
                                <div class="value" style="color: #ff00a0;">{{ $info->zone }}</div>
                            </div>
                            <div style="display: table-cell; width: 50%;">
                                <div class="label">FILA / SEIENT</div>
                                <div class="value">{{ $info->row }} - {{ $info->col }}</div>
                            </div>
                        </div>

                        <div class="label">RECINTE</div>
                        <div class="value">PALAU SANT JORDI</div>
                    </div>
                    
                    <div class="ticket-qr-container">
                        <img src="{{ $qrUrl }}" class="qr-code" alt="Codi QR d'accés">
                        <div style="margin-top: 10px; font-size: 10px; color: #94a3b8;">ESCANEJA PER ENTRAR</div>
                    </div>
                </div>
            </div>
        @endforeach

        <div class="footer-msg">
            <p>Pots presentar aquestes entrades directament des del teu mòbil al control d'accés.</p>
            <p>&copy; 2026 TixFlow Barcelona. Cyber Experience Ticketing.</p>
        </div>
    </div>
</body>
</html>
