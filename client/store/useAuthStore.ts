import { create } from 'zustand';
import { User, AuthResponse } from '@/types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setAuth: (response: AuthResponse) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setAuth: (response) => {
    localStorage.setItem('tixflow_token', response.access_token);
    localStorage.setItem('tixflow_user', JSON.stringify(response.user));
    set({ 
      user: response.user, 
      token: response.access_token, 
      isAuthenticated: true,
      error: null 
    });
  },

  clearAuth: () => {
    localStorage.removeItem('tixflow_token');
    localStorage.removeItem('tixflow_user');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('tixflow_token');
      const user = localStorage.getItem('tixflow_user');
      
      if (token && user) {
        try {
          set({ 
            token, 
            user: JSON.parse(user), 
            isAuthenticated: true 
          });
        } catch (e) {
          localStorage.removeItem('tixflow_token');
          localStorage.removeItem('tixflow_user');
        }
      }
    }
  },
}));
