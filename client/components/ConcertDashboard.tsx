"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useConcertStore } from "@/store/useConcertStore";
import ConcertCard from "@/components/ConcertCard";
import { TicketmasterEvent } from "@/types/ticketmaster";

export default function ConcertDashboard() {
  const { events, isConnected, lastUpdated, isLoading, error, setEvents, setConnected, setLastUpdated, setLoading, setError } =
    useConcertStore();

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join:concerts");

    const handleEvents = (data: { events: TicketmasterEvent[]; lastUpdated: string; error: string | null }) => {
      setEvents(data.events);
      setLastUpdated(data.lastUpdated);
      setError(data.error);
    };

    socket.on("ticketmaster:events", handleEvents);
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join:concerts");
    });
    socket.on("disconnect", () => setConnected(false));

    if (socket.connected) {
      setConnected(true);
    }

    const timeout = setTimeout(() => {
      if (events.length === 0) setLoading(false);
    }, 15000);

    return () => {
      socket.off("ticketmaster:events", handleEvents);
      socket.emit("leave:concerts");
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatLastUpdated = (iso: string | null) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleTimeString("ca-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan to-magenta">
              Concerts a Barcelona
            </h1>
            <p className="text-gray-400 text-base md:text-lg mt-2 max-w-2xl">
              Tots els esdeveniments als millors recintes de Barcelona.
              Dades en <span className="text-cyan font-medium">temps real</span> via Ticketmaster.
              Els events es mantenen fins que passi la seva data.
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-3 text-sm shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isConnected ? "bg-emerald" : "bg-gray-500"
                  }`}
                />
              </span>
              <span className={isConnected ? "text-emerald" : "text-gray-500"}>
                {isConnected ? "Connectat" : "Desconnectat"}
              </span>
            </div>
            {lastUpdated && (
              <span className="text-gray-500">
                Actualitzat: {formatLastUpdated(lastUpdated)}
              </span>
            )}
          </div>
        </div>

        {/* Venue legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-cyan/30 bg-cyan/5 text-cyan">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Palau Sant Jordi · Sant Jordi Club · Razzmatazz
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-8 p-4 rounded-xl bg-amber/10 border border-amber/30 text-amber flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="font-semibold text-sm">Error de l&apos;API Ticketmaster</p>
            <p className="text-sm text-amber/80 mt-1">{error}</p>
            <p className="text-xs text-amber/60 mt-2">
              El sistema reintentarà automàticament cada 5 minuts. Si la clau API acaba d&apos;activar-se, pot trigar uns minuts.
            </p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden bg-surface border border-white/5 animate-pulse"
            >
              <div className="h-52 bg-gray-800" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-800 rounded w-3/4" />
                <div className="h-4 bg-gray-800 rounded w-1/2" />
                <div className="h-4 bg-gray-800 rounded w-2/3" />
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="h-5 bg-gray-800 rounded w-20" />
                  <div className="h-9 bg-gray-800 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && events.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-2xl font-bold text-gray-300 mb-2">
            Cap esdeveniment trobat
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            {error
              ? "No s'han pogut carregar els esdeveniments. Comprova l'estat de l'API Ticketmaster."
              : "No s'han trobat esdeveniments a Barcelona en aquest moment. Les dades s'actualitzen automàticament cada 5 minuts."}
          </p>
        </div>
      )}

      {/* Grid d'esdeveniments */}
      {!isLoading && events.length > 0 && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-300">
              <span className="text-cyan font-bold">{events.length}</span>{" "}
              esdeveniments trobats
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <ConcertCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-16 mb-8 text-center text-xs text-gray-600">
        <p>
          Dades proporcionades per{" "}
          <a
            href="https://www.ticketmaster.es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-cyan transition-colors underline underline-offset-2"
          >
            Ticketmaster
          </a>
          . Ticketmaster no proporciona el nombre de seients lliures ni mapes
          interactius per motius de seguretat.
        </p>
      </div>
    </div>
  );
}
