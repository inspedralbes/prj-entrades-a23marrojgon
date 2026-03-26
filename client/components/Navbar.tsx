import Link from "next/link";

export default function Navbar() {
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

        {/* Lado derecho: Nav links + Botones de Login / Registro */}
        <nav className="flex items-center gap-4">
          <Link
            href="/concerts"
            className="text-sm font-medium text-foreground hover:text-cyan transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Concerts BCN
          </Link>
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
        </nav>
      </div>
    </header>
  );
}
