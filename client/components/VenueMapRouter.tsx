import { VenueMapProps } from '@/types/map';
import PalauSantJordiMap from './maps/PalauSantJordiMap';
import RazzmatazzMap from './maps/RazzmatazzMap';
import SantJordiClubMap from './maps/SantJordiClubMap';

interface RouterProps extends VenueMapProps {
  venueGroup: string;
}

export default function VenueMapRouter({ venueGroup, ...props }: RouterProps) {
  const normalizedGroup = venueGroup?.toLowerCase() || '';

  if (normalizedGroup.includes('palau sant jordi')) {
    return <PalauSantJordiMap {...props} />;
  }
  
  if (normalizedGroup.includes('razz') || normalizedGroup.includes('razzmatazz')) {
    return <RazzmatazzMap {...props} />;
  }
  
  if (normalizedGroup.includes('sant jordi club')) {
    return <SantJordiClubMap {...props} />;
  }

  // Fallback map if venue doesn't match
  return (
    <div className="w-full aspect-[4/3] bg-surface/50 border border-white/5 rounded-2xl flex items-center justify-center p-8 text-center">
      <div>
        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-gray-400 font-medium">No hi ha un mapa interactiu disponible per a {venueGroup || "aquest recinte"}.</p>
      </div>
    </div>
  );
}
