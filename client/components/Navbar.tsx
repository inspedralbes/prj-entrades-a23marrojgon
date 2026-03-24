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

        {/* Lado derecho: Botones de Login / Registro */}
        <nav className="flex items-center gap-4">
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
