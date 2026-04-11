"use client";

import { Seat as SeatType, useTicketStore } from '@/store/useTicketStore';

interface SeatProps {
  seat: SeatType;
  onClick?: () => void;
}

export default function Seat({ seat, onClick }: SeatProps) {
  const { selectedSeats, purchasedCount } = useTicketStore();
  const isSelected = selectedSeats.some(s => s.id === seat.id);

  // Espai buit de passadís
  if (seat.isAisle) {
    return <div className="w-8 h-10 md:w-9 md:h-11" aria-hidden="true" />;
  }

  const isLimitReached = (selectedSeats.length + purchasedCount) >= 5;

  // Colors segons la semàntica indicada:
  const getColorClass = () => {
    if (isSelected || seat.status === 'mine') return 'bg-blue-500 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,1)]';
    if (seat.status === 'available') {
      if (isLimitReached && !isSelected) return 'bg-gray-600 border-gray-500 opacity-40 cursor-not-allowed shadow-none';
      return 'bg-green-500 border-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,1)] hover:scale-110 cursor-pointer';
    }
    if (seat.status === 'reserved') return 'bg-yellow-500 border-yellow-400 cursor-not-allowed shadow-[0_0_10px_rgba(234,179,8,0.5)]';
    if (seat.status === 'sold') return 'bg-red-700 border-red-900 cursor-not-allowed shadow-[inset_0_0_8px_rgba(0,0,0,0.5)] opacity-60';
    return 'bg-surface';
  };

  const handleSeatClick = () => {
    if (seat.status === 'sold' || seat.status === 'reserved') return;
    if (isLimitReached && !isSelected) return;
    if (onClick) onClick();
  };

  // PMR seat (wheelchair accessible) - wider with icon
  if (seat.isPMR) {
    return (
      <button
        onClick={handleSeatClick}
        disabled={seat.status === 'sold' || seat.status === 'reserved' || (isLimitReached && !isSelected)}
        title={`PMR ${seat.id} - ${seat.price}€ (Mobilitat Reduïda)`}
        className={`
          w-14 h-10 md:w-16 md:h-11 rounded-lg
          flex items-center justify-center gap-0.5
          text-[9px] md:text-[10px] font-bold text-white
          border-2 transition-all duration-200
          ${getColorClass()}
        `}
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1 5.5c-.8 0-1.5.7-1.5 1.5v4.5L6 16l1.4 1.4L11 14v-2h2v6.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V11h2.5l1-3H11z" />
        </svg>
        <span className="hidden md:inline">{seat.col}</span>
      </button>
    );
  }

  // Normal seat - Improved visuals
  return (
    <button
      onClick={handleSeatClick}
      disabled={seat.status === 'sold' || seat.status === 'reserved' || (isLimitReached && !isSelected)}
      title={`Seient ${seat.id} - ${seat.price}€`}
      className={`
        w-8 h-10 md:w-9 md:h-11 rounded-md
        flex items-center justify-center
        text-[8px] md:text-[9px] font-bold text-white
        border-2 transition-all duration-150
        ${getColorClass()}
      `}
    >
      {seat.col}
    </button>
  );
}
