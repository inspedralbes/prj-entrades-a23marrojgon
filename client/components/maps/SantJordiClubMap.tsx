import { MapZone, VenueMapProps } from '@/types/map';

const zones: MapZone[] = [
  { id: 'pista-general', name: 'Pista General', price: 0, status: 'available' },
  { id: 'vip-lateral', name: 'Grada VIP Lateral', price: 25, status: 'available' },
];

export default function SantJordiClubMap({ onZoneSelect, selectedZoneId, basePrice }: VenueMapProps) {
  const runtimeZones = zones.map(z => ({
    ...z,
    price: Math.max(10, basePrice + z.price),
  }));

  const handleSelect = (id: string) => {
    const zone = runtimeZones.find(z => z.id === id);
    if (zone && zone.status === 'available') {
      onZoneSelect(selectedZoneId === id ? null : zone);
    }
  };

  const getPathClass = (id: string) => {
    const isSelected = selectedZoneId === id;
    return `transition-all duration-300 cursor-pointer stroke-2 
      ${isSelected 
        ? 'fill-cyan/40 stroke-cyan drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]' 
        : 'fill-surface hover:fill-cyan/20 stroke-cyan/30 hover:stroke-cyan/70'}`;
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-background border border-cyan/10 rounded-2xl p-4 md:p-8 flex items-center justify-center overflow-hidden shadow-inner">
      <svg viewBox="0 0 800 600" className="w-full h-full max-h-[600px] drop-shadow-xl" preserveAspectRatio="xMidYMid meet">
        {/* ESCENARI */}
        <g className="opacity-90">
          <rect x="250" y="50" width="300" height="80" rx="8" 
            className="fill-magenta/20 stroke-magenta stroke-[3px]" />
          <text x="400" y="95" textAnchor="middle" className="fill-magenta text-2xl font-bold tracking-[0.2em] pointer-events-none">ESCENARI</text>
        </g>

        {/* PISTA GENERAL */}
        <path d="M 200 180 L 700 180 L 700 550 C 700 560, 690 570, 680 570 L 220 570 C 210 570, 200 560, 200 550 Z" 
          className={getPathClass('pista-general')}
          onClick={() => handleSelect('pista-general')} />
        <text x="450" y="380" textAnchor="middle" className="fill-cyan pointer-events-none text-2xl font-bold tracking-[0.1em]">PISTA GENERAL</text>

        {/* VIP LATERAL */}
        <path d="M 100 200 L 180 200 L 180 520 L 100 550 Z" 
          className={getPathClass('vip-lateral')}
          onClick={() => handleSelect('vip-lateral')} />
        
        {/* Rotated text for VIP */}
        <g transform="translate(140, 375) rotate(-90)">
          <text x="0" y="0" textAnchor="middle" className="fill-cyan pointer-events-none text-lg font-bold tracking-wider">GRADA VIP LATERAL</text>
        </g>
      </svg>
    </div>
  );
}
