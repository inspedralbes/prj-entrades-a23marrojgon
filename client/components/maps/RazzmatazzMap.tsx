import { MapZone, VenueMapProps } from '@/types/map';

const zones: MapZone[] = [
  { id: 'pista-general', name: 'Pista General', price: 0, status: 'available' },
  { id: 'vip-frontal', name: 'VIP Frontal (Balcó)', price: 40, status: 'available' },
  { id: 'vip-esquerre', name: 'VIP Lateral Esquerre', price: 20, status: 'available' },
  { id: 'vip-dret', name: 'VIP Lateral Dret', price: 20, status: 'available' },
];

export default function RazzmatazzMap({ onZoneSelect, selectedZoneId, basePrice }: VenueMapProps) {
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
          <rect x="250" y="30" width="300" height="70" rx="4" 
            className="fill-magenta/20 stroke-magenta stroke-[3px]" />
          <text x="400" y="72" textAnchor="middle" className="fill-magenta text-xl font-bold tracking-[0.2em] pointer-events-none">ESCENARI</text>
        </g>

        {/* VIP ESQUERRE (BALCÓ) */}
        <path d="M 120 150 L 220 150 L 220 480 L 120 480 Z" 
          className={getPathClass('vip-esquerre')}
          onClick={() => handleSelect('vip-esquerre')} />
        <g transform="translate(170, 315) rotate(-90)">
          <text x="0" y="0" textAnchor="middle" className="fill-cyan pointer-events-none text-sm font-bold tracking-wider">VIP LATERAL ESQ.</text>
        </g>

        {/* VIP DRET (BALCÓ) */}
        <path d="M 580 150 L 680 150 L 680 480 L 580 480 Z" 
          className={getPathClass('vip-dret')}
          onClick={() => handleSelect('vip-dret')} />
        <g transform="translate(630, 315) rotate(90)">
          <text x="0" y="0" textAnchor="middle" className="fill-cyan pointer-events-none text-sm font-bold tracking-wider">VIP LATERAL DRET</text>
        </g>

        {/* VIP FRONTAL (BALCÓ FONS) */}
        <path d="M 120 495 L 680 495 L 680 570 L 120 570 Z" 
          className={getPathClass('vip-frontal')}
          onClick={() => handleSelect('vip-frontal')} />
        <text x="400" y="538" textAnchor="middle" className="fill-cyan pointer-events-none text-sm font-bold tracking-[0.1em]">VIP FRONTAL (BALCÓ)</text>

        {/* PISTA GENERAL */}
        <path d="M 235 150 L 565 150 L 565 480 L 235 480 Z" 
          className={getPathClass('pista-general')}
          onClick={() => handleSelect('pista-general')} />
        <text x="400" y="320" textAnchor="middle" className="fill-cyan pointer-events-none text-2xl font-bold tracking-[0.1em]">PISTA GENERAL</text>
      </svg>
    </div>
  );
}
