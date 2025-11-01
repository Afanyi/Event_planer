import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { EventService } from '../services/event.service';
import { geocodeLocation, getForecastSummary } from '../services/weather.service';

/**
 * Helper: Builds a full location string from separate address parts.
 * Example: {street: "Main St", houseNumber: "12", postalCode: "12345", city: "Berlin"}
 * → "Main St 12, 12345 Berlin"
 */
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

    /**
     * GET /events
     * Returns a list of events matching the query parameters.
     * Supports filters like q, date range, location, participant, and tags.
     */
    list: asyncHandler(async (req: Request, res: Response) => {
        const { q, from, to, location, participant, tag, tags } = req.query as any;
        res.json(await EventService.list({ q, from, to, location, participant, tag, tags }));
    }),

    /**
     * GET /events/:id
     * Returns a single event by its ID.
     */
    get: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.get(req.params.id))
    ),

    /**
     * POST /events
     * Creates a new event.
     * Requires title, date, and full address (street, houseNumber, postalCode, city).
     * Automatically performs geocoding (lat/lon lookup).
     */
    create: asyncHandler(async (req: Request, res: Response) => {
        const { street, houseNumber, postalCode, city } = req.body || {};
        let { location } = req.body || {};

        // If no full "location" string is provided, try to build one from the 4 address fields
        if (!location) {
            const combined = buildLocationFromParts({ street, houseNumber, postalCode, city });
            if (combined) location = combined;
        }

        // Basic validation
        if (!req.body?.title || !req.body?.date || !location) {
            return res.status(400).json({
                error: 'title, date and a complete address (street, houseNumber, postalCode, city) are required.'
            });
        }

        // Try to geocode the address (best effort, fallback to ZIP + city)
        try {
            const geo = await geocodeLocation(location, postalCode, city);
            if (geo) {
                req.body.lat = geo.lat;
                req.body.lon = geo.lon;
            }
        } catch { /* Ignore geocoding failures during creation */ }

        req.body.location = location;

        // Create the event in the database
        res.status(201).json(await EventService.create(req.body));
    }),

    /**
     * PUT /events/:id
     * Updates an existing event.
     * If address fields are provided, it rebuilds location and updates lat/lon automatically.
     */
    update: asyncHandler(async (req: Request, res: Response) => {
        const { street, houseNumber, postalCode, city } = req.body || {};
        let { location } = req.body || {};

        // If any address field is changed, rebuild full location and update coordinates
        if (!location && (street || houseNumber || postalCode || city)) {
            const combined = buildLocationFromParts({ street, houseNumber, postalCode, city });
            if (combined) {
                req.body.location = combined;
                try {
                    const geo = await geocodeLocation(combined, postalCode, city);
                    if (geo) { req.body.lat = geo.lat; req.body.lon = geo.lon; }
                } catch { /* Ignore if geocoding fails */ }
            }
        }

        // Update event in DB
        res.json(await EventService.update(req.params.id, req.body));
    }),

    /**
     * DELETE /events/:id
     * Removes an event by its ID.
     */
    remove: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.remove(req.params.id))
    ),

    /**
     * DELETE /events
     * Bulk delete: remove many events in one request.
     * Body: { ids: string[] }
     * Response: { deletedCount, invalidIds, missingIds }
     */
    bulkRemove: asyncHandler(async (req: Request, res: Response) => {
        const ids = req.body?.ids;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'Body must be { ids: string[] }' });
        }
        if (ids.length === 0) {
            return res.status(400).json({ error: 'ids must not be empty' });
        }
        const result = await EventService.bulkRemove(ids);
        return res.status(200).json(result);
    }),

    /**
     * GET /tags/:tagId/events
     * Returns all events associated with a specific tag.
     */
    byTag: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.list({ tag: req.params.tagId }))
    ),

    /**
     * GET /participants/:participantId/events
     * Returns all events that a specific participant is part of.
     */
    byParticipant: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.list({ participant: req.params.participantId }))
    ),

    /**
     * POST /events/:id/tags/:tagId
     * Adds a tag to an event.
     */
    addTag: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.addTag(req.params.id, req.params.tagId))
    ),

    /**
     * DELETE /events/:id/tags/:tagId
     * Removes a tag from an event.
     */
    removeTag: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.removeTag(req.params.id, req.params.tagId))
    ),

    /**
     * POST /events/:id/participants/:participantId
     * Adds a participant to an event.
     */
    addParticipant: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.addParticipant(req.params.id, req.params.participantId))
    ),

    /**
     * DELETE /events/:id/participants/:participantId
     * Removes a participant from an event.
     */
    removeParticipant: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.removeParticipant(req.params.id, req.params.participantId))
    ),

    /**
     * GET /events/:id/weather
     * Freestyle Feature ☀️
     * Returns a weather forecast summary for the event’s location and date.
     * - If lat/lon are missing, tries to geocode the address or ZIP+City fallback.
     * - If still unavailable → returns available:false (no error).
     */
    weather: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id;
        const dateQ = (req.query.date as string) || undefined;

        // Load the event
        const ev: any = await EventService.get(id);
        if (!ev) return res.status(404).json({ error: 'Event not found' });

        // Use provided date or event date (YYYY-MM-DD)
        const dateISO = ((dateQ ?? ev.date) as string).slice(0, 10);

        let { lat, lon } = ev;

        // If event has no coordinates, try geocoding
        if (lat == null || lon == null) {
            let locStr: string = (ev.location ?? '').trim();

            // Try building location if missing
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
                // Graceful fallback: return success with available=false instead of error
                return res.json({
                    eventId: id,
                    available: false,
                    note: 'No forecast: address could not be geocoded (used ZIP+City fallback).'
                });
            }

            lat = geo.lat; lon = geo.lon;

            // Try saving coordinates for future requests (non-blocking)
            try { await EventService.update(id, { lat, lon }); } catch { /* ignore */ }
        }

        // Fetch and return weather forecast summary
        const summary = await getForecastSummary(lat, lon, dateISO);
        return res.json({ eventId: id, lat, lon, ...summary });
    }),
};
