// backend/src/services/event.service.ts
import { Types } from 'mongoose';
import { Event } from '../models/Event';
import { Tag } from '../models/Tag';
import { Participant } from '../models/Participant';
import { AppError } from '../utils/errors';

/**
 * Query type definition
 * ---------------------
 * Represents the optional query parameters used for filtering event searches.
 */
export type Query = {
    q?: string;                 // Text search query (matches title/description)
    from?: string;              // Start date filter
    to?: string;                // End date filter
    location?: string;          // Partial location match
    participant?: string;       // Participant ID or name/email
    tag?: string;               // Single tag ID
    tags?: string | string[];   // Multiple tag names (comma-separated or array)
};

/**
 * Helper: Converts a string or Date into a proper Date object.
 * Returns undefined if input is invalid or missing.
 */
function parseDate(date: string | Date | undefined) {
    return date ? new Date(date) : undefined;
}

/**
 * Data Transfer Object (DTO) for creating an event.
 * -------------------------------------------------
 * Defines the fields allowed during event creation.
 */
export type EventCreateDTO = {
    title: string;              // Event title (required)
    description?: string;       // Optional description
    location: string;           // Full address string (e.g., "Street 1, 12345 City")
    date: string | Date;        // Date of the event
    imageUrl?: string;          // Optional image
    tags?: string[];            // Array of tag IDs
    participants?: string[];    // Array of participant IDs
    lat?: number;               // Latitude (from geocoding)
    lon?: number;               // Longitude (from geocoding)
    // Optional detailed address fields
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
};

/**
 * DTO for updating an event.
 * --------------------------
 * All fields are optional, since updates may be partial.
 */
export type EventUpdateDTO = Partial<EventCreateDTO>;

/* -------------------------- Helper Utility Functions -------------------------- */

/**
 * Converts a string to a MongoDB ObjectId if valid.
 * Returns undefined if invalid.
 */
function toObjectId(id?: string | null) {
    if (!id) return undefined;
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;
}

/**
 * Creates a case-insensitive RegExp to perform "contains" string matching.
 * Escapes special regex characters to avoid unintended patterns.
 */
