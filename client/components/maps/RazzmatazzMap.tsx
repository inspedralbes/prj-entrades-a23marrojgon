import { MapZone, VenueMapProps } from '@/types/map';

const zones: MapZone[] = [
  { id: 'pista-general', name: 'Pista Principal', price: 0, status: 'available' },
  { id: 'razz-balco-1', name: 'Balcó Primara Planta', price: 20, status: 'available' },
  { id: 'razz-balco-2', name: 'Balcó Segona Planta', price: 30, status: 'available' },
  { id: 'razz-vip-stage', name: 'VIP Stage Side', price: 50, status: 'available' },
];

export default function RazzmatazzMap({ onZoneSelect, selectedZoneId, basePrice }: VenueMapProps) {
  const runtimeZones = zones.map(z => ({
    ...z,
    price: Math.max(10, basePrice + z.price),
  }));

  const handleSelect = (id: string) => {
    const zone = runtimeZones.find(z => z.id === id);
    if (zone && zone.status === 'available') {
      onZoneSelect(selectedZoneId === id ? null : zone as any);
    }
  };

  const getPathClass = (id: string) => {
    const isSelected = selectedZoneId === id;
    return `transition-all duration-300 cursor-pointer stroke-2 
      ${isSelected 
        ? 'fill-cyan/40 stroke-cyan drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]' 
        : 'fill-surface/80 hover:fill-cyan/20 stroke-cyan/30 hover:stroke-cyan/70'}`;
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-background border border-cyan/10 rounded-2xl p-4 md:p-8 flex items-center justify-center overflow-hidden shadow-inner group">
      <svg viewBox="0 0 800 600" className="w-full h-full max-h-[600px] drop-shadow-xl" preserveAspectRatio="xMidYMid meet">
        {/* ESCENARI */}
        <g className="opacity-90">
          <rect x="250" y="20" width="300" height="70" rx="4" 
            className="fill-magenta/20 stroke-magenta stroke-[3px]" />
          <text x="400" y="62" textAnchor="middle" className="fill-magenta text-xl font-black tracking-[0.3em] pointer-events-none uppercase">ESCENARI</text>
        </g>

        {/* VIP STAGE SIDE */}
        <path d="M 180 30 L 240 30 L 240 100 L 180 100 Z" 
          className={getPathClass('razz-vip-stage')}
          onClick={() => handleSelect('razz-vip-stage')} />
        <path d="M 560 30 L 620 30 L 620 100 L 560 100 Z" 
          className={getPathClass('razz-vip-stage')}
          onClick={() => handleSelect('razz-vip-stage')} />

        {/* PISTA PRINCIPAL */}
        <path d="M 200 120 L 600 120 L 600 480 L 200 480 Z" 
          className={getPathClass('pista-general')}
          onClick={() => handleSelect('pista-general')} />
        <text x="400" y="300" textAnchor="middle" className="fill-cyan pointer-events-none text-2xl font-black tracking-[0.2em] opacity-30">PISTA</text>

        {/* BALCÓ 1 (Primara Planta - U Shape) */}
        <path d="M 100 120 L 180 120 L 180 480 L 620 480 L 620 120 L 700 120 L 700 550 L 100 550 Z" 
          className={getPathClass('razz-balco-1')}
          onClick={() => handleSelect('razz-balco-1')} />
        <text x="400" y="520" textAnchor="middle" className="fill-cyan pointer-events-none text-sm font-bold tracking-[0.1em] opacity-80">BALCÓ 1</text>

        {/* BALCÓ 2 (Segona Planta - Corner) */}
        <path d="M 50 50 L 150 50 L 150 150 L 50 150 Z" 
          className={getPathClass('razz-balco-2')}
          onClick={() => handleSelect('razz-balco-2')} />
        <text x="100" y="105" textAnchor="middle" className="fill-cyan pointer-events-none text-[10px] font-bold">BALCÓ 2</text>
        
        <path d="M 650 50 L 750 50 L 750 150 L 650 150 Z" 
          className={getPathClass('razz-balco-2')}
          onClick={() => handleSelect('razz-balco-2')} />
        <text x="700" y="105" textAnchor="middle" className="fill-cyan pointer-events-none text-[10px] font-bold">BALCÓ 2</text>
      </svg>
    </div>
  );
}

