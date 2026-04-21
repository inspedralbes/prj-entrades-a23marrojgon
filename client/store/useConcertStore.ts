import { create } from 'zustand';
import { TicketmasterEvent } from '@/types/ticketmaster';

interface ConcertStore {
  events: TicketmasterEvent[];
  isConnected: boolean;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;

  setEvents: (events: TicketmasterEvent[]) => void;
  setConnected: (connected: boolean) => void;
  setLastUpdated: (time: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useConcertStore = create<ConcertStore>((set) => ({
  events: [],
  isConnected: false,
  lastUpdated: null,
  isLoading: true,
  error: null,

  setEvents: (events) => set({ events, isLoading: false }),
  setConnected: (isConnected) => set({ isConnected }),
  setLastUpdated: (lastUpdated) => set({ lastUpdated }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
