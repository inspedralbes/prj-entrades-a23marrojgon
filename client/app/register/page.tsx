'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    if (password !== confirmPassword) {
      setError('Les contrasenyes no coincideixen');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el registre');
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
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-magenta/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-cyan/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-lg relative z-10">
        {/* Decorative elements */}
        <div className="flex justify-center mb-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-magenta to-cyan rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-background p-4 rounded-full border border-white/5">
              <svg className="w-10 h-10 text-magenta drop-shadow-[0_0_8px_rgba(255,0,160,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden group">
          {/* Top border light beam effect */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-magenta to-transparent opacity-50"></div>
          
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
              Uneix-te a <span className="text-magenta drop-shadow-[0_0_10px_rgba(255,0,160,0.4)]">TixFlow</span>
            </h1>
            <p className="text-white/40 text-sm font-medium tracking-wide uppercase">
              Crea el teu compte per accedir als millors concerts
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] ml-1">Nom Complet</label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-magenta rounded-xl blur opacity-0 group-within:opacity-10 transition duration-500"></div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-magenta/50 focus:bg-white/[0.08] transition-all placeholder:text-white/10 relative z-10"
                  placeholder="El teu nom"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] ml-1">Correu Electrònic</label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-cyan rounded-xl blur opacity-0 group-within:opacity-10 transition duration-500"></div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-cyan/50 focus:bg-white/[0.08] transition-all placeholder:text-white/10 relative z-10"
                  placeholder="exemple@tixflow.cat"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] ml-1">Contrasenya</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-white/20 rounded-xl blur opacity-0 group-within:opacity-10 transition duration-500"></div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all placeholder:text-white/10 relative z-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] ml-1">Confirmació</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-white/20 rounded-xl blur opacity-0 group-within:opacity-10 transition duration-500"></div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all placeholder:text-white/10 relative z-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group mt-6 overflow-hidden rounded-xl bg-magenta text-white font-black py-4 uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative z-10">{loading ? 'Creant sistema...' : 'Registrar Compte'}</span>
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-white/30 text-sm font-medium">
              Ja formes part de TixFlow?{' '}
              <Link href="/login" className="text-white hover:text-magenta transition-all duration-300 border-b border-white/10 hover:border-magenta pb-0.5">
                Inicia sessió
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
