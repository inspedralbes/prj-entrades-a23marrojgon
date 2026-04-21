'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export default function AdminUsers() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.email !== 'admin@tixflow.com') {
        router.push('/');
        return;
      }
      fetchUsers();
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('tixflow_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsFetching(false);
    }
  };

  if (isFetching) return <div className="text-cyan animate-pulse font-black uppercase tracking-widest">Escanejant usuaris...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Gestió d' <span className="text-yellow-500">Usuaris</span></h2>
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Dades d'accés centralitzades</p>
      </div>

      <div className="bg-surface/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">ID</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Nom Complet</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Correu Electrònic</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Rol</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Total Gasto</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Data Registre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 font-mono text-[10px] text-white/20">#{u.id.toString().padStart(4, '0')}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-white group-hover:text-yellow-500 transition-colors uppercase">{u.name}</div>
                </td>
                <td className="px-6 py-4 text-xs text-white/60 font-mono italic">{u.email}</td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                        u.role === 'admin' 
                            ? 'bg-cyan/10 text-cyan border border-cyan/30' 
                            : 'bg-white/5 text-white/40 border border-white/10'
                    }`}>
                        {u.role}
                    </span>
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="inline-block px-3 py-1 rounded bg-yellow-500/10 border border-yellow-500/20">
                        <span className="text-xs font-black text-yellow-500">
                          {Number(u.tickets_sum_price || 0).toFixed(2)}€
                        </span>
                    </div>
                </td>
                <td className="px-6 py-4 text-[10px] text-white/40 font-mono tracking-tighter">
                    {new Date(u.created_at).toLocaleDateString('ca-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Informació de Privacitat</p>
              <p className="text-xs text-white/40">D'acord amb el GDPR, les dades dels usuaris només són visibles per als administradors autoritzats.</p>
          </div>
      </div>
    </div>
  );
}
