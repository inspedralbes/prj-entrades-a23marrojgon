'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export default function AdminConcerts() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [concerts, setConcerts] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConcert, setEditingConcert] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    venue: '',
    price: '',
    total_tickets: '',
    image_url: '',
  });

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.email !== 'admin@tixflow.com') {
        router.push('/');
        return;
      }
      // Primera càrrega i sincronització automàtica
      const init = async () => {
        await handleSync(); // Sincronitza amb Ticketmaster al entrar
        await fetchConcerts();
      };
      init();
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchConcerts = async () => {
    try {
      const token = localStorage.getItem('tixflow_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/concerts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConcerts(Array.isArray(data) ? data : []);
      } else {
        if (response.status === 401) {
            router.push('/'); // Redirigir si el token ha expirat o és invàlid
        }
        setConcerts([]);
      }
    } catch (error) {
      console.error('Error fetching concerts:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem('tixflow_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/sync-ticketmaster`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('Sincronització automàtica completada');
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('tixflow_token');
    const url = editingConcert 
      ? `${process.env.NEXT_PUBLIC_API_URL}/admin/concerts/${editingConcert.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/admin/concerts`;
    
    const method = editingConcert ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingConcert(null);
        setFormData({ name: '', description: '', date: '', venue: '', price: '', total_tickets: '', image_url: '' });
        fetchConcerts();
      }
    } catch (error) {
      console.error('Error saving concert:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Estàs segur que vols esborrar aquest concert?')) return;
    
    const token = localStorage.getItem('tixflow_token');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/concerts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchConcerts();
    } catch (error) {
      console.error('Error deleting concert:', error);
    }
  };

  const openEdit = (concert: any) => {
    setEditingConcert(concert);
    setFormData({
      name: concert.name,
      description: concert.description || '',
      date: concert.date ? new Date(concert.date).toISOString().slice(0, 16) : '', // Format for datetime-local
      venue: concert.venue,
      price: concert.price.toString(),
      total_tickets: concert.total_tickets.toString(),
      image_url: concert.image_url || '',
    });
    setShowModal(true);
  };

  if (isFetching && concerts.length === 0) return (
    <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-cyan animate-pulse font-black uppercase tracking-[0.3em] flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin"></div>
            Sincronitzant amb Ticketmaster...
        </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Gestió de <span className="text-cyan">Concerts</span></h2>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Base de dades local activa</p>
        </div>
        <div className="flex gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
              isSyncing ? 'bg-cyan/10 text-cyan border-cyan/30' : 'bg-green-500/10 text-green-500 border-green-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-cyan animate-pulse' : 'bg-green-500'}`}></span>
            {isSyncing ? 'Sincronitzant...' : 'Sincronitzat'}
          </div>
          <button 
            onClick={() => { setEditingConcert(null); setShowModal(true); }}
            className="bg-cyan text-black px-6 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            Afegir Concert
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Imatge</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Concert</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Venut</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Recinte</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Data</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Accions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {concerts.map((concert) => (
              <tr key={concert.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                    {concert.image_url && <img src={concert.image_url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-white">{concert.name}</div>
                  <div className="text-[10px] text-cyan font-mono">{concert.price} €</div>
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="inline-block px-3 py-1 rounded bg-magenta/10 border border-magenta/20">
                        <span className="text-xs font-black text-magenta">{concert.tickets_count || 0}</span>
                    </div>
                </td>
                <td className="px-6 py-4 text-xs text-white/60 font-bold uppercase">{concert.venue}</td>
                <td className="px-6 py-4 text-[10px] text-white/40 font-mono">{new Date(concert.date).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(concert)} className="p-2 hover:text-cyan text-white/20 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(concert.id)} className="p-2 hover:text-magenta text-white/20 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 w-full max-w-xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black text-white uppercase italic">{editingConcert ? 'Editar' : 'Nou'} Concert</h3>
              <button onClick={() => setShowModal(false)} className="text-white/20 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1 block">Nom</label>
                  <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan/50 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1 block">Recinte</label>
                  <input required value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan/50 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1 block">Data i Hora</label>
                  <input required type="datetime-local" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan/50 transition-all shadow-[color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1 block">Preu (€)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan/50 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1 block">Entrades Totals</label>
                  <input required type="number" value={formData.total_tickets} onChange={(e) => setFormData({...formData, total_tickets: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan/50 transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1 block">URL Imatge</label>
                  <input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan/50 transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1 block">Descripció</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan/50 transition-all resize-none" />
                </div>
              </div>
              <button type="submit" className="w-full bg-cyan text-black font-black uppercase py-4 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-[0.2em]">
                {editingConcert ? 'Actualitzar Concert' : 'Crear Concert'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
