"use client";

import { useEffect } from 'react';
import { useTicketStore, Seat as SeatType } from '@/store/useTicketStore';
import Seat from './Seat';
import Link from 'next/link';

export default function SeatMap() {
  const { seats, setSeats, selectedSeatIds } = useTicketStore();

  useEffect(() => {
    // Generar dades Mock al muntatge només la primera vegada
    if (seats.length === 0) {
      const mockSeats: SeatType[] = [];
      const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const cols = 12;

      rows.forEach((r) => {
        for (let c = 1; c <= cols; c++) {
          const rand = Math.random();
          let status: 'available' | 'reserved' | 'mine' | 'sold' = 'available';
          
          if (rand > 0.85) status = 'sold';
          else if (rand > 0.75) status = 'reserved';

          mockSeats.push({
            id: `${r}${c}`,
            row: r,
            col: c,
            status,
            price: r === 'A' || r === 'B' ? 75 : (r === 'C' || r === 'D' ? 55 : 35),
          });
        }
      });
      setSeats(mockSeats);
    }
  }, [seats.length, setSeats]);

  // Agrupar seients per files
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, SeatType[]>);

  // Calcular total
  const selectedSeatsInfo = seats.filter(s => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeatsInfo.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* MAPA */}
      <div className="flex-1 bg-surface p-6 rounded-xl border border-cyan/20">
        <div className="w-full h-12 bg-cyan/20 border-b-4 border-cyan rounded-t-3xl mb-12 flex items-center justify-center shadow-[0_10px_30px_rgba(0,240,255,0.1)]">
          <span className="text-cyan font-bold tracking-widest uppercase">Escenari</span>
        </div>

        <div className="flex flex-col gap-4 items-center overflow-x-auto pb-4">
          {Object.keys(seatsByRow).sort().map((row) => (
            <div key={row} className="flex gap-2 md:gap-4 items-center">
              <span className="text-cyan font-bold w-6 text-center">{row}</span>
              <div className="flex gap-2">
                {seatsByRow[row]
                  .sort((a, b) => a.col - b.col)
                  .map((seat) => (
                    <Seat key={seat.id} seat={seat} />
                  ))}
              </div>
              <span className="text-cyan font-bold w-6 text-center">{row}</span>
            </div>
          ))}
        </div>

        {/* LLEGENDA */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded-sm"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
            <span>Seleccionat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded-sm"></div>
            <span>Reservat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 opacity-50 rounded-sm"></div>
            <span>Venut</span>
          </div>
        </div>
      </div>

      {/* SIDEBAR DE COMPRA */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-surface p-6 rounded-xl border border-cyan/20 sticky top-24">
          <h3 className="text-xl font-bold mb-4 text-cyan border-b border-cyan/20 pb-2">Selecció Actual</h3>
          
          {selectedSeatIds.length === 0 ? (
            <p className="text-gray-400 text-sm">No has seleccionat cap seient encara. Fes clic al mapa per començar.</p>
          ) : (
            <>
              <div className="flex flex-col gap-2 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {selectedSeatsInfo.map(seat => (
                  <div key={seat.id} className="flex justify-between items-center bg-background p-2 rounded border border-blue-500/30">
                    <span className="font-medium text-blue-400">Seient {seat.id}</span>
                    <span className="text-white">{seat.price}€</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-4 mb-6">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-cyan text-2xl">{totalPrice}€</span>
                </div>
              </div>

              <Link 
                href="/checkout"
                className="block w-full text-center py-3 bg-cyan text-background font-bold uppercase tracking-wider rounded transition-all hover:bg-cyan/90 hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]"
              >
                Continuar ({selectedSeatIds.length})
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
