'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.email !== 'admin@tixflow.com') {
        router.push('/');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !isAuthenticated || user?.email !== 'admin@tixflow.com') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-cyan">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin"></div>
          <p className="uppercase tracking-[0.3em] text-sm animate-pulse">Verificant Credencials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-cyan/20 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tighter text-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
              PANEL D'ADMINISTRACIÓ
            </h1>
            <p className="text-foreground/60 uppercase tracking-widest text-xs mt-2">
              Benvingut al nucli del sistema, {user?.name}
            </p>
          </div>
          <div className="bg-cyan/10 border border-cyan/50 px-4 py-2 rounded-lg flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan rounded-full animate-ping"></div>
            <span className="text-cyan text-xs font-bold uppercase tracking-widest">SISTEMA ONLINE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats card */}
          <div className="bg-surface/40 backdrop-blur-md border border-cyan/10 p-6 rounded-xl hover:border-cyan/30 transition-all group">
            <h3 className="text-foreground/40 text-xs font-bold uppercase tracking-widest mb-4">Vendes Totals</h3>
            <div className="text-3xl font-bold text-foreground group-hover:text-cyan transition-colors">1.284,50 €</div>
            <div className="mt-2 text-green-400 text-xs flex items-center gap-1 font-bold">
              <span>↑ 12%</span>
              <span className="text-foreground/20 font-normal underline underline-offset-4 decoration-cyan/20">Aquesta setmana</span>
            </div>
          </div>

          <div className="bg-surface/40 backdrop-blur-md border border-cyan/10 p-6 rounded-xl hover:border-cyan/30 transition-all group">
            <h3 className="text-foreground/40 text-xs font-bold uppercase tracking-widest mb-4">Entrades Venudes</h3>
            <div className="text-3xl font-bold text-foreground group-hover:text-cyan transition-colors">42</div>
            <div className="mt-2 text-cyan/60 text-xs font-bold">
              <span>Capacitat: 85%</span>
            </div>
          </div>

          <div className="bg-surface/40 backdrop-blur-md border border-cyan/10 p-6 rounded-xl hover:border-cyan/30 transition-all group">
            <h3 className="text-foreground/40 text-xs font-bold uppercase tracking-widest mb-4">Alertes de Sistema</h3>
            <div className="text-3xl font-bold text-foreground group-hover:text-pink-500 transition-colors">0</div>
            <div className="mt-2 text-green-400 text-xs font-bold">
              <span>Operació normal</span>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-surface/20 border border-cyan/5 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan/10 rounded-full mb-6 border border-cyan/20">
            <svg className="w-8 h-8 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4 tracking-tight">Eines de Gestió</h2>
          <p className="text-foreground/40 max-w-md mx-auto mb-8">
            Aquí podràs gestionar els concerts, els usuaris i veure les estadístiques en temps real de les vendes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-6 py-2 bg-cyan/10 border border-cyan/30 text-cyan rounded hover:bg-cyan/20 transition-all uppercase text-xs font-bold tracking-widest">
              Gestionar Concerts
            </button>
            <button className="px-6 py-2 bg-cyan/10 border border-cyan/30 text-cyan rounded hover:bg-cyan/20 transition-all uppercase text-xs font-bold tracking-widest">
              Llista d'Usuaris
            </button>
            <Link href="/" className="px-6 py-2 bg-foreground/5 text-foreground/40 border border-foreground/10 rounded hover:bg-foreground/10 transition-all uppercase text-xs font-bold tracking-widest">
              Tornar a l'Inici
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
