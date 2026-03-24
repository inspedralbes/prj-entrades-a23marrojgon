"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTicketStore } from '@/store/useTicketStore';
import Timer from '@/components/Timer';

export default function CheckoutPage() {
  const router = useRouter();
  const { seats, selectedSeatIds, updateSeatStatus, clearSelection, setTimer } = useTicketStore();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Detalls dels seients escullits
  const selectedSeatsInfo = seats.filter(s => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeatsInfo.reduce((sum, seat) => sum + seat.price, 0);

  // Redirigir a la home si no hi ha seients
  useEffect(() => {
    if (selectedSeatIds.length === 0 && !isProcessing) {
      router.push('/');
    }
  }, [selectedSeatIds, router, isProcessing]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulem el delay d'un pagament
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Confirmem el pagament, canviant l'estat dels seients a "sold" localment
    selectedSeatIds.forEach(id => {
      updateSeatStatus(id, 'sold');
    });

    // En un cas real faríem:
    // await fetch('/api/checkout', { method: 'POST', body: ... })
    // if success -> socket.emit('seat:sold', { seats: selectedSeatIds })
    
    // Netejar la selecció i parar el timer
    clearSelection();
    setTimer(0, 0);
    
    // Anem als tickets
    router.push('/tickets');
  };

  if (selectedSeatIds.length === 0 && !isProcessing) return null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
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
          
          <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6 flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Nom complet</label>
                <input required type="text" className="w-full bg-background border border-cyan/30 rounded p-3 text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all" placeholder="Ada Lovelace" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Correu electrònic</label>
                <input required type="email" className="w-full bg-background border border-cyan/30 rounded p-3 text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all" placeholder="ada@cyberpunk.net" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white pt-4 mt-4 border-t border-cyan/20">
              Pagament
            </h3>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Número de Targeta</label>
                <input required type="text" className="w-full bg-background border border-cyan/30 rounded p-3 text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all font-mono" placeholder="4111 •••• •••• ••••" />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Caducitat</label>
                  <input required type="text" className="w-full bg-background border border-cyan/30 rounded p-3 text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all font-mono" placeholder="MM/YY" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">CVC</label>
                  <input required type="text" className="w-full bg-background border border-cyan/30 rounded p-3 text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all font-mono" placeholder="123" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex-1 flex flex-col justify-end">
              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-magenta text-white font-bold text-lg uppercase tracking-widest rounded transition-all hover:bg-magenta/90 hover:shadow-[0_0_25px_rgba(255,0,160,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processant Pagament...
                  </>
                ) : (
                  `Pagar ${totalPrice}€`
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
