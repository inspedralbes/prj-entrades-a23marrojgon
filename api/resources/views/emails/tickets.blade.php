<!DOCTYPE html>
<html lang="ca">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            background-color: #020617;
            color: #ffffff;
            font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #020617;
            padding-bottom: 60px;
        }
        .main {
            background-color: transparent;
            margin: 0 auto;
            width: 100%;
            max-width: 600px;
            border-spacing: 0;
            color: #ffffff;
        }
        .header {
            padding: 40px 0 20px 0;
            text-align: center;
        }
        .logo {
            font-size: 42px;
            font-weight: 900;
            color: #00f0ff;
            text-decoration: none;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-style: italic;
        }
        
        /* Disseny del Ticket Premium */
        .ticket-container {
            padding: 20px;
        }
        .ticket {
            background-color: #0f172a;
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid rgba(0, 240, 255, 0.2);
            box-shadow: 0 20px 50px rgba(0, 240, 255, 0.1);
            margin-bottom: 40px;
        }
        .ticket-hero {
            position: relative;
            height: 250px;
            background-size: cover;
            background-position: center;
        }
        .ticket-hero-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 100%;
            background: linear-gradient(to bottom, transparent 0%, rgba(15, 23, 42, 1) 100%);
        }
        .ticket-content {
            padding: 30px;
            text-align: left;
        }
        .concert-name {
            font-size: 32px;
            font-weight: 900;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: -1px;
            line-height: 1;
        }
        .venue-name {
            color: #00f0ff;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 14px;
            letter-spacing: 2px;
            margin-bottom: 30px;
        }
        
        .divider {
            height: 1px;
            background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0, rgba(255, 255, 255, 0.1) 5px, transparent 5px, transparent 10px);
            margin: 25px 0;
        }

        .info-grid {
            width: 100%;
            margin-bottom: 20px;
        }
        .info-label {
            color: #94a3b8;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 900;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 18px;
            font-weight: 800;
            color: #fff;
        }

        .qr-section {
            background-color: #1e293b;
            padding: 40px 30px;
            text-align: center;
            border-top: 2px dashed rgba(255, 255, 255, 0.05);
        }
        .qr-outer {
            display: inline-block;
            background: linear-gradient(135deg, #00f0ff 0%, #ff00a0 100%);
            padding: 4px;
            border-radius: 20px;
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.2);
        }
        .qr-inner {
            background: #fff;
            padding: 15px;
            border-radius: 17px;
        }
        .qr-image {
            display: block;
            width: 160px;
            height: 160px;
        }
        
        .footer {
            text-align: center;
            padding: 0 40px;
        }
        .footer p {
            color: #475569;
            font-size: 13px;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #00f0ff;
            color: #020617;
            padding: 16px 32px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 14px;
            letter-spacing: 1px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <center>
            <table class="main" width="100%">
                <tr>
                    <td class="header">
                        <div class="logo">TIXFLOW</div>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="padding: 0 30px 40px 30px;">
                        <h1 style="font-size: 32px; font-weight: 900; margin-bottom: 10px;">PREPARA'T, {{ strtoupper($userName) }}!</h1>
                        <p style="color: #94a3b8; font-size: 16px;">La teva missió ha estat confirmada. Ens veiem a l'escenari.</p>
                    </td>
                </tr>
                
                @foreach($tickets as $ticket)
                    @php
                        $info = json_decode($ticket->seat_info);
                        $qrData = "TICKET:" . $ticket->id . "|CONCERT:" . $ticket->concert_id;
                        $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" . urlencode($qrData) . "&bgcolor=ffffff&color=000000&margin=1";
                        $concertImage = $concert && $concert->image_url ? $concert->image_url : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop';
                    @endphp
                    <tr>
                        <td class="ticket-container">
                            <div class="ticket">
                                <div class="ticket-hero" style="background-image: url('{{ $concertImage }}');">
                                    <div class="ticket-hero-overlay"></div>
                                    <div style="position: absolute; top: 20px; right: 20px; background: rgba(0, 240, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(0, 240, 255, 0.3); color: #00f0ff; padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: 900; letter-spacing: 1px;">
                                        ACCESS CONFIRMED
                                    </div>
                                </div>
                                <div class="ticket-content">
                                    <div class="concert-name">{{ $concert ? $concert->name : 'NEON EXPERIENCE' }}</div>
                                    <div class="venue-name">{{ $concert ? $concert->venue : 'UNKNOWN SECTOR' }}</div>
                                    
                                    <div class="divider"></div>
                                    
                                    <table width="100%">
                                        <tr>
                                            <td width="33%">
                                                <div class="info-label">DATA</div>
                                                <div class="info-value">{{ $concert ? date('d.m.Y', strtotime($concert->date)) : 'TBD' }}</div>
                                            </td>
                                            <td width="33%">
                                                <div class="info-label">HORA</div>
                                                <div class="info-value">{{ $concert ? date('H:i', strtotime($concert->date)) : '21:00' }}h</div>
                                            </td>
                                            <td width="33%">
                                                <div class="info-label">TICKET ID</div>
                                                <div class="info-value">#{{ str_pad($ticket->id, 5, '0', STR_PAD_LEFT) }}</div>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <div style="margin-top: 30px;">
                                        <table width="100%">
                                            <tr>
                                                <td width="50%">
                                                    <div class="info-label">SECTOR / ZONA</div>
                                                    <div class="info-value" style="color: #ff00a0;">{{ strtoupper($info->zone) }}</div>
                                                </td>
                                                <td width="50%">
                                                    <div class="info-label"> FILA / BUTACA</div>
                                                    <div class="info-value">{{ $info->row }} / {{ $info->col }}</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                                
                                <div class="qr-section">
                                    <div class="qr-outer">
                                        <div class="qr-inner">
                                            <img src="{{ $qrUrl }}" class="qr-image" alt="QR Access Code">
                                        </div>
                                    </div>
                                    <div style="margin-top: 20px; color: #94a3b8; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
                                        Presenta aquest codi a l'entrada
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                @endforeach
                
                <tr>
                    <td class="footer">
                        <p>Aquesta és una entrada digital oficial. Si us plau, descarrega-la al teu dispositiu o imprimeix-la per garantir un accés ràpid al recinte.</p>
                        <p>&copy; 2026 TIXFLOW. Tecnologia desenvolupada per la digitalització total d'esdeveniments.</p>
                    </td>
                </tr>
            </table>
        </center>
    </div>
</body>
</html>
