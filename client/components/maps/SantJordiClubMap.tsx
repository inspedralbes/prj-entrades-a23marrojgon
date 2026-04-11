import { MapZone, VenueMapProps } from '@/types/map';

const zones: MapZone[] = [
  { id: 'pista-general', name: 'Pista General', price: 0, status: 'available' },
  { id: 'sj-tribuna-esq', name: 'Tribuna Esquerra', price: 25, status: 'available' },
  { id: 'sj-tribuna-det', name: 'Tribuna Dreta', price: 25, status: 'available' },
  { id: 'sj-fons-vip', name: 'Fons VIP', price: 35, status: 'available' },
];

export default function SantJordiClubMap({ onZoneSelect, selectedZoneId, basePrice }: VenueMapProps) {
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
          <rect x="250" y="30" width="300" height="80" rx="8" 
            className="fill-magenta/20 stroke-magenta stroke-[3px]" />
          <text x="400" y="75" textAnchor="middle" className="fill-magenta text-2xl font-black tracking-[0.3em] pointer-events-none">ESCENARI</text>
        </g>

        {/* PISTA GENERAL */}
        <path d="M 200 150 L 600 150 L 600 500 L 200 500 Z" 
          className={getPathClass('pista-general')}
          onClick={() => handleSelect('pista-general')} />
        <text x="400" y="325" textAnchor="middle" className="fill-cyan pointer-events-none text-2xl font-black tracking-[0.1em] opacity-30">PISTA</text>

        {/* TRIBUNA ESQUERRA */}
        <path d="M 50 150 L 180 150 L 180 500 L 50 550 Z" 
          className={getPathClass('sj-tribuna-esq')}
          onClick={() => handleSelect('sj-tribuna-esq')} />
        <g transform="translate(115, 325) rotate(-90)">
          <text x="0" y="0" textAnchor="middle" className="fill-cyan/60 pointer-events-none text-sm font-bold tracking-widest">TRIBUNA ESQ.</text>
        </g>

        {/* TRIBUNA DRETA */}
        <path d="M 620 150 L 750 150 L 750 550 L 620 500 Z" 
          className={getPathClass('sj-tribuna-det')}
          onClick={() => handleSelect('sj-tribuna-det')} />
        <g transform="translate(685, 325) rotate(90)">
          <text x="0" y="0" textAnchor="middle" className="fill-cyan/60 pointer-events-none text-sm font-bold tracking-widest">TRIBUNA DRETA</text>
        </g>

        {/* FONS VIP */}
        <path d="M 200 515 L 600 515 L 630 580 L 170 580 Z" 
          className={getPathClass('sj-fons-vip')}
          onClick={() => handleSelect('sj-fons-vip')} />
        <text x="400" y="555" textAnchor="middle" className="fill-cyan pointer-events-none text-sm font-bold tracking-[0.2em] opacity-80">FONS VIP</text>
      </svg>
    </div>
  );
}

