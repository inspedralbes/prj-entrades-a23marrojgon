export type ZoneStatus = 'available' | 'sold-out' | 'reserved';

export interface MapZone {
  id: string;
  name: string;
  price: number;
  status: ZoneStatus;
}

export interface VenueMapProps {
  onZoneSelect: (zone: MapZone | null) => void;
  selectedZoneId: string | null;
  basePrice: number;
}
