"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTicketStore, Seat as SeatType } from "@/store/useTicketStore";
import Seat from "./Seat";
import Link from "next/link";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/useAuthStore";

interface ZoneSeatMapProps {
  concertId: string;
  zoneId: string;
  zoneName: string;
  basePrice: number;
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════
// DISTRIBUCIÓ REAL PALAU SANT JORDI
// ═══════════════════════════════════════════════════════
// Font: mapaplan.com, seatpick.com, palausantjordi.barcelona
//
// PISTA / FRONT STAGE → Zona dreta (standing), sense butaques.
// GRADA INFERIOR → Sectors 101-112, 10-20 files, ~15 seients/fila
// GRADA SUPERIOR → Sectors 201-212, menys files, menys seients
// PMR → Disponible a Nivell 100 i 200
// Numeració de seients: SENARS a un costat del passadís, PARELLS a l'altre
// ═══════════════════════════════════════════════════════

/**
 * Definció d'una fila real amb numeració senar/parell
 * separada per passadís central, tal com és al Palau
 */
interface RowDef {
  label: string;
  seatsLeft: number;   // butaques al costat esquerre (senars: 1,3,5...)
  seatsRight: number;  // butaques al costat dret (parells: 2,4,6...)
  pmrLeft?: number;
  pmrRight?: number;
  indent?: number;     // sagnat per simular curvatura
}

interface ZoneLayout {
  rows: RowDef[];
  sectionLabel: string;
  isStanding: boolean;  // true = zona dreta, sense butaques
}

/**
 * Distribucions reals per zona.
 * Grada Inferior: Sectors ~101-112, Files 1-15, 8-20 seients per costat
 * Grada Superior: Sectors ~201-212, Files 1-10, 6-14 seients per costat
 */
function getZoneLayout(zoneId: string): ZoneLayout {
  // ─── PALAU SANT JORDI (DINÀMIC) ───
  if (zoneId.startsWith("palau-")) {
    const sectorNum = parseInt(zoneId.split("-")[1]);
    const isUpper = sectorNum >= 200;

    // Sectors de fons (més amples, menys profunds)
    const isFons = (sectorNum >= 105 && sectorNum <= 109) || (sectorNum >= 205 && sectorNum <= 209);
    // Sectors laterals (més profunds, menys amples)
    const isLateral = !isFons;

    let rowsCount = isUpper ? 8 : 12;
    let seatsPerRow = isUpper ? 6 : 10;

    if (isFons) {
      rowsCount = isUpper ? 6 : 9;
      seatsPerRow = isUpper ? 10 : 15;
    } else if (isLateral) {
      rowsCount = isUpper ? 10 : 16;
      seatsPerRow = isUpper ? 5 : 8;
    }

    return {
      sectionLabel: `PALAU SANT JORDI · SECTOR ${sectorNum}`,
      isStanding: false,
      rows: Array.from({ length: rowsCount }, (_, i) => ({
        label: (i + 1).toString(),
        seatsLeft: seatsPerRow,
        seatsRight: seatsPerRow,
        indent: Math.max(0, Math.floor(rowsCount / 2) - i)
      })),
    };
  }

  // ─── SANT JORDI CLUB (DINÀMIC) ───
  if (zoneId.startsWith("sj-")) {
    return {
      sectionLabel: `SANT JORDI CLUB · ${zoneId.replace('sj-', '').toUpperCase()}`,
      isStanding: zoneId === 'pista-general',
      rows: Array.from({ length: 10 }, (_, i) => ({
        label: (i + 1).toString(),
        seatsLeft: 12,
        seatsRight: 12,
        indent: 0
      })),
    };
  }

  // ─── RAZZMATAZZ (DINÀMIC) ───
  if (zoneId.startsWith("razz-")) {
    return {
      sectionLabel: `RAZZMATAZZ · ${zoneId.replace('razz-', '').toUpperCase()}`,
      isStanding: zoneId === 'pista-general',
      rows: Array.from({ length: 8 }, (_, i) => ({
        label: (i + 1).toString(),
        seatsLeft: 10,
        seatsRight: 10,
        indent: 0
      })),
    };
  }

  switch (zoneId) {
    // ─── PISTA / FRONT STAGE ───────
    case "front-stage":
      return {
        sectionLabel: "FRONT STAGE · Proximitat Escenari",
        isStanding: true,
        rows: [],
      };

    case "pista-general":
      return {
        sectionLabel: "PISTA GENERAL · Entrada General",
        isStanding: true,
        rows: [],
      };

    // ─── LLEGAT / COMPATIBILITAT ────
    case "grada-inf-esquerra":
    case "grada-inf-dreta":
    case "grada-inf-fons":
      return {
        sectionLabel: "GRADA INFERIOR · Zona General",
        isStanding: false,
        rows: Array.from({ length: 15 }, (_, i) => ({
          label: (i + 1).toString(),
          seatsLeft: 10,
          seatsRight: 10,
          indent: Math.max(0, 10 - i)
        })),
      };

    case "grada-sup-esquerra":
    case "grada-sup-dreta":
    case "grada-sup-fons":
      return {
        sectionLabel: "GRADA SUPERIOR · Zona General",
        isStanding: false,
        rows: Array.from({ length: 10 }, (_, i) => ({
          label: (i + 1).toString(),
          seatsLeft: 8,
          seatsRight: 8,
          indent: Math.max(0, 5 - i)
        })),
      };

    default:
      return {
        sectionLabel: "Zona",
        isStanding: zoneId.includes("pista") || zoneId.includes("standing"),
        rows: [],
      };
  }
}

/**
 * Genera els seients amb numeració real del Palau:
 * - Costat esquerre: senars (1, 3, 5, 7...)
 * - Passadís central
 * - Costat dret: parells (2, 4, 6, 8...)
 */
function generateSeatsFromLayout(rowDefs: RowDef[], basePrice: number, zoneId: string): SeatType[] {
  const allSeats: SeatType[] = [];

  rowDefs.forEach((rowDef) => {
    // PMR esquerra
    if (rowDef.pmrLeft) {
      for (let p = 0; p < rowDef.pmrLeft; p++) {
        allSeats.push({
          id: `F${rowDef.label}-PMR${p + 1}`,
          row: rowDef.label,
          col: p + 1,
          zoneId: zoneId,
          status: 'available',
          price: basePrice,
          isPMR: true,
        });
      }
    }

    // Costat esquerre (senars: 1, 3, 5, 7...)
    for (let i = 0; i < rowDef.seatsLeft; i++) {
      const seatNum = i * 2 + 1; // 1, 3, 5, 7...
      allSeats.push({
        id: `F${rowDef.label}-${seatNum}`,
        row: rowDef.label,
        col: seatNum,
        zoneId: zoneId,
        status: 'available',
        price: basePrice,
      });
    }

    // Passadís central
    if (rowDef.seatsLeft > 0 || rowDef.seatsRight > 0) {
      allSeats.push({
        id: `F${rowDef.label}-aisle`,
        row: rowDef.label,
        col: 0,
        zoneId: zoneId,
        status: "available",
        price: 0,
        isAisle: true,
      });
    }

    // Costat dret (parells: 2, 4, 6, 8...)
    for (let i = 0; i < rowDef.seatsRight; i++) {
      const seatNum = i * 2 + 2; // 2, 4, 6, 8...
      allSeats.push({
        id: `F${rowDef.label}-${seatNum}`,
        row: rowDef.label,
        col: seatNum,
        zoneId: zoneId,
        status: 'available',
        price: basePrice,
      });
    }

    // PMR dreta
    if (rowDef.pmrRight) {
      for (let p = 0; p < rowDef.pmrRight; p++) {
        allSeats.push({
          id: `F${rowDef.label}-PMR${(rowDef.pmrLeft || 0) + p + 1}`,
          row: rowDef.label,
          col: 100 + p,
          zoneId: zoneId,
          status: 'available',
          price: basePrice,
          isPMR: true,
        });
      }
    }
  });

  return allSeats;
}

// ═══════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════

export default function ZoneSeatMap({ concertId, zoneId, zoneName, basePrice, onBack }: ZoneSeatMapProps) {
  const router = useRouter();
  const {
    seats,
    setSeats,
    updateSeatStatus,
    selectedSeats,
    clearSelection,
    toggleSeatSelection,
    setConcertId,
    purchasedCount,
    setPurchasedCount,
    isProceedingToCheckout,
    setProceedingToCheckout
  } = useTicketStore();
  const { user, token } = useAuthStore();

  const layout = useMemo(() => getZoneLayout(zoneId), [zoneId]);

  // Fixar concertId al store i carregar dades de l'usuari
  // Sincronització inicial i alliberament al sortir
  useEffect(() => {
    if (concertId) {
      setConcertId(concertId);
      // Resetegem el flag de checkout al entrar a una zona
      setProceedingToCheckout(false);

      // Carregar quantes entrades ja té l'usuari

      if (user && token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/concerts/${concertId}/user-count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.count !== undefined) {
              setPurchasedCount(data.count);
            }
          })
          .catch(err => console.error("Error carregant comptador d'entrades:", err));
      }
    }

