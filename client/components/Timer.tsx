"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTicketStore } from '@/store/useTicketStore';

export default function Timer() {
  const router = useRouter();
  const { timerMinutes, timerSeconds, setTimer, decrementTimer, clearSelection } = useTicketStore();

  useEffect(() => {
    // Iniciar el temporitzador a 5 minuts quan es munta el component si estava a 0
    if (timerMinutes === 0 && timerSeconds === 0) {
      setTimer(5, 0);
    }

    const interval = setInterval(() => {
      decrementTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [setTimer, decrementTimer, timerMinutes, timerSeconds]);

  // Si el temps s'esgota, informem l'usuari i tornem a la portada o al mapa
  useEffect(() => {
    if (timerMinutes === 0 && timerSeconds === 0) {
      // Evitem l'alerta en el primer render abans d'iniciar el timer
    }
  }, [timerMinutes, timerSeconds]);

  const isWarning = timerMinutes === 0 && timerSeconds <= 30; // menys de 30 segons es posa en vermell

  if (timerMinutes === 0 && timerSeconds === 0) return null;

  return (
    <div className={`
      flex items-center gap-2 px-4 py-2 rounded border font-mono text-xl font-bold tracking-widest transition-colors
      ${isWarning 
        ? 'bg-red-500/20 text-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' 
        : 'bg-surface text-cyan border-cyan shadow-[0_0_10px_rgba(0,240,255,0.3)]'}
    `}>
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
    </div>
  );
}