function toRegexContains(s?: string) {
    if (!s) return undefined;
    return new RegExp(String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

/**
 * Resolves participant identifiers.
 * ---------------------------------
 * - If a valid ObjectId is given → returns it directly.
 * - Otherwise → searches participants by name or email (case-insensitive).
 * Returns an array of matching participant ObjectIds.
 */
async function resolveParticipantIds(q?: string) {
    if (!q) return undefined;

    // 1) Try as direct ObjectId
    const asId = toObjectId(q);
    if (asId) return [asId];

    // 2) Otherwise search by name/email
    const re = toRegexContains(q);
    const found = await Participant.find(
        re ? { $or: [{ name: re }, { email: re }] } : {}
    ).select('_id');
    return found.map((p) => p._id);
}

/**
 * Converts various input forms into a clean array of non-empty strings.
 * Handles arrays or comma-separated strings.
 */
function collectStrings(v: unknown): string[] {
    if (v == null) return [];
    return (Array.isArray(v) ? v : String(v).split(','))
        .map((s) => s.trim())
        .filter(Boolean);
}

/**
 * Finds Tag IDs by their names (case-insensitive).
 * Accepts a single string or array of strings.
 */
async function resolveTagIdsByNames(names?: string | string[]) {
    const arr = collectStrings(names);
    if (!arr.length) return undefined;
    const regexes = arr.map((n) => new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    const docs = await Tag.find({ name: { $in: regexes } }).select('_id');
    return docs.map((t) => t._id);
}

/**
 * Maps an array of string IDs into MongoDB ObjectIds.
 * Filters out invalid IDs automatically.
 */
function mapIdStrings(ids?: string[]) {
    return (ids ?? []).map(toObjectId).filter(Boolean) as Types.ObjectId[];
}

/* ----------------------------- Event Service Logic ----------------------------- */

export const EventService = {

    /**
     * Lists all events matching the given filters.
     * Supports:
     * - Text search (`q`) on title/description
     * - Date range (`from`, `to`)
     * - Partial location match
     * - Filtering by participant ID or name/email
     * - Filtering by tag ID or tag name(s)
     */
    async list(query: Query) {
        const { q, from, to, location, participant, tag, tags } = query;
        const filter: Record<string, any> = {};

        // Simple text search in title or description
        if (q) {
            const re = toRegexContains(q);
            if (re) filter.$or = [{ title: re }, { description: re }];
        }

        // Date range filtering
        if (from || to) {
            filter.date = {};
            if (from) {
                const fromDate = parseDate(from);
                if (fromDate) filter.date.$gte = fromDate;
            }
            if (to) {
                const toDate = parseDate(to);
                if (toDate) filter.date.$lte = toDate;
            }
        }

        // Location substring match
        if (location) filter.location = { $regex: String(location), $options: 'i' };

        // Filter by participant (ID or name/email)
        if (participant) {
            const partIds = await resolveParticipantIds(participant);
            if (!partIds || partIds.length === 0) return [];
            filter.participants = { $in: partIds };
        }

        // Filter by tag ID
        if (tag) {
            const tid = toObjectId(tag);
            if (tid) filter.tags = { $in: [tid] };
            else return []; // invalid ID → no results
        }

        // Filter by tag names
        if (tags) {
            const tagIdsByNames = await resolveTagIdsByNames(tags);
            if (!tagIdsByNames || tagIdsByNames.length === 0) return [];
            filter.tags = { $in: tagIdsByNames };
        }

        // Query database and populate references (tags and participants)
        return Event.find(filter)
            .populate('tags participants')
            .sort({ date: 1 }) // sort by date ascending
            .lean();            // returns plain JS objects (not Mongoose docs)
    },

    /**
     * Retrieves a single event by its ID.
     * Throws 400 if the ID is invalid and 404 if not found.
     */
    async get(id: string) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid event id');
        const doc = await Event.findById(id).populate('tags participants').lean();
        if (!doc) throw AppError.notFound('Event not found');
        return doc;
    },

    /**
     * Creates a new event document.
     * Validates required fields, converts date, and maps tag/participant IDs.
     */
    async create(input: EventCreateDTO) {
        if (!input?.title) throw AppError.badRequest('title is required');
        if (!input?.date) throw AppError.badRequest('date is required');
        if (!input?.location) throw AppError.badRequest('location is required');

        const created = await Event.create({
            ...input,
            date: new Date(input.date),
            tags: mapIdStrings(input.tags),
            participants: mapIdStrings(input.participants),
        } as any);

        // Populate references before returning
        return created.populate('tags participants');
    },

    /**
     * Updates an existing event by its ID.
     * - Converts date field to Date
     * - Converts tags and participants to ObjectIds
     */
    async update(id: string, input: EventUpdateDTO) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid event id');

        const payload: any = { ...input };
        if (input.date) payload.date = new Date(input.date);
        if (input.tags) payload.tags = mapIdStrings(input.tags);
        if (input.participants) payload.participants = mapIdStrings(input.participants);

        const updated = await Event.findByIdAndUpdate(id, payload, {
            new: true,             // return updated document
            runValidators: true,   // run schema validation
        }).populate('tags participants');

        if (!updated) throw AppError.notFound('Event not found');
        return updated;
    },

    /**
     * Deletes an event by its ID.
     */
    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid event id');
        const del = await Event.findByIdAndDelete(id);
        if (!del) throw AppError.notFound('Event not found');
        return { ok: true };
    },

    /**
     * Adds a tag to an event (if not already present).
     * Uses $addToSet to avoid duplicates.
     */
    async addTag(eventId: string, tagId: string) {
        if (!Types.ObjectId.isValid(eventId) || !Types.ObjectId.isValid(tagId)) {
            throw AppError.badRequest('Invalid id');
        }
        const updated = await Event.findByIdAndUpdate(
            eventId,
            { $addToSet: { tags: new Types.ObjectId(tagId) } },
            { new: true }
        ).populate('tags participants');
        if (!updated) throw AppError.notFound('Event not found');
        return updated;
    },

    /**
     * Removes a tag from an event.
     */
    async removeTag(eventId: string, tagId: string) {
        if (!Types.ObjectId.isValid(eventId) || !Types.ObjectId.isValid(tagId)) {
            throw AppError.badRequest('Invalid id');
        }
        const updated = await Event.findByIdAndUpdate(
            eventId,
            { $pull: { tags: new Types.ObjectId(tagId) } },
            { new: true }
        ).populate('tags participants');
        if (!updated) throw AppError.notFound('Event not found');
        return updated;
    },

    /**
     * Adds a participant to an event (without duplicates).
     */
    async addParticipant(eventId: string, participantId: string) {
        if (!Types.ObjectId.isValid(eventId) || !Types.ObjectId.isValid(participantId)) {
            throw AppError.badRequest('Invalid id');
        }
        const updated = await Event.findByIdAndUpdate(
            eventId,
            { $addToSet: { participants: new Types.ObjectId(participantId) } },
            { new: true }
        ).populate('tags participants');
        if (!updated) throw AppError.notFound('Event not found');
        return updated;
    },

    /**
     * Removes a participant from an event.
     */
    async removeParticipant(eventId: string, participantId: string) {
        if (!Types.ObjectId.isValid(eventId) || !Types.ObjectId.isValid(participantId)) {
            throw AppError.badRequest('Invalid id');
        }
        const updated = await Event.findByIdAndUpdate(
            eventId,
            { $pull: { participants: new Types.ObjectId(participantId) } },
            { new: true }
        ).populate('tags participants');
        if (!updated) throw AppError.notFound('Event not found');
        return updated;
    },
};