    // Gestió de navegació ja realitzada pel Navbar (global)
    // S'evita neteja aquí per permetre el pas a /checkout
    return () => { };
  }, [concertId, user, token, setConcertId, setPurchasedCount]);



  // Sincronització amb WebSockets
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join:concert', concertId);

    // Carregar estat inicial real (ara estructurat per zona)
    socket.on('seat:initial_state', (allSeatStatuses: Record<string, Record<string, string>>) => {
      const zoneStatuses = allSeatStatuses[zoneId] || {};
      Object.entries(zoneStatuses).forEach(([seatId, value]) => {
        // value pot ser 'available', 'sold' o el 'userId' de qui ho té
        let seatStatus: 'available' | 'reserved' | 'mine' | 'sold' = 'available';

        if (value === 'sold') {
          seatStatus = 'sold';
        } else if (value && value !== 'available') {
          seatStatus = (String(value) === String(user?.id)) ? 'mine' : 'reserved';
        }

        if (seatStatus !== 'available') {
          updateSeatStatus(seatId, seatStatus, user?.id ? String(user.id) : undefined, String(value));
        }
      });
    });

    // Escoltat actualitzacions individuals
    const handleUpdate = ({ zoneId: updateZoneId, seatId, status, userId: reservedByUserId }: { zoneId: string, seatId: string, status: string, userId?: string }) => {
      // Només actualitzem si és la nostra zona
      if (updateZoneId === zoneId) {
        updateSeatStatus(seatId, status as any, user?.id ? String(user.id) : undefined, reservedByUserId);
      }
    };

    socket.on('seat:update', handleUpdate);

    return () => {
      socket.off('seat:initial_state');
      socket.off('seat:update', handleUpdate);
    };
  }, [concertId, zoneId, user?.id, updateSeatStatus]);

  // Generar butaques quan canvia la zona
  useEffect(() => {
    if (!layout.isStanding) {
      const generated = generateSeatsFromLayout(layout.rows, basePrice, zoneId);
      clearSelection();
      setSeats(generated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);

  const handleSeatClick = (seat: SeatType) => {
    // Intentar bloquejar al servidor
    socket.emit('seat:toggle', {
      concertId,
      zoneId, // Enviem la zona per evitar collisions
      seatId: seat.id,
      userId: user?.id ? String(user.id) : 'anonymous'
    });

    // Optimistic toggle local
    toggleSeatSelection(seat);
  };

  // Agrupar seients per files (mantenint ordre d'inserció)
  const seatsByRow = useMemo(() => {
    const map: Record<string, SeatType[]> = {};
    seats.forEach((seat) => {
      if (!map[seat.row]) map[seat.row] = [];
      map[seat.row].push(seat);
    });
    return map;
  }, [seats]);

  const rowOrder = useMemo(() => layout.rows.map((r) => r.label), [layout.rows]);
  const indentMap = useMemo(() => {
    const m: Record<string, number> = {};
    layout.rows.forEach((r) => (m[r.label] = r.indent ?? 0));
    return m;
  }, [layout.rows]);

  // Càlculs
  const selectedSeatsInfo = selectedSeats;
  const totalPrice = selectedSeatsInfo.reduce((sum, seat) => sum + seat.price, 0);
  const pmrCount = selectedSeatsInfo.filter((s) => s.isPMR).length;

  // ═══════════════════════════════════════
  // ZONA DRETA (STANDING) — Pista / Front Stage
  // ═══════════════════════════════════════
  if (layout.isStanding) {
    return (
      <StandingZoneView
        zoneId={zoneId}
        zoneName={zoneName}
        sectionLabel={layout.sectionLabel}
        basePrice={basePrice}
        onBack={onBack}
        router={router}
      />
    );
  }

  // ═══════════════════════════════════════
  // ZONA AMB BUTAQUES — Grades
  // ═══════════════════════════════════════
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (selectedSeats.length > 0) {
              socket.emit('seat:release_all', { concertId });
              clearSelection();
            }
            onBack();
          }}
          className="flex items-center gap-2 text-cyan hover:text-white transition-colors group text-sm"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Tornar al mapa de zones</span>
        </button>
      </div>


      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan to-white">
          {zoneName}
        </h2>
        <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-[0.2em] font-mono">{layout.sectionLabel}</p>
        <p className="text-gray-400 text-sm mt-2">Selecciona les teves butaques — màxim 5</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* MAPA DE BUTAQUES */}
        <div className="flex-1 bg-surface p-3 md:p-6 rounded-2xl border border-cyan/20 shadow-[0_0_30px_rgba(0,240,255,0.05)]">

          {/* Escenari */}
          <div className="relative mx-auto mb-8" style={{ maxWidth: "60%" }}>
            <div className="w-full h-10 md:h-12 bg-gradient-to-b from-magenta/30 to-magenta/5 border-b-4 border-magenta rounded-t-[2rem] flex items-center justify-center shadow-[0_8px_25px_rgba(255,0,160,0.15)]">
              <span className="text-magenta font-bold tracking-[0.3em] uppercase text-xs md:text-sm">🎤 Escenari</span>
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-magenta/10 blur-xl rounded-full" />
          </div>

          {/* Info de numeració */}
          <div className="flex justify-center gap-8 mb-4 text-[9px] text-gray-500 font-mono">
            <span>← Senars (1, 3, 5...)</span>
            <span className="text-cyan/40">│ Passadís │</span>
            <span>Parells (2, 4, 6...) →</span>
          </div>

          {/* Graella de seients - Container amb scroll horizontal */}
          <div className="w-full overflow-x-auto rounded-lg border border-white/5 bg-black/30 p-4">
            <div className="flex flex-col gap-2 md:gap-2.5 items-center pt-2 pb-4 min-w-max">
              {rowOrder.map((rowLabel) => {
                const rowSeats = seatsByRow[rowLabel];
                if (!rowSeats) return null;
                const indent = indentMap[rowLabel] || 0;
                const isPMRRow = rowLabel === "WC";

                return (
                  <div
                    key={rowLabel}
                    className={`flex items-center gap-0.5 md:gap-1 ${isPMRRow ? "mt-3 pt-3 border-t border-dashed border-cyan/20" : ""}`}
                    style={{ paddingLeft: `${indent * 10}px`, paddingRight: `${indent * 10}px` }}
                  >
                    <span className={`font-mono font-bold w-8 text-right text-[9px] pr-1 shrink-0 select-none ${isPMRRow ? "text-cyan/80" : "text-cyan/40"}`}>
                      {isPMRRow ? "♿" : `F${rowLabel}`}
                    </span>

                    <div className="flex gap-1 md:gap-1.5">
                      {rowSeats.map((seat) => (
                        <Seat key={seat.id} seat={seat} onClick={() => handleSeatClick(seat)} />
                      ))}
                    </div>

                    <span className={`font-mono font-bold w-8 text-left text-[9px] pl-1 shrink-0 select-none ${isPMRRow ? "text-cyan/80" : "text-cyan/40"}`}>
                      {isPMRRow ? "♿" : `F${rowLabel}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Llegenda */}
          <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap justify-center gap-4 md:gap-5 text-[10px] md:text-xs text-gray-300">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-green-500 rounded-sm shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
              <span>Libre</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-blue-500 rounded-sm shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
              <span>Seleccionat</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-yellow-500 rounded-sm shadow-[0_0_6px_rgba(234,179,8,0.5)]" />
              <span>Ocupat / Comprant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-red-600 rounded-sm" />
              <span>Venut</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3.5 bg-green-500 rounded border border-green-400 flex items-center justify-center">
                <span className="text-[8px]">♿</span>
              </div>
              <span>PMR</span>
            </div>
          </div>
        </div>

        {/* SIDEBAR DE COMPRA */}
        <div className="w-full xl:w-80 flex flex-col gap-4 shrink-0">
          <div className="bg-surface p-5 md:p-6 rounded-2xl border border-cyan/20 shadow-[0_0_30px_rgba(0,240,255,0.05)] sticky top-24">
            <h3 className="text-lg font-bold mb-4 text-white border-b border-white/10 pb-3">Selecció Actual</h3>

            {selectedSeats.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 mx-auto mb-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="text-gray-400 text-sm">Fes clic a una butaca per seleccionar-la.</p>
              </div>
            ) : (
              <>
                <div className="bg-background rounded-lg p-3 border border-cyan/20 mb-4">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">Zona</span>
                  <p className="text-sm font-bold text-cyan uppercase tracking-wider">{zoneName}</p>
                </div>

                <div className="flex flex-col gap-1.5 mb-5 max-h-[220px] overflow-y-auto pr-1">
                  {selectedSeatsInfo.map((seat) => (
                    <div key={seat.id} className="flex justify-between items-center bg-background p-2 rounded-lg border border-blue-500/20 hover:border-blue-500/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${seat.isPMR ? "bg-cyan" : "bg-blue-500"} shadow-[0_0_4px_rgba(59,130,246,0.8)]`} />
                        <span className="font-medium text-blue-400 text-xs">
                          {seat.isPMR ? "♿ PMR" : `Fila ${seat.row} · Seient ${seat.col}`}
                        </span>
                      </div>
                      <span className="text-white font-semibold text-xs">{seat.price}€</span>
                    </div>
                  ))}
                </div>

                {pmrCount > 0 && (
                  <div className="flex items-center gap-2 p-2.5 bg-cyan/5 border border-cyan/20 rounded-lg mb-4">
                    <span className="text-lg">♿</span>
                    <p className="text-[10px] text-cyan/80 leading-tight">
                      {pmrCount} plaça{pmrCount !== 1 ? "ces" : ""} PMR. Accés adaptat garantit.
                    </p>
                  </div>
                )}

                <div className="border-t border-white/10 pt-3 mb-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-gray-400 text-xs">Total</span>
                      <span className="block text-[10px] text-gray-500">{selectedSeats.length} butaque{selectedSeats.length !== 1 ? "s" : ""}</span>
                    </div>
                    <span className="text-2xl font-extrabold text-cyan">{totalPrice}€</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={() => {
                    setProceedingToCheckout(true);
                    // Asegurar que el concertId esté guardado al navegar a checkout
                    if (!concertId) {
                      console.warn("ConcertId not set before going to checkout");
                    }
                  }}
                  className="block w-full text-center py-3 bg-gradient-to-r from-cyan to-cyan/80 text-background font-bold uppercase tracking-widest rounded-xl text-sm transition-all hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] hover:-translate-y-0.5 active:scale-95"
                >
                  Continuar al Pagament →
                </Link>
              </>
            )}

            {(selectedSeats.length + purchasedCount) >= 5 && (
              <div className="mt-3 flex flex-col gap-2 p-3 bg-magenta/10 border border-magenta/30 rounded-lg animate-pulse shadow-[0_0_15px_rgba(255,0,160,0.1)]">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-magenta shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-xs text-magenta font-black uppercase tracking-tighter">Límit assolit</p>
                </div>
                <p className="text-[10px] text-white/60 leading-tight">
                  Has arribat al màxim de 5 entrades per concert. {purchasedCount > 0 ? `Ja en tens ${purchasedCount} de confirmades i n'has seleccionat ${selectedSeats.length}.` : "Has seleccionat el límit permès."}
                </p>
              </div>
            )}

            {purchasedCount > 0 && (selectedSeats.length + purchasedCount) < 5 && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Entrades confirmades: {purchasedCount}</p>
                </div>
                <p className="text-[9px] text-white/40 italic">
                  Pots afegir fins a {5 - purchasedCount - selectedSeats.length} entrada{5 - purchasedCount - selectedSeats.length !== 1 ? "s" : ""} més a la teva comanda.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// COMPONENT ZONA DRETA (STANDING) — Pista / Front Stage
// ═══════════════════════════════════════════════════════
function StandingZoneView({
  zoneId,
  zoneName,
  sectionLabel,
  basePrice,
  onBack,
  router
}: {
  zoneId: string;
  zoneName: string;
  sectionLabel: string;
  basePrice: number;
  onBack: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const {
    selectedSeats,
    toggleSeatSelection,
    purchasedCount,
    setProceedingToCheckout,
    clearSelection,
    concertId
  } = useTicketStore();
  const { user } = useAuthStore();

  const currentCount = selectedSeats.length;
  const totalPrice = basePrice * currentCount;
  const maxAllowed = 5 - purchasedCount;

  const handleAdjustCount = (newCount: number) => {
    if (newCount < 0 || newCount > maxAllowed) return;

    if (newCount > currentCount) {
      // Afegir seients virtuals
      for (let i = currentCount; i < newCount; i++) {
        const virtualSeat: SeatType = {
          id: `V-${zoneId}-${i + 1}-${Date.now()}`, // ID únic temporal
          row: zoneName,
          col: i + 1,
          zoneId: zoneId,
          status: 'available',
          price: basePrice
        };

        socket.emit('seat:toggle', {
          concertId,
          zoneId,
          seatId: virtualSeat.id,
          userId: user?.id ? String(user.id) : 'anonymous'
        });
        toggleSeatSelection(virtualSeat);
      }
    } else if (newCount < currentCount) {
      // Treure seients virtuals (els últims afegits)
      const toRemove = selectedSeats.slice(newCount);
      toRemove.forEach(seat => {
        socket.emit('seat:toggle', {
          concertId,
          zoneId,
          seatId: seat.id,
          userId: user?.id ? String(user.id) : 'anonymous'
        });
        toggleSeatSelection(seat);
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (selectedSeats.length > 0) {
              socket.emit('seat:release_all', { concertId: concertId });
              clearSelection();
            }
            onBack();
          }}
          className="flex items-center gap-2 text-cyan hover:text-white transition-colors group text-sm"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Tornar al mapa de zones</span>
        </button>
      </div>

      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan to-white">
          {zoneName}
        </h2>
        <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-[0.2em] font-mono">{sectionLabel}</p>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="bg-surface p-6 md:p-8 rounded-2xl border border-cyan/20 shadow-[0_0_30px_rgba(0,240,255,0.05)]">

          {/* Indicador visual de zona dreta */}
          <div className="w-full aspect-[16/9] rounded-xl bg-gradient-to-b from-magenta/10 via-cyan/5 to-background border border-white/5 mb-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="absolute w-1 h-1 bg-cyan rounded-full animate-pulse" style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                  animationDelay: `${Math.random() * 3}s`,
                }} />
              ))}
            </div>
            <svg className="w-16 h-16 text-cyan/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-cyan/60 font-bold text-lg uppercase tracking-widest">Entrada Standing</p>
            <p className="text-gray-500 text-xs mt-1">Sense seients numerats · Zona de pista</p>
          </div>

          {/* Preu */}
          <div className="bg-background rounded-xl p-4 border border-cyan/20 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Preu unitari</span>
              <span className="text-cyan text-xl font-bold">{basePrice}€</span>
            </div>
          </div>

          {/* Quantitat */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 font-medium mb-2">Quantitat d&apos;entrades</label>
            <div className="flex items-center gap-4 bg-background border border-white/10 rounded-lg p-2">
              <button
                onClick={() => handleAdjustCount(currentCount - 1)}
                className="w-12 h-12 rounded-md bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors disabled:opacity-20"
                disabled={currentCount <= 0}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="flex-1 text-center font-bold text-2xl">{currentCount}</span>
              <button
                onClick={() => handleAdjustCount(currentCount + 1)}
                className="w-12 h-12 rounded-md bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors disabled:opacity-20"
                disabled={currentCount >= maxAllowed}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-3 text-center uppercase tracking-widest font-mono">
              Límit: 5 entrades per concert {purchasedCount > 0 && `(ja en tens ${purchasedCount})`}
            </p>
          </div>

          {/* Total */}
          <div className="border-t border-white/10 pt-4 mb-6">
            <div className="flex justify-between items-end">
              <span className="text-gray-400 font-medium">Total a pagar</span>
              <span className="text-3xl font-extrabold text-cyan">{totalPrice}€</span>
            </div>
          </div>

          {/* Botó */}
          <button
            onClick={() => {
              if (currentCount > 0) {
                setProceedingToCheckout(true);
                router.push('/checkout');
              }
            }}
            disabled={currentCount === 0}
            className="block w-full text-center py-4 bg-gradient-to-r from-cyan to-cyan/80 text-background font-bold uppercase tracking-widest rounded-xl transition-all hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            Continuar al Pagament →
          </button>
        </div>
      </div>
    </div>
  );
}


