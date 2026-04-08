import { create } from 'zustand';

export type SeatState = 'available' | 'reserved' | 'mine' | 'sold';

export interface Seat {
  id: string;
  row: string;
  col: number;
  status: SeatState;
  price: number;
  isPMR?: boolean;
  isAisle?: boolean;
}

interface TicketStore {
  seats: Seat[];
  selectedSeats: Seat[];
  timerMinutes: number;
  timerSeconds: number;
  
  // Accions per actualitzar l'estat general (des dels WebSockets o API inicial)
  setSeats: (seats: Seat[]) => void;
  updateSeatStatus: (seatId: string, status: SeatState, currentUserId?: string, reservedByUserId?: string) => void;
  
  // Accions d'usuari local
  toggleSeatSelection: (seat: Seat) => void;
  clearSelection: () => void;
  
  // Accions per al temporitzador
  setTimer: (minutes: number, seconds: number) => void;
  decrementTimer: () => void;
}

// Store principal creat amb Zustand
export const useTicketStore = create<TicketStore>((set) => ({
  seats: [],
  selectedSeats: [],
  timerMinutes: 0,
  timerSeconds: 0,

  setSeats: (seats) => set({ seats }),
  
  updateSeatStatus: (seatId, status, currentUserId, reservedByUserId) => set((state) => {
    // Determinar l'estat final segons qui ha reservat
    let finalStatus = status;
    if (status === 'reserved' && currentUserId && String(reservedByUserId) === String(currentUserId)) {
      finalStatus = 'mine';
    }

    return {
      seats: state.seats.map(seat => 
        seat.id === seatId ? { ...seat, status: finalStatus } : seat
      ),
      // Traiem de la selecció si:
      // 1. S'ha venut
      // 2. L'ha reservat UN ALTRE
      // 3. Ha passat a estar disponible (timeout de servidor o algú l'ha alliberat)
      selectedSeats: (status === 'sold' || (status === 'reserved' && String(reservedByUserId) !== String(currentUserId)) || status === 'available') 
        ? state.selectedSeats.filter(seat => seat.id !== seatId)
        : state.selectedSeats
    };
  }),

  toggleSeatSelection: (seatToToggle) => set((state) => {
    const isAlreadySelected = state.selectedSeats.some(s => s.id === seatToToggle.id);
    
    // Si ja el teníem seleccionat, el traiem
    if (isAlreadySelected) {
      return {
        selectedSeats: state.selectedSeats.filter(s => s.id !== seatToToggle.id),
      };
    }
    
    // Màxim 5 butaques
    if (state.selectedSeats.length >= 5) {
      return state;
    }
    
    // Si està disponible (o el servidor encara no ha dit el contrari), l'afegim
    if (seatToToggle.status === 'available') {
      return {
        selectedSeats: [...state.selectedSeats, seatToToggle]
      };
    }
    
    return state;
  }),

  clearSelection: () => set({ selectedSeats: [] }),

  setTimer: (minutes, seconds) => set({ timerMinutes: minutes, timerSeconds: seconds }),
  
  decrementTimer: () => set((state) => {
    if (state.timerSeconds > 0) {
      return { timerSeconds: state.timerSeconds - 1 };
    }
    if (state.timerMinutes > 0) {
      return { timerMinutes: state.timerMinutes - 1, timerSeconds: 59 };
    }
    return state;
  })
}));
