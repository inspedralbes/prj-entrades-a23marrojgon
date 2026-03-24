import { create } from 'zustand';

export type SeatState = 'available' | 'reserved' | 'mine' | 'sold';

export interface Seat {
  id: string;
  row: string;
  col: number;
  status: SeatState;
  price: number;
}

interface TicketStore {
  seats: Seat[];
  selectedSeatIds: string[];
  timerMinutes: number;
  timerSeconds: number;
  
  // Accions per actualitzar l'estat general (des dels WebSockets o API inicial)
  setSeats: (seats: Seat[]) => void;
  updateSeatStatus: (seatId: string, status: SeatState) => void;
  
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
  selectedSeatIds: [],
  timerMinutes: 0,
  timerSeconds: 0,

  setSeats: (seats) => set({ seats }),
  
  updateSeatStatus: (seatId, status) => set((state) => ({
    seats: state.seats.map(seat => 
      seat.id === seatId ? { ...seat, status } : seat
    )
  })),

  toggleSeatSelection: (seatToToggle) => set((state) => {
    // Si ja el teníem seleccionat, el traiem
    const isAlreadySelected = state.selectedSeatIds.includes(seatToToggle.id);
    
    if (isAlreadySelected) {
      return {
        selectedSeatIds: state.selectedSeatIds.filter(id => id !== seatToToggle.id),
      };
    }
    
    // Si està disponible, l'afegim
    if (seatToToggle.status === 'available') {
      return {
        selectedSeatIds: [...state.selectedSeatIds, seatToToggle.id]
      };
    }
    
    return state; // No canvia res si el seient i.e. està sold o reserved
  }),

  clearSelection: () => set({ selectedSeatIds: [] }),

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
