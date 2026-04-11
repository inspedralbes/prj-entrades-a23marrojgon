"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTicketStore } from '@/store/useTicketStore';
import Timer from '@/components/Timer';
import { socket } from '@/lib/socket';

export default function CheckoutPage() {
  const router = useRouter();
  const { selectedSeats, updateSeatStatus, clearSelection, setTimer, concertId, setProceedingToCheckout } = useTicketStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // Detalls dels seients escullits (ara ja venen complets de l'Store)
  const selectedSeatsInfo = selectedSeats;
  const totalPrice = selectedSeatsInfo.reduce((sum, seat) => sum + seat.price, 0);

  // Redirigir a la home si no hi ha seients
  useEffect(() => {
    if (selectedSeats.length === 0 && !isProcessing) {
      router.push('/');
    }
    // Sempre ens assegurem que el flag de "navegant cap a checkout" es reseteja al entrar
    setProceedingToCheckout(false);
  }, [selectedSeats, router, isProcessing, setProceedingToCheckout]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);

    // Usem el concertId real guardat al store
    let currentConcertId = concertId;
    if (!currentConcertId && selectedSeats.length > 0) {
      console.warn("ConcertId missing from store, attempting fallback");
      // Fallback extrem: si per algun motiu no hi és, provem d'extreure'l de l'ID si no és virtual
      const possibleId = selectedSeats[0]?.id.split('-')[0];
      if (possibleId && possibleId.length > 5) { // Els tm_id són llargs, les prefixes 'V' o 'F' no
        currentConcertId = possibleId;
      }
    }

    if (!currentConcertId) {
      alert("Error: No es troba el codi del concert. Torna al mapa i torna a seleccionar.");
      setIsProcessing(false);
      return;
    }


    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tixflow_token')}`
        },
        body: JSON.stringify({
          concert_id: currentConcertId,
          seats: selectedSeatsInfo.map(s => ({
            id: s.id,
            price: s.price,
            row: s.row,
            col: s.col,
            zone: s.zoneId
          })),
          email: formData.get('email'),
          name: formData.get('name')
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error en el pagament');
      }

      const result = await response.json();

      // Marcar com a venuts localment i notificar sockets
      selectedSeats.forEach(seat => {
        updateSeatStatus(seat.id, 'sold');
        // Notificar al servidor de sockets que aquesta butaca s'ha venut
        socket.emit('seat:sold', {
          concertId: currentConcertId,
          zoneId: seat.zoneId,
          seatId: seat.id
        });
      });

      alert('¡Compra realitzada amb èxit! Rebràs un correu amb les teves entrades en uns segons.');

      clearSelection();
      setTimer(0, 0);
      router.push('/tickets');

    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message || 'Hi ha hagut un error processant el pagament.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedSeats.length === 0 && !isProcessing) return null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan to-magenta">
            Finalitzar Compra
          </h1>
          <p className="text-gray-400 mt-2">Completa el formulari abans que s'esgoti el temps per assegurar els teus seients.</p>
        </div>

        <Timer />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Formulari Pagament */}
        <div className="flex-1 bg-surface p-8 rounded-xl border border-cyan/20">
          <h2 className="text-2xl font-bold text-white mb-6 border-b border-cyan/20 pb-4">
            Dades de Comprador
          </h2>

          <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Nom complet</label>
                <input required name="name" type="text" className="w-full bg-background border border-cyan/30 rounded p-3 text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all" placeholder="Ada Lovelace" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Correu electrònic</label>
                <input required name="email" type="email" className="w-full bg-background border border-cyan/30 rounded p-3 text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all" placeholder="ada@cyberpunk.net" />
              </div>
            </div>


            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  const targetId = concertId;

                  // Alliberem butaques al servidor abans de tornar
                  if (selectedSeats.length > 0) {
                    socket.emit('seat:release_all', { concertId: targetId });
                    clearSelection();
                  }

                  setProceedingToCheckout(false);
                  router.push(targetId ? `/events/${targetId}` : '/');
                }}
                className="px-4 py-1.5 bg-white/5 text-white font-bold text-xs uppercase tracking-widest rounded border border-white/10 transition-all hover:bg-white/10"
              >
                Tornar al Mapa
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-1.5 bg-magenta text-white font-bold text-xs uppercase tracking-widest rounded transition-all hover:bg-magenta/90 hover:shadow-[0_0_25px_rgba(255,0,160,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processant...
                  </>
                ) : (
                  `Confirmar Compra - ${totalPrice}€`
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Resum Comanda */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          <div className="bg-surface p-6 rounded-xl border border-cyan/20 sticky top-24">
            <h3 className="text-xl font-bold mb-4 text-cyan border-b border-cyan/20 pb-2">Resum de la Comanda</h3>

            <div className="flex flex-col gap-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
              {selectedSeatsInfo.map(seat => (
                <div key={seat.id} className="flex flex-col py-2 border-b border-gray-800 last:border-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white">Neon City Festival</span>
                    <span className="text-cyan font-bold">{seat.price}€</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>Estadi CyberGlitch</span>
                    <span>Seient {seat.id} (Fila {seat.row})</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-cyan/20 pt-4 mb-2">
              <div className="flex justify-between items-center text-gray-400 mb-2">
                <span>Subtotal</span>
                <span>{totalPrice}€</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 mb-2">
                <span>Despeses de Gestió</span>
                <span>0.00€</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-white mt-4">
                <span>Total a Pagar</span>
                <span className="text-magenta">{totalPrice}€</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
