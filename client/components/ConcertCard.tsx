"use client";

import { TicketmasterEvent } from "@/types/ticketmaster";

interface ConcertCardProps {
  event: TicketmasterEvent;
}

/**
 * Formata una data ISO a un format llegible en català.
 */
function formatDate(dateTime: string | null): string {
  if (!dateTime) return "Data per confirmar";
  try {
    const date = new Date(dateTime);
    return date.toLocaleDateString("ca-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateTime;
  }
}

/**
 * Retorna la configuració visual del badge segons l'estat de venda.
 */
function getSalesBadge(status: string) {
  switch (status.toLowerCase()) {
    case "onsale":
      return {
        label: "En Venda",
        classes:
          "bg-emerald/20 text-emerald border-emerald shadow-[0_0_10px_rgba(16,185,129,0.4)]",
      };
    case "soldout":
      return {
        label: "Esgotat",
        classes:
          "bg-magenta/20 text-magenta border-magenta shadow-[0_0_10px_rgba(255,0,160,0.6)]",
      };
    case "offsale":
      return {
        label: "Fora de Venda",
        classes:
          "bg-gray-700/50 text-gray-400 border-gray-600",
      };
    case "rescheduled":
      return {
        label: "Reprogramat",
        classes:
          "bg-amber/20 text-amber border-amber shadow-[0_0_10px_rgba(245,158,11,0.4)]",
      };
    case "cancelled":
      return {
        label: "Cancel·lat",
        classes:
          "bg-red-900/40 text-red-400 border-red-500",
      };
    default:
      return {
        label: status,
        classes: "bg-gray-700/50 text-gray-400 border-gray-600",
      };
  }
}

export default function ConcertCard({ event }: ConcertCardProps) {
  const badge = getSalesBadge(event.salesStatus);
  const isSoldOut = event.salesStatus.toLowerCase() === "soldout";
  const isCancelled = event.salesStatus.toLowerCase() === "cancelled";

  return (
    <div
      className={`group relative flex flex-col rounded-2xl overflow-hidden bg-surface transition-all duration-500 ease-out
        ${
          event.isHighlightedVenue
            ? "border-2 border-cyan/60 shadow-[0_0_25px_rgba(0,240,255,0.15)] hover:shadow-[0_0_40px_rgba(0,240,255,0.35)] hover:border-cyan"
            : "border border-white/5 hover:border-white/20 shadow-lg hover:shadow-2xl"
        }
        hover:-translate-y-1`}
    >
      {/* Imatge promocional */}
      <div className="relative h-52 overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-black flex items-center justify-center">
            <span className="text-cyan/15 text-5xl font-bold tracking-tighter rotate-[-8deg]">
              TIXFLOW
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />

        {/* Badge d'estat */}
        <div
          className={`absolute top-3 right-3 z-10 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-[0.15em] border ${badge.classes}`}
        >
          {badge.label}
        </div>

        {/* Badge de recinte destacat */}
        {event.isHighlightedVenue && (
          <div className="absolute top-3 left-3 z-10 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-[0.12em] bg-cyan/15 text-cyan border border-cyan/40 shadow-[0_0_10px_rgba(0,240,255,0.3)] flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Recinte Destacat
          </div>
        )}
      </div>

      {/* Contingut */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2 leading-tight group-hover:text-cyan transition-colors duration-300">
          {event.name}
        </h3>

        {/* Data */}
        <div className="flex items-start gap-2 text-sm text-gray-400 mb-2">
          <svg
            className="w-4 h-4 mt-0.5 text-cyan/70 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="capitalize">{formatDate(event.dateTime)}</span>
        </div>

        {/* Recinte */}
        <div className="flex items-start gap-2 text-sm text-gray-400 mb-4">
          <svg
            className="w-4 h-4 mt-0.5 text-cyan/70 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{event.venue}</span>
        </div>

        {/* Gènere / Segment */}
        {(event.genre || event.segment) && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {event.segment && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-magenta/10 text-magenta/80 border border-magenta/20">
                {event.segment}
              </span>
            )}
            {event.genre && event.genre !== "Undefined" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan/10 text-cyan/80 border border-cyan/20">
                {event.genre}
              </span>
            )}
          </div>
        )}

        {/* Preu + Botó */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            {event.priceMin !== null ? (
              <div className="text-base font-bold text-cyan">
                {event.priceMax !== null && event.priceMax !== event.priceMin
                  ? `${event.priceMin}€ – ${event.priceMax}€`
                  : `Des de ${event.priceMin}€`}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">Preu no disponible</div>
            )}
          </div>

          {!isCancelled && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                isSoldOut
                  ? "bg-surface border border-gray-600 text-gray-500 cursor-not-allowed pointer-events-none"
                  : "bg-gradient-to-r from-cyan to-cyan/80 text-background hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:scale-105 active:scale-95"
              }`}
            >
              {isSoldOut ? "Esgotat" : "Comprar"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
