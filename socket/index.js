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

// Recintes amb els seus venueIds reals de Ticketmaster
const TARGET_VENUES = [
    { name: 'Palau Sant Jordi',  ids: ['Z598xZ2qZe6d7'] },
    { name: 'Sant Jordi Club',   ids: ['Z198xZ2qZ1e1'] },
    { name: 'Razzmatazz',        ids: ['Z198xZ2qZkeF', 'Z198xZ2qZd6k', 'Z198xZ2qZ771', 'Z598xZ2qZdvF1'] },
];

// Tots els venueIds en un sol array per a referència ràpida
const ALL_VENUE_IDS = TARGET_VENUES.flatMap(v => v.ids);

// Cache persistent d'esdeveniments
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

/**
 * Determina el nom normalitzat del recinte (Palau Sant Jordi / Sant Jordi Club / Razzmatazz)
 */
function getVenueLabel(venueName) {
    if (!venueName) return 'Recinte desconegut';
    const lower = venueName.toLowerCase();
    // Ordre important: "sant jordi club" abans de "sant jordi" per no confondre
    if (lower.includes('sant jordi club')) return 'Sant Jordi Club';
    if (lower.includes('palau sant jordi')) return 'Palau Sant Jordi';
    if (lower.includes('razzmatazz') || lower.includes('razz')) return 'Razzmatazz';
    return venueName; // fallback
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
        venueGroup: getVenueLabel(venueName),
        imageUrl: getBestImage(raw.images),
        salesStatus: raw.dates?.status?.code || 'unknown',
        priceMin: priceRanges?.[0]?.min ?? null,
        priceMax: priceRanges?.[0]?.max ?? null,
        ticketUrl: raw.url || '#',
        isHighlightedVenue: true, // Tots són de recintes destacats
        genre: raw.classifications?.[0]?.genre?.name || null,
        segment: raw.classifications?.[0]?.segment?.name || null,
    };
}

function filterPastEvents(events) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events.filter(event => {
        if (!event.dateTime) return true;
        const eventDate = new Date(event.dateTime);
        return eventDate >= now;
    });
}

function mergeEvents(cached, fresh) {
    const mergedMap = new Map();

    for (const event of cached) {
        mergedMap.set(event.id, event);
    }
    for (const event of fresh) {
        mergedMap.set(event.id, event);
    }

    const merged = filterPastEvents(Array.from(mergedMap.values()));

    merged.sort((a, b) => {
        if (!a.dateTime) return 1;
        if (!b.dateTime) return -1;
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    });

    return merged;
}

// ─── Fetch per Venue ────────────────────────────────────────

/**
 * Fa un fetch per un venueId concret. Retorna els events mappejats.
 */
async function fetchEventsForVenue(venueId) {
    const params = new URLSearchParams({
        apikey: TM_API_KEY,
        venueId: venueId,
        size: '200',  // Màxim permès per l'API
        sort: 'date,asc',
    });

    const url = `${TM_BASE_URL}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} per venue ${venueId}`);
    }

    const data = await response.json();
    const rawEvents = data._embedded?.events || [];
    return rawEvents.map(mapEvent);
}

/**
 * Fa fetch de TOTS els events dels 3 recintes.
 * Fa les peticions seqüencialment amb un petit delay per evitar rate limiting.
 */
async function fetchAllVenueEvents() {
    try {
        console.log(`[Ticketmaster] Polling tots els recintes… ${new Date().toISOString()}`);

        const allEvents = [];

        for (const venue of TARGET_VENUES) {
            for (const venueId of venue.ids) {
                try {
                    const events = await fetchEventsForVenue(venueId);
                    allEvents.push(...events);
                    console.log(`  → ${venue.name} (${venueId}): ${events.length} events`);
                } catch (err) {
                    console.error(`  ✗ ${venue.name} (${venueId}): ${err.message}`);
                }
                // Petit delay entre peticions per evitar rate limit (100 req/min)
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        // Deduplicar per id (un event pot aparèixer en múltiples sales Razzmatazz)
        const uniqueMap = new Map(allEvents.map(e => [e.id, e]));
        const unique = Array.from(uniqueMap.values());

        lastError = null;
        console.log(`[Ticketmaster] ✅ Total: ${unique.length} esdeveniments únics als recintes clau`);
        return unique;
    } catch (err) {
        const errorMsg = `Error general: ${err.message}`;
        console.error(`[Ticketmaster] ❌ ${errorMsg}`);
        lastError = errorMsg;
        return null;
    }
}

async function pollAndEmit() {
    const freshEvents = await fetchAllVenueEvents();

    if (freshEvents !== null) {
        cachedEvents = mergeEvents(cachedEvents, freshEvents);
    } else {
        cachedEvents = filterPastEvents(cachedEvents);
    }

    lastFetchTime = new Date().toISOString();

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
    console.log(`Recintes monitoritzats: ${TARGET_VENUES.map(v => v.name).join(', ')}`);
    console.log(`Polling cada ${POLL_INTERVAL_MS / 1000}s (~${Math.round(ALL_VENUE_IDS.length * 24 * 60 / (POLL_INTERVAL_MS / 60000))} req/dia)`);

    await pollAndEmit();
    setInterval(pollAndEmit, POLL_INTERVAL_MS);
});