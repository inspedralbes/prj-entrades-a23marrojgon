import Link from "next/link";

export interface EventType {
  id: string;
  title: string;
  date: string;
  location: string;
  priceStart: number;
  image?: string;
  status: 'available' | 'sold_out';
}

interface EventCardProps {
  event: EventType;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden bg-surface border border-cyan/10 hover:border-cyan/50 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]">
      <div className="h-48 bg-background relative border-b border-cyan/20">
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent z-10" />
        {/* Placeholder image representation with CSS gradient if no image */}
        <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black flex items-center justify-center">
          <span className="text-cyan opacity-20 text-6xl rotate-[-10deg] font-bold tracking-tighter">
            TIXFLOW
          </span>
        </div>
        
        {event.status === 'sold_out' && (
          <div className="absolute top-4 right-4 z-20 bg-magenta text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(255,0,160,0.8)]">
            Esgotat
          </div>
        )}
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">{event.title}</h3>
        
        <div className="flex items-center text-sm text-gray-400 mb-1">
          <svg className="w-4 h-4 mr-2 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {event.date}
        </div>
        
        <div className="flex items-center text-sm text-gray-400 mb-6">
          <svg className="w-4 h-4 mr-2 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.location}
        </div>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="text-lg font-bold text-cyan">
            Des de {event.priceStart}€
          </div>
          <Link
            href={`/events/${event.id}`}
            className={`px-4 py-2 rounded font-medium text-sm transition-all ${
              event.status === 'available'
                ? 'bg-cyan text-background hover:shadow-[0_0_15px_rgba(0,240,255,0.6)]'
                : 'bg-surface border border-gray-600 text-gray-400 cursor-not-allowed pointer-events-none'
            }`}
          >
            Veure Entrades
          </Link>
        </div>
      </div>
    </div>
  );
}
