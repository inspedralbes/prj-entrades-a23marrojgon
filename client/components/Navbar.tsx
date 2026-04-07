'use client';

import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    // Intentem fer el logout al backend també
    const token = localStorage.getItem('tixflow_token');
    if (token) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });
      } catch (e) {
        console.error('Error logging out from server', e);
      }
    }
    
    clearAuth();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan/20 bg-surface/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Lado izquierdo: Logo */}
        <Link 
          href="/" 
          className="text-2xl font-bold tracking-tighter text-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] transition-all hover:drop-shadow-[0_0_12px_rgba(0,240,255,1)]"
        >
          TixFlow
        </Link>

        {/* Lado derecho: Nav links + Usuario / Login */}
        <nav className="flex items-center gap-6">
          <Link
            href="/concerts"
            className="text-sm font-medium text-foreground hover:text-cyan transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Concerts BCN
          </Link>

          {!isAuthenticated ? (
            <>
              <Link 
                href="/login" 
                className="text-sm font-medium text-foreground hover:text-cyan transition-colors"
              >
                Iniciar Sessió
              </Link>
              <Link 
                href="/register" 
                className="text-sm font-medium bg-cyan/10 text-cyan border border-cyan px-4 py-2 rounded-md shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] hover:bg-cyan/20 transition-all uppercase tracking-wider"
              >
                Registrar-se
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-[0.2em] text-cyan/70 font-bold leading-none mb-1">Usuari Connectat</span>
                <span className="text-sm font-medium text-foreground">{user?.name}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-xs bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 px-3 py-1.5 rounded transition-all uppercase tracking-widest font-bold"
              >
                Sortir
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
