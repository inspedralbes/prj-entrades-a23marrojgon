'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.push('/login');
          return;
        } else if (user?.email !== 'admin@tixflow.com') {
          router.push('/');
          return;
        }

        try {
          const token = localStorage.getItem('tixflow_token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            }
          });
          if (!response.ok) throw new Error('Error al carregar estadístiques');
          const data = await response.json();
          setStats(data);
        } catch (err: any) {
          setError(err.message);
        }
      }
    };

    fetchStats();
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-cyan">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin"></div>
          <p className="uppercase tracking-[0.3em] text-sm animate-pulse">Carregant Nucli...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-12 border-b border-cyan/10 pb-8 relative">
        <div className="absolute -bottom-[1px] left-0 w-32 h-[1px] bg-cyan shadow-[0_0_10px_#00f0ff]"></div>
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
            Dashboard <span className="text-cyan drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">Admin</span>
          </h1>
          <p className="text-foreground/40 font-bold uppercase tracking-[0.4em] text-[10px] mt-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Terminal operatiu: {user?.name}
          </p>
        </div>
        <div className="hidden lg:flex gap-4">
            <div className="text-right border-r border-white/10 pr-4">
                <p className="text-[10px] uppercase text-white/30 font-bold">Data de Sistema</p>
                <p className="text-xs font-mono text-white/70">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] uppercase text-white/30 font-bold">Node Status</p>
                <p className="text-xs font-mono text-cyan">ACTIVE_ROOT</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Stats card: Sales */}
        <div className="bg-surface/30 backdrop-blur-xl border border-white/5 p-6 rounded-2xl hover:border-cyan/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
            <svg className="w-20 h-20 text-cyan -mr-8 -mt-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Vendes Totals</h3>
          <div className="text-4xl font-black text-white group-hover:text-cyan transition-colors tracking-tighter">
            {stats.total_sales.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' })}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-green-400 text-xs font-black">↑ 12.5%</span>
            <span className="text-white/10 text-[9px] uppercase font-bold tracking-widest">Real-time update</span>
          </div>
        </div>

        {/* Stats card: Tickets */}
        <div className="bg-surface/30 backdrop-blur-xl border border-white/5 p-6 rounded-2xl hover:border-magenta/30 transition-all group relative overflow-hidden">
          <h3 className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Entrades Venudes</h3>
          <div className="text-4xl font-black text-white group-hover:text-magenta transition-colors tracking-tighter">
            {stats.tickets_sold}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-magenta/60 text-xs font-black">CAPACITAT: 85%</span>
          </div>
        </div>

        {/* Stats card: Users */}
        <div className="bg-surface/30 backdrop-blur-xl border border-white/5 p-6 rounded-2xl hover:border-yellow-500/30 transition-all group relative overflow-hidden">
          <h3 className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Usuaris Actius</h3>
          <div className="text-4xl font-black text-white group-hover:text-yellow-500 transition-colors tracking-tighter">
            {stats.users_count}
          </div>
          <div className="mt-4 flex items-center gap-2 text-yellow-500/40 text-[9px] uppercase font-bold tracking-widest italic">
            Sincronitzat amb DB
          </div>
        </div>

        {/* Stats card: Concerts */}
        <div className="bg-surface/30 backdrop-blur-xl border border-white/5 p-6 rounded-2xl hover:border-purple-500/30 transition-all group relative overflow-hidden">
          <h3 className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Concerts en Gestió</h3>
          <div className="text-4xl font-black text-white group-hover:text-purple-500 transition-colors tracking-tighter">
            {stats.concerts_count}
          </div>
          <div className="mt-4 flex items-center gap-2 text-purple-500/40 text-[9px] uppercase font-bold tracking-widest italic">
            Sistema Local
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-cyan/5 to-magenta/5 border border-white/5 rounded-3xl p-12 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-10 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-background/50 border border-white/10 rounded-2xl mb-8 group-hover:border-cyan/50 transition-all">
            <svg className="w-10 h-10 text-cyan drop-shadow-[0_0_10px_#00f0ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-tight italic">
            Control de <span className="text-magenta">Operacions</span>
          </h2>
          <p className="text-white/40 max-w-2xl text-lg leading-relaxed mb-10">
            Benvingut al nucli de TixFlow. Des d'aquí pots gestionar tot l'ecosistema de concerts, controlar l'accés dels usuaris i monitoritzar el rendiment del sistema en temps real.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/admin/concerts" className="bg-cyan text-black px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              Gestionar Concerts
            </Link>
            <Link href="/admin/users" className="bg-white/5 border border-white/10 text-white/60 px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-white/10 hover:text-white transition-all">
              Veure Usuaris
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
