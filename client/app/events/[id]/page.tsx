"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { socket } from '@/lib/socket';
import { useConcertStore } from '@/store/useConcertStore';
import VenueMapRouter from '@/components/VenueMapRouter';
import { MapZone } from '@/types/map';

export default function EventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { events, setEvents, setConnected, setError, setLastUpdated } = useConcertStore();
  
  const [selectedZone, setSelectedZone] = useState<MapZone | null>(null);
  const [tickets, setTickets] = useState<number>(1);

  // Trobar l'event actiu
  const event = events.find(e => e.id === params.id);

  // Inicialitzem la connexió Socket si venim directament a aquesta URL
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join:concerts');

    const handleEvents = (data: any) => {
      setEvents(data.events);
      setLastUpdated(data.lastUpdated);
      setError(data.error);
    };

    socket.on('ticketmaster:events', handleEvents);
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:concerts');
    });
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.off('ticketmaster:events', handleEvents);
    };
  }, [setEvents, setConnected, setLastUpdated, setError]);

  // Si l'event no es troba o encara s'està carregant (esperem WebSocket)
  if (!event) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-cyan/30 border-t-cyan rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium animate-pulse">Buscant dades de l'esdeveniment...</p>
      </div>
    );
  }

  // Càlcul total
  const totalPrice = selectedZone ? selectedZone.price * tickets : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Botó Tornar */}
      <button 
        onClick={() => router.push('/concerts')}
        className="flex items-center gap-2 text-cyan mb-8 hover:text-white transition-colors group"
      >
        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Tornar a concerts</span>
      </button>

      {/* Capçalera */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-3">
          {event.name}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-gray-400">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium text-white">{event.venue}</span>
          </div>
          <span className="hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="capitalize">{event.dateTime ? new Date(event.dateTime).toLocaleString('ca-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Data per confirmar'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* MAPA */}
        <div className="flex-1">
          <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-gray-200">Selecciona la teva zona</h3>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flexItems-center gap-1"><span className="w-3 h-3 rounded-full bg-cyan/40 border border-cyan drop-shadow-[0_0_5px_rgba(0,240,255,0.5)] inline-block"></span> Seleccionat</div>
                <div className="flexItems-center gap-1"><span className="w-3 h-3 rounded-full bg-surface border border-cyan/30 inline-block"></span> Disponible</div>
              </div>
            </div>
            
            {/* COMPONENT DINÀMIC DEL MAPA */}
            <VenueMapRouter 
              venueGroup={event.venueGroup || event.venue} 
              basePrice={event.priceMin || 35}
              selectedZoneId={selectedZone?.id || null}
              onZoneSelect={setSelectedZone}
            />

          </div>
        </div>

        {/* SIDEBAR DE COMPRA */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          <div className="bg-surface p-6 rounded-2xl border border-cyan/20 shadow-[0_0_30px_rgba(0,240,255,0.05)] sticky top-24">
            <h3 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-4">Resum de Compra</h3>
            
            {!selectedZone ? (
              <div className="text-center py-10 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p>Fes clic al mapa per seleccionar una zona</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* ZONA ECOLLIDA */}
                <div className="bg-background rounded-xl p-4 border border-cyan/30 shadow-[inset_0_0_20px_rgba(0,240,255,0.05)]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-400 font-medium">Zona Escollida</span>
                    <span className="text-cyan font-bold bg-cyan/10 px-2 py-0.5 rounded text-xs">{selectedZone.price}€ / ud</span>
                  </div>
                  <div className="text-lg font-bold text-white tracking-widest uppercase">{selectedZone.name}</div>
                </div>

                {/* QUANTITAT */}
                <div>
                  <label className="block text-sm text-gray-400 font-medium mb-2">Quantitat d'entrades</label>
                  <div className="flex items-center gap-4 bg-background border border-white/10 rounded-lg p-2">
                    <button 
                      onClick={() => setTickets(Math.max(1, tickets - 1))}
                      className="w-10 h-10 rounded-md bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                      disabled={tickets <= 1}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                    </button>
                    <span className="flex-1 text-center font-bold text-xl">{tickets}</span>
                    <button 
                      onClick={() => setTickets(Math.min(6, tickets + 1))}
                      className="w-10 h-10 rounded-md bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                      disabled={tickets >= 6}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Màxim 6 entrades per persona</p>
                </div>

                {/* TOTAL */}
                <div className="border-t border-white/10 pt-4 mt-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-gray-400 font-medium">Total a pagar</span>
                    <span className="text-3xl font-extrabold text-cyan">{totalPrice}€</span>
                  </div>
                </div>

                {/* BOTÓ PAGO */}
                <button 
                  className="w-full mt-2 bg-gradient-to-r from-cyan to-cyan/80 hover:from-cyan/90 hover:to-cyan text-background font-bold uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                >
                  Continuar al Pagament
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* ALERTA INFO */}
            <div className="mt-6 flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
              <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-blue-200/70 leading-relaxed">
                Aquests esdeveniments obtenen dades en <span className="text-blue-400 font-medium tracking-wide">Temps Real</span> des de Ticketmaster. Els preus poden variar i no inclouen despeses de gestió.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
