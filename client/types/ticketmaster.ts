export interface TicketmasterEvent {
  id: string;
  name: string;
  dateTime: string | null;
  venue: string;
  imageUrl: string;
  salesStatus: string;
  priceMin: number | null;
  priceMax: number | null;
  ticketUrl: string;
  isHighlightedVenue: boolean;
  genre: string | null;
  segment: string | null;
}
