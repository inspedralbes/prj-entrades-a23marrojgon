"use client";

import { Seat as SeatType, useTicketStore } from '@/store/useTicketStore';
import { socket } from '@/lib/socket';

interface SeatProps {
  seat: SeatType;
}

export default function Seat({ seat }: SeatProps) {
  const { toggleSeatSelection, selectedSeatIds } = useTicketStore();
  const isSelected = selectedSeatIds.includes(seat.id);

  // Colors segons la semàntica indicada:
  const getColorClass = () => {
    if (isSelected || seat.status === 'mine') return 'bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]'; // Blau (Seleccionat/Meu)
    if (seat.status === 'available') return 'bg-emerald-500 border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.8)] cursor-pointer'; // Verd (Disponible)
    if (seat.status === 'reserved') return 'bg-amber-500 border-amber-400 cursor-not-allowed opacity-80'; // Groc (Reservat)
    if (seat.status === 'sold') return 'bg-red-500 border-red-800 cursor-not-allowed opacity-50'; // Vermell (Venut)
    return 'bg-surface';
  };

  const handleSeatClick = () => {
    // Si està venut o reservat, ignorem el click completament
    if (seat.status === 'sold' || seat.status === 'reserved') return;

    // Actualitzem l'estat local
    toggleSeatSelection(seat);

    // En un entorn real, aquí s'enviaria la comanda al WebSocket
    // socket.emit('seat:reserve', { seatId: seat.id });
  };

  return (
    <button
      onClick={handleSeatClick}
      disabled={seat.status === 'sold' || seat.status === 'reserved'}
      title={`Seient ${seat.id} - ${seat.price}€`}
      className={`
        w-10 h-10 md:w-12 md:h-12 rounded-t-lg rounded-b-sm
        flex items-center justify-center
        text-xs font-bold text-white
        border-t-4 transition-all duration-200
        ${getColorClass()}
      `}
    >
      {seat.id}
    </button>
  );
}
