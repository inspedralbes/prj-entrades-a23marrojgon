// socket/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// ─── Ticketmaster Config ────────────────────────────────────
const TM_API_KEY = 'lFJAG9ubY1mX21DlDpzmfL5ZORyKksyq';
const TM_BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minuts (~288 req/dia)

// Recintes destacats de Barcelona
const HIGHLIGHTED_VENUES = [
    'palau sant jordi',
    'sant jordi club',
    'razzmatazz',
];

// Cache persistent d'esdeveniments — NO s'esborren fins que passi la data
let cachedEvents = [];
let lastFetchTime = null;
let lastError = null;

// ─── Mapping de dades ───────────────────────────────────────

function getBestImage(images) {
    if (!images || images.length === 0) return '';
    const ratio16_9 = images
        .filter(img => img.ratio === '16_9')
        .sort((a, b) => (b.width || 0) - (a.width || 0));
    if (ratio16_9.length > 0) return ratio16_9[0].url;
    const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
    return sorted[0].url;
}

function isHighlighted(venueName) {
    if (!venueName) return false;
    const lower = venueName.toLowerCase();
    return HIGHLIGHTED_VENUES.some(hv => lower.includes(hv));
}

function mapEvent(raw) {
    const venue = raw._embedded?.venues?.[0];
    const venueName = venue?.name || 'Recinte desconegut';
    const priceRanges = raw.priceRanges;

    return {
        id: raw.id,
        name: raw.name,
        dateTime: raw.dates?.start?.localDate
            ? `${raw.dates.start.localDate}T${raw.dates.start.localTime || '00:00:00'}`
            : null,
        venue: venueName,
        imageUrl: getBestImage(raw.images),
        salesStatus: raw.dates?.status?.code || 'unknown',
        priceMin: priceRanges?.[0]?.min ?? null,
        priceMax: priceRanges?.[0]?.max ?? null,
        ticketUrl: raw.url || '#',
        isHighlightedVenue: isHighlighted(venueName),
        // Guardem la classificació per mostrar-la
        genre: raw.classifications?.[0]?.genre?.name || null,
        segment: raw.classifications?.[0]?.segment?.name || null,
    };
}

/**
 * Filtra esdeveniments que ja han passat (data anterior a avui).
 * Els esdeveniments sense data es mantenen.
 */
function filterPastEvents(events) {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Inici del dia actual
    return events.filter(event => {
        if (!event.dateTime) return true; // Sense data → mantenir
        const eventDate = new Date(event.dateTime);
        return eventDate >= now; // Mantenir si la data és avui o futura
    });
}

/**
 * Fusiona nous esdeveniments amb els cacheats.
 * - Afegeix nous events que no existien
 * - Actualitza events existents (estat de venda, preus, etc.)
 * - Manté events antics que encara no han passat
 */
function mergeEvents(cached, fresh) {
    const freshMap = new Map(fresh.map(e => [e.id, e]));
    const mergedMap = new Map();

    // Primer: afegir tots els events cacheats (els que no hagin passat)
    for (const event of cached) {
        mergedMap.set(event.id, event);
    }

    // Segon: actualitzar/afegir amb els fresh
    for (const event of fresh) {
        mergedMap.set(event.id, event); // Sobreescriu amb dades actualitzades
    }

    // Filtrar els que ja han passat
    const merged = filterPastEvents(Array.from(mergedMap.values()));

    // Ordenar per data ascendent
    merged.sort((a, b) => {
        if (!a.dateTime) return 1;
        if (!b.dateTime) return -1;
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    });

    return merged;
}

// ─── Fetch de Ticketmaster ──────────────────────────────────

async function fetchTicketmasterEvents() {
    try {
        // Buscar TOTS els esdeveniments a Barcelona (sense filtrar per classificació)
        const params = new URLSearchParams({
            apikey: TM_API_KEY,
            city: 'Barcelona',
            countryCode: 'ES',
            size: '100',        // Màxim: 200, però 100 és raonable
            sort: 'date,asc',
        });

        const url = `${TM_BASE_URL}?${params.toString()}`;
        console.log(`[Ticketmaster] Polling… ${new Date().toISOString()}`);

        const response = await fetch(url);

        if (response.status === 401) {
            const errorMsg = 'API Key no autoritzada (401). Comprova que la clau estigui activada al portal de Ticketmaster.';
            console.error(`[Ticketmaster] ❌ ${errorMsg}`);
            lastError = errorMsg;
            return null;
        }

        if (response.status === 429) {
            console.error('[Ticketmaster] ⚠️ Rate limit assolit. Esperant al pròxim cicle.');
            lastError = 'Rate limit assolit. Reintentant en 5 minuts.';
            return null;
        }

        if (!response.ok) {
            const errorMsg = `HTTP Error: ${response.status} ${response.statusText}`;
            console.error(`[Ticketmaster] ❌ ${errorMsg}`);
            lastError = errorMsg;
            return null;
        }

        const data = await response.json();
        const rawEvents = data._embedded?.events || [];
        const mapped = rawEvents.map(mapEvent);

        lastError = null; // Resetejar error si tot va bé
        console.log(`[Ticketmaster] ✅ ${mapped.length} esdeveniments trobats`);
        return mapped;
    } catch (err) {
        const errorMsg = `Error de xarxa: ${err.message}`;
        console.error(`[Ticketmaster] ❌ ${errorMsg}`);
        lastError = errorMsg;
        return null;
    }
}

async function pollAndEmit() {
    const freshEvents = await fetchTicketmasterEvents();

    if (freshEvents !== null) {
        // Fusionar amb cache (manté events antics que no han passat)
        cachedEvents = mergeEvents(cachedEvents, freshEvents);
    } else {
        // Encara sense dades noves, filtrar events passats del cache existent
        cachedEvents = filterPastEvents(cachedEvents);
    }

    lastFetchTime = new Date().toISOString();

    // Emetre a tots els clients de la room 'concerts'
    io.to('concerts').emit('ticketmaster:events', {
        events: cachedEvents,
        lastUpdated: lastFetchTime,
        error: lastError,
        totalEvents: cachedEvents.length,
    });
}

// ─── Socket.IO Connexions ───────────────────────────────────

io.on('connection', (socket) => {
    console.log(`Un usuari s'ha connectat al WebSocket (${socket.id})`);

    socket.on('join:concerts', () => {
        socket.join('concerts');
        console.log(`[${socket.id}] s'ha unit a la room 'concerts'`);

        // Enviar dades cacheades + estat d'error immediatament
        socket.emit('ticketmaster:events', {
            events: cachedEvents,
            lastUpdated: lastFetchTime,
            error: lastError,
            totalEvents: cachedEvents.length,
        });
    });

    socket.on('leave:concerts', () => {
        socket.leave('concerts');
    });

    socket.on('disconnect', () => {
        console.log(`Usuari desconnectat (${socket.id})`);
    });
});

// ─── Arrencada del Servidor ─────────────────────────────────

const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
    console.log(`Servidor de Sockets actiu al port ${PORT} 🚀`);
    console.log(`Ticketmaster polling cada ${POLL_INTERVAL_MS / 1000}s`);

    // Primer fetch immediat
    await pollAndEmit();

    // Polling periòdic
    setInterval(pollAndEmit, POLL_INTERVAL_MS);
});