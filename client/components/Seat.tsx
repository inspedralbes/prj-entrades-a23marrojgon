"use client";

import { Seat as SeatType, useTicketStore } from '@/store/useTicketStore';

interface SeatProps {
  seat: SeatType;
  onClick?: () => void;
}

export default function Seat({ seat, onClick }: SeatProps) {
  const { selectedSeats } = useTicketStore();
  const isSelected = selectedSeats.some(s => s.id === seat.id);

  // Espai buit de passadís
  if (seat.isAisle) {
    return <div className="w-6 h-8 md:w-7 md:h-9" aria-hidden="true" />;
  }

  // Colors segons la semàntica indicada:
  const getColorClass = () => {
    if (isSelected || seat.status === 'mine') return 'bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]';
    if (seat.status === 'available') return 'bg-emerald-500 border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.8)] cursor-pointer';
    if (seat.status === 'reserved') return 'bg-amber-500 border-amber-400 cursor-not-allowed opacity-80';
    if (seat.status === 'sold') return 'bg-red-500 border-red-800 cursor-not-allowed opacity-50';
    return 'bg-surface';
  };

  const handleSeatClick = () => {
    if (seat.status === 'sold' || seat.status === 'reserved') return;
    if (selectedSeats.length >= 5 && !isSelected) return;
    if (onClick) onClick();
  };

  // PMR seat (wheelchair accessible) - wider with icon
  if (seat.isPMR) {
    return (
      <button
        onClick={handleSeatClick}
        disabled={seat.status === 'sold' || seat.status === 'reserved'}
        title={`PMR ${seat.id} - ${seat.price}€ (Mobilitat Reduïda)`}
        className={`
          w-12 h-8 md:w-14 md:h-9 rounded-lg
          flex items-center justify-center gap-0.5
          text-[9px] font-bold text-white
          border-2 transition-all duration-200
          ${getColorClass()}
        `}
      >
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1 5.5c-.8 0-1.5.7-1.5 1.5v4.5L6 16l1.4 1.4L11 14v-2h2v6.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V11h2.5l1-3H11z"/>
        </svg>
        <span className="hidden md:inline">{seat.col}</span>
      </button>
    );
  }

  // Normal seat
  return (
    <button
      onClick={handleSeatClick}
      disabled={seat.status === 'sold' || seat.status === 'reserved'}
      title={`Seient ${seat.id} - ${seat.price}€`}
      className={`
        w-6 h-8 md:w-7 md:h-9 rounded-t-md rounded-b-sm
        flex items-center justify-center
        text-[8px] md:text-[9px] font-semibold text-white
        border-t-[3px] transition-all duration-200
        ${getColorClass()}
      `}
    >
      {seat.col}
    </button>
  );
}
