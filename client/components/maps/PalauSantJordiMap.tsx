import { MapZone, VenueMapProps } from '@/types/map';

const zones: MapZone[] = [
  { id: 'pista-general', name: 'Pista General', price: 0, status: 'available' },
  { id: 'front-stage', name: 'Front Stage', price: 40, status: 'available' },
  { id: 'grada-inf-esquerra', name: 'Grada Inferior Esquerra', price: 20, status: 'available' },
  { id: 'grada-inf-dreta', name: 'Grada Inferior Dreta', price: 20, status: 'available' },
  { id: 'grada-inf-fons', name: 'Grada Inferior Fons', price: 10, status: 'available' },
  { id: 'grada-sup-esquerra', name: 'Grada Sup. Esquerra', price: 0, status: 'available' },
  { id: 'grada-sup-dreta', name: 'Grada Sup. Dreta', price: 0, status: 'available' },
  { id: 'grada-sup-fons', name: 'Grada Sup. Fons', price: -10, status: 'available' },
];

export default function PalauSantJordiMap({ onZoneSelect, selectedZoneId, basePrice }: VenueMapProps) {
  // Inicialitza preus basats en preu base
  const runtimeZones = zones.map(z => ({
    ...z,
    price: Math.max(10, basePrice + z.price), // Evitem preus negatius si el base és baix
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
        {/* Escenari */}
        <g className="opacity-90">
          <rect x="250" y="30" width="300" height="60" rx="10" 
            className="fill-magenta/20 stroke-magenta stroke-[3px]" />
          <text x="400" y="65" textAnchor="middle" className="fill-magenta text-xl font-bold tracking-[0.2em] font-sans pointer-events-none">ESCENARI</text>
        </g>

        {/* FRONT STAGE */}
        <path d="M 250 110 L 550 110 C 580 150, 580 150, 600 200 L 200 200 C 220 150, 220 150, 250 110 Z" 
          className={getPathClass('front-stage')}
          onClick={() => handleSelect('front-stage')} />
        <text x="400" y="165" textAnchor="middle" className="fill-cyan pointer-events-none text-sm font-semibold tracking-wider">FRONT STAGE</text>

        {/* PISTA GENERAL */}
        <path d="M 200 210 L 600 210 C 620 300, 630 350, 630 400 L 170 400 C 170 350, 180 300, 200 210 Z" 
          className={getPathClass('pista-general')}
          onClick={() => handleSelect('pista-general')} />
        <text x="400" y="310" textAnchor="middle" className="fill-cyan pointer-events-none text-lg font-bold tracking-[0.1em]">PISTA GENERAL</text>

        {/* GRADA INFERIOR ESQUERRA */}
        <path d="M 140 120 L 190 120 C 160 200, 140 300, 140 400 L 80 400 C 80 300, 100 200, 140 120 Z" 
          className={getPathClass('grada-inf-esquerra')}
          onClick={() => handleSelect('grada-inf-esquerra')} />
        
        {/* GRADA SUPERIOR ESQUERRA */}
        <path d="M 90 100 L 130 100 C 100 180, 70 280, 70 410 L 10 410 C 10 280, 40 180, 90 100 Z" 
          className={getPathClass('grada-sup-esquerra')}
          onClick={() => handleSelect('grada-sup-esquerra')} />

        {/* GRADA INFERIOR DRETA */}
        <path d="M 660 120 L 610 120 C 640 200, 660 300, 660 400 L 720 400 C 720 300, 700 200, 660 120 Z" 
          className={getPathClass('grada-inf-dreta')}
          onClick={() => handleSelect('grada-inf-dreta')} />
        
        {/* GRADA SUPERIOR DRETA */}
        <path d="M 710 100 L 670 100 C 700 180, 730 280, 730 410 L 790 410 C 790 280, 760 180, 710 100 Z" 
          className={getPathClass('grada-sup-dreta')}
          onClick={() => handleSelect('grada-sup-dreta')} />

        {/* GRADA INFERIOR FONS */}
        <path d="M 145 420 L 655 420 C 655 450, 620 480, 550 500 L 250 500 C 180 480, 145 450, 145 420 Z" 
          className={getPathClass('grada-inf-fons')}
          onClick={() => handleSelect('grada-inf-fons')} />
        <text x="400" y="470" textAnchor="middle" className="fill-cyan pointer-events-none text-xs tracking-wider">G. INFERIOR FONS</text>

        {/* GRADA SUPERIOR FONS */}
        <path d="M 85 435 L 715 435 C 715 480, 670 520, 580 550 L 220 550 C 130 520, 85 480, 85 435 Z" 
          className={getPathClass('grada-sup-fons')}
          onClick={() => handleSelect('grada-sup-fons')} />
        <text x="400" y="525" textAnchor="middle" className="fill-cyan pointer-events-none text-xs tracking-wider">G. SUPERIOR FONS</text>

      </svg>
    </div>
  );
}
