"use client";

import { useState, useEffect } from "react";
// import { socket } from "@/lib/socket"; // Pel temps real en servidor final

export default function AdminDashboard() {
  // Mock d'Estadístiques
  const [stats, setStats] = useState({
    activeConnections: 124,
    totalSales: 48500,
    seats: {
      total: 5000,
      sold: 3421,
      reserved: 245,
      available: 1334
    }
  });

  // Simulem actualitzacions en temps real
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeConnections: prev.activeConnections + Math.floor(Math.random() * 5) - 2,
        // Petites variacions per donar vida a les reserves i el temps real
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const occupancyRate = ((stats.seats.sold + stats.seats.reserved) / stats.seats.total) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan/20 pb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-cyan">TixFlow</span> Admin
          </h1>
          <p className="text-gray-400 text-sm mt-1">Control de recintes i mètriques en Temps Real</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-full">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-emerald-400 text-sm font-medium tracking-wide">Servidors Operatius</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-xl border border-cyan/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-[100px] z-0"></div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2 relative z-10">Usuaris Connectats</h3>
          <p className="text-4xl font-bold text-white relative z-10">{stats.activeConnections}</p>
          <div className="mt-2 text-xs text-blue-400 font-medium">Sockets actius (en viu)</div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-cyan/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-magenta/10 rounded-bl-[100px] z-0"></div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2 relative z-10">Ingressos (Avui)</h3>
          <p className="text-4xl font-bold text-white relative z-10">{stats.totalSales.toLocaleString()}€</p>
          <div className="mt-2 text-xs text-magenta font-medium">+12% des d'ahir</div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-cyan/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan/10 rounded-bl-[100px] z-0"></div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2 relative z-10">Ocupació Total</h3>
          <p className="text-4xl font-bold text-white relative z-10">{occupancyRate.toFixed(1)}%</p>
          <div className="mt-3 w-full bg-background rounded-full h-1.5">
            <div className="bg-cyan h-1.5 rounded-full" style={{ width: `${occupancyRate}%` }}></div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-cyan/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-[100px] z-0"></div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2 relative z-10">Overbooking Evitat</h3>
          <p className="text-4xl font-bold text-white relative z-10">45</p>
          <div className="mt-2 text-xs text-amber-500 font-medium">Bloquejats per Concurrència (PostgreSQL)</div>
        </div>
      </div>

      {/* Gràfic / Llista principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-cyan/20">
          <h3 className="text-xl font-bold mb-6 text-white border-b border-cyan/20 pb-3">Estat de Seients (Esdeveniment Actual)</h3>
          
          <div className="flex flex-col md:flex-row gap-6 items-center justify-center py-6">
            {/* Donut Chart Simulat */}
            <div className="relative w-48 h-48 rounded-full border-[16px] border-surface flex items-center justify-center 
              shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
              style={{
                background: `conic-gradient(
                  #ef4444 0% ${(stats.seats.sold/stats.seats.total)*100}%,
                  #f59e0b ${(stats.seats.sold/stats.seats.total)*100}% ${((stats.seats.sold+stats.seats.reserved)/stats.seats.total)*100}%,
                  #10b981 ${((stats.seats.sold+stats.seats.reserved)/stats.seats.total)*100}% 100%
                )`
              }}
            >
              <div className="w-32 h-32 bg-surface rounded-full flex flex-col items-center justify-center z-10">
                <span className="text-xs text-gray-400 uppercase">Aforament</span>
                <span className="text-xl font-bold">{stats.seats.total}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 font-mono text-sm w-full md:w-auto">
              <div className="flex items-center justify-between gap-4 bg-background p-3 rounded border-l-4 border-red-500">
                <span className="text-gray-300">Venuts (Consolidats)</span>
                <span className="text-white font-bold text-lg">{stats.seats.sold}</span>
              </div>
              <div className="flex items-center justify-between gap-4 bg-background p-3 rounded border-l-4 border-amber-500">
                <span className="text-gray-300">Reservats (Temporals)</span>
                <span className="text-white font-bold text-lg">{stats.seats.reserved}</span>
              </div>
              <div className="flex items-center justify-between gap-4 bg-background p-3 rounded border-l-4 border-emerald-500">
                <span className="text-gray-300">Disponibles</span>
                <span className="text-white font-bold text-lg">{stats.seats.available}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-cyan/20 flex flex-col">
          <h3 className="text-xl font-bold mb-4 text-white border-b border-cyan/20 pb-3">Registre d'Activitat</h3>
          <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-3 font-mono text-xs">
            <div className="flex gap-2">
              <span className="text-cyan">[10:24:32]</span>
              <span className="text-gray-300">Socket: Compra confirmada seient C12</span>
            </div>
            <div className="flex gap-2">
              <span className="text-amber-500">[10:24:28]</span>
              <span className="text-gray-300">PostgreSQL: Bloqueig temporal concedit D4</span>
            </div>
            <div className="flex gap-2">
              <span className="text-red-400">[10:24:20]</span>
              <span className="text-gray-300 text-opacity-80">Failed: Conflicte de concurrència seient F1 (Intent 2)</span>
            </div>
            <div className="flex gap-2">
              <span className="text-cyan">[10:24:15]</span>
              <span className="text-gray-300">Nova connexió client id: #a8b9...</span>
            </div>
            <div className="flex gap-2">
              <span className="text-cyan">[10:23:59]</span>
              <span className="text-gray-300">Socket: Compra confirmada seient A1, A2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
