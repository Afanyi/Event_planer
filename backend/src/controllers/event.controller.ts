import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { EventService } from '../services/event.service';
import { geocodeLocation, getForecastSummary } from '../services/weather.service';

function buildLocationFromParts(parts: {
    street?: string; houseNumber?: string; postalCode?: string; city?: string;
}) {
    const street = (parts.street ?? '').trim();
    const house = (parts.houseNumber ?? '').trim();
    const plz = (parts.postalCode ?? '').trim();
    const city = (parts.city ?? '').trim();
    if (!street || !house || !plz || !city) return null;
    return `${street} ${house}, ${plz} ${city}`.replace(/\s+/g, ' ').trim();
}

export const EventController = {
    list: asyncHandler(async (req: Request, res: Response) => {
        const { q, from, to, location, participant, tag, tags } = req.query as any;
        res.json(await EventService.list({ q, from, to, location, participant, tag, tags }));
    }),

    get: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.get(req.params.id))
    ),

    create: asyncHandler(async (req: Request, res: Response) => {
        const { street, houseNumber, postalCode, city } = req.body || {};
        let { location } = req.body || {};

        // 4 Felder → Location-String
        if (!location) {
            const combined = buildLocationFromParts({ street, houseNumber, postalCode, city });
            if (combined) location = combined;
        }

        if (!req.body?.title || !req.body?.date || !location) {
            return res.status(400).json({
                error: 'title, date und vollständige Adresse (street, houseNumber, postalCode, city) sind erforderlich.'
            });
        }

        // Geocoding beim Erstellen (best effort) – mit ZIP/City-Fallback
        try {
            const geo = await geocodeLocation(location, postalCode, city);
            if (geo) {
                req.body.lat = geo.lat;
                req.body.lon = geo.lon;
            }
        } catch { /* ignore geocode failure at creation time */ }

        req.body.location = location;

        res.status(201).json(await EventService.create(req.body));
    }),

    update: asyncHandler(async (req: Request, res: Response) => {
        const { street, houseNumber, postalCode, city } = req.body || {};
        let { location } = req.body || {};

        // Optional auch beim Update via 4 Felder
        if (!location && (street || houseNumber || postalCode || city)) {
            const combined = buildLocationFromParts({ street, houseNumber, postalCode, city });
            if (combined) {
                req.body.location = combined;
                // Koordinaten aktualisieren (best effort) – mit ZIP/City-Fallback
                try {
                    const geo = await geocodeLocation(combined, postalCode, city);
                    if (geo) { req.body.lat = geo.lat; req.body.lon = geo.lon; }
                } catch { /* ignore */ }
            }
        }

        res.json(await EventService.update(req.params.id, req.body));
    }),

    remove: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.remove(req.params.id))
    ),

    byTag: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.list({ tag: req.params.tagId }))
    ),

    byParticipant: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.list({ participant: req.params.participantId }))
    ),

    addTag: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.addTag(req.params.id, req.params.tagId))
    ),

    removeTag: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.removeTag(req.params.id, req.params.tagId))
    ),

    addParticipant: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.addParticipant(req.params.id, req.params.participantId))
    ),

    removeParticipant: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.removeParticipant(req.params.id, req.params.participantId))
    ),

    // 🎨 Freestyle Feature: Wetter (robust mit ZIP/City-Fallback & kein 400 mehr bei Geocoding-Miss)
    weather: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id;
        const dateQ = (req.query.date as string) || undefined;

        const ev: any = await EventService.get(id);
        if (!ev) return res.status(404).json({ error: 'Event not found' });

        const dateISO = ((dateQ ?? ev.date) as string).slice(0, 10);

        let { lat, lon } = ev;

        // Falls keine Koordinaten vorhanden → geokodieren (mit Fallbacks)
        if (lat == null || lon == null) {
            let locStr: string = (ev.location ?? '').trim();

            if (!locStr) {
                const combined = buildLocationFromParts({
                    street: ev.street,
                    houseNumber: ev.houseNumber,
                    postalCode: ev.postalCode,
                    city: ev.city
                });
                if (combined) locStr = combined;
            }

            const zip = (ev.postalCode ?? '').trim() || undefined;
            const cty = (ev.city ?? '').trim() || undefined;

            const geo = await geocodeLocation(locStr || [zip, cty].filter(Boolean).join(' '), zip, cty);

            if (!geo) {
                // Graceful: kein 400, sondern 200 mit available:false → UI zeigt "Keine Prognose"
                return res.json({
                    eventId: id,
                    available: false,
                    note: 'No forecast: address could not be geocoded (used ZIP+City fallback).'
                });
            }

            lat = geo.lat; lon = geo.lon;

            // Best effort: lat/lon speichern
            try { await EventService.update(id, { lat, lon }); } catch { /* ignore */ }
        }

        const summary = await getForecastSummary(lat, lon, dateISO);
        return res.json({ eventId: id, lat, lon, ...summary });
    }),
};
