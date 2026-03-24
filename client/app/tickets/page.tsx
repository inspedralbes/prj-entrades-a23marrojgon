import Link from "next/link";

// Mock d'entrades ja pagades per l'usuari (Fase 5)
const mockTickets = [
  {
    id: "tk_001",
    event: "Neon City Festival 2026",
    date: "15 d'Agost, 2026 - 22:00h",
    location: "Estadi CyberGlitch, Barcelona",
    seat: "Fila A - Seient 4",
    price: 75,
    qrCode: "MOCK_QR_CODE_1"
  },
  {
    id: "tk_002",
    event: "Synthwave Nights",
    date: "3 de Setembre, 2026 - 21:00h",
    location: "Sala Razzmatazz",
    seat: "Pista General",
    price: 30,
    qrCode: "MOCK_QR_CODE_2"
  }
];

export default function TicketsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan to-magenta">
          Les Meves Entrades
        </h1>
        <p className="text-gray-400 mt-2">Guarda el codi QR per accedir als esdeveniments. No el comparteixis amb ningú.</p>
      </div>

      {mockTickets.length === 0 ? (
        <div className="bg-surface border border-cyan/20 rounded-xl p-12 text-center">
          <h2 className="text-xl text-gray-300 mb-4">No tens cap entrada activa</h2>
          <Link href="/" className="inline-block bg-cyan text-background font-bold px-6 py-3 rounded uppercase tracking-widest hover:bg-cyan/80 transition-all">
            Explorar Esdeveniments
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {mockTickets.map(ticket => (
            <div key={ticket.id} className="bg-surface border border-cyan/30 rounded-xl overflow-hidden flex flex-col sm:flex-row shadow-lg hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all">
              
              {/* Informació de l'Entrada */}
              <div className="p-6 flex-1 border-b sm:border-b-0 sm:border-r border-dashed border-cyan/30 relative">
                {/* Forats perforats (styling simulat de ticket físic) */}
                <div className="hidden sm:block absolute -right-3 top-[-10px] w-6 h-6 rounded-full bg-background z-10 border-b border-cyan/30"></div>
                <div className="hidden sm:block absolute -right-3 bottom-[-10px] w-6 h-6 rounded-full bg-background z-10 border-t border-cyan/30"></div>
                
                <h3 className="text-xl font-bold text-white mb-1">{ticket.event}</h3>
                <p className="text-cyan text-sm mb-4 font-mono">{ticket.id}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Data</p>
                    <p className="text-sm font-medium">{ticket.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ubicació</p>
                    <p className="text-sm font-medium">{ticket.location}</p>
                  </div>
                </div>

                <div className="bg-background/50 outline outline-1 outline-cyan/10 rounded p-3 text-center w-full">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Seient</p>
                  <p className="text-lg font-bold text-magenta">{ticket.seat}</p>
                </div>
              </div>

              {/* Secció QR */}
              <div className="p-6 bg-cyan/5 flex flex-col items-center justify-center min-w-[180px]">
                <div className="w-32 h-32 bg-white rounded flex items-center justify-center mb-3">
                  {/* Simulació QR Code (Grid) */}
                  <div className="grid grid-cols-4 gap-1 w-24 h-24 p-1">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className={`bg-black ${Math.random() > 0.4 ? 'opacity-100' : 'opacity-0'}`}></div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-cyan opacity-80 text-center uppercase tracking-widest font-mono">Codi d'Accés</p>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
