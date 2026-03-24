"use client";

import { useEffect, useState } from 'react';
import SeatMap from '@/components/SeatMap';
import { socket } from '@/lib/socket';

export default function EventPage(/* Props amb l'ID es faria servir aquí */) {
  const [isConnected, setIsConnected] = useState(false);

  // Inicialitzem la connexió Socket a la muntada (simulació)
  useEffect(() => {
    socket.connect();
    
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Per exemple:
    // socket.on('seat:updated', (data) => updateSeatStatus(data.seatId, data.status));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      // socket.off('seat:updated');
      socket.disconnect();
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white">
            Neon City Festival 2026
          </h1>
          <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' : 'bg-red-500/20 text-red-400 border border-red-500'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            {isConnected ? 'Connectat (Estadi Real)' : 'Desconnectat'}
          </div>
        </div>
        
        <p className="text-gray-400">
          📍 Estadi CyberGlitch, Barcelona <span className="mx-2">|</span> 📅 15 d'Agost, 2026 - 22:00h
        </p>
      </div>

      <SeatMap />
    </div>
  );
}
