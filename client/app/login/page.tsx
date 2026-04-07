'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { setAuth, isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      if (user?.email === 'admin@tixflow.com') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en iniciar sessió');
      }

      setAuth(data);

      if (email === 'admin@tixflow.com') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full bg-[#030303] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent pointer-events-none"></div>
      
      {/* Moving Light Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-magenta/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-lg relative z-10">
        {/* Decorative elements */}
        <div className="flex justify-center mb-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan to-magenta rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-background p-4 rounded-full border border-white/5">
              <svg className="w-10 h-10 text-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden group">
          {/* Top border light beam effect */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan to-transparent opacity-50"></div>
          
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
              Benvingut a <span className="text-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">TixFlow</span>
            </h1>
            <p className="text-white/40 text-sm font-medium tracking-wide uppercase">
              Inicia sessió per gestionar les teves entrades
            </p>
          </div>

          {error && (
            <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] ml-1">Correu Electrònic</label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-cyan rounded-xl blur opacity-0 group-within:opacity-10 transition duration-500"></div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-cyan/50 focus:bg-white/[0.08] transition-all placeholder:text-white/10 relative z-10"
                  placeholder="exemple@tixflow.cat"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-white/50 uppercase tracking-[0.2em]">Contrasenya</label>
                <button type="button" className="text-[10px] text-cyan/60 hover:text-cyan font-bold uppercase tracking-wider transition-colors">Has oblidat la clau?</button>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-magenta rounded-xl blur opacity-0 group-within:opacity-10 transition duration-500"></div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-magenta/50 focus:bg-white/[0.08] transition-all placeholder:text-white/10 relative z-10"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group mt-4 overflow-hidden rounded-xl bg-white text-black font-black py-4 uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan/20 to-magenta/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative z-10">{loading ? 'Verificant dades...' : 'Accedir al sistema'}</span>
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-white/30 text-sm font-medium">
              Encara no tens accés?{' '}
              <Link href="/register" className="text-white hover:text-cyan transition-all duration-300 border-b border-white/10 hover:border-cyan pb-0.5">
                Crea un compte nou
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 flex justify-center gap-6">
          <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="w-1 h-1 bg-cyan rounded-full"></div> Seguretat SSL
          </span>
          <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="w-1 h-1 bg-magenta rounded-full"></div> Encriptació 256-bit
          </span>
        </div>
      </div>
    </div>
  );
}
