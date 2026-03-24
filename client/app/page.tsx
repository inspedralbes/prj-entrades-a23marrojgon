import EventCard, { EventType } from "@/components/EventCard";

// Mock data fins que l'API estigui funcional
const mockEvents: EventType[] = [
  {
    id: "evt_001",
    title: "Neon City Festival 2026",
    date: "15 d'Agost, 2026 - 22:00h",
    location: "Estadi CyberGlitch, Barcelona",
    priceStart: 45,
    status: "available",
  },
  {
    id: "evt_002",
    title: "Synthwave Nights: The Midnight",
    date: "3 de Setembre, 2026 - 21:00h",
    location: "Sala Razzmatazz (Holo-Deck)",
    priceStart: 30,
    status: "available",
  },
  {
    id: "evt_003",
    title: "Final Mundial de E-Sports",
    date: "12 d'Octubre, 2026 - 16:00h",
    location: "Palau Sant Jordi",
    priceStart: 75,
    status: "sold_out",
  }
];

// Com indica el context, aquesta ha de ser un Server Component (SSR).
export default async function Home() {
  // Simulació d'una petició al backend
  // const response = await fetch('http://api-laravel/api/events');
  // const events = await response.json();
  const events = mockEvents;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan to-magenta">
          Viu el Futur en Temps Real
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          TixFlow és la nova generació de ticketing. Segur, ràpid, i sense 
          sorpreses gràcies a la nostra sincronització de seients mil·lisegon a mil·lisegon.
        </p>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold border-l-4 border-cyan pl-3">
          Pròxims Esdeveniments
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}