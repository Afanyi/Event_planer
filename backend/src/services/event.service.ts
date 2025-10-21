// backend/src/services/event.service.ts
import { Types } from 'mongoose';
import { Event } from '../models/Event';
import { Tag } from '../models/Tag';
import { Participant } from '../models/Participant';
import { AppError } from '../utils/errors';

export type Query = {
    q?: string;
    from?: string;
    to?: string;
    location?: string;
    participant?: string;         // id oder name/email
    tag?: string;                 // tag id
    tags?: string | string[];     // tag-namen (komma oder Array)
};

/** Helper function to parse date */
function parseDate(date: string | Date | undefined) {
    return date ? new Date(date) : undefined;
}

/** Erlaubte Felder beim Erstellen eines Events */
export type EventCreateDTO = {
    title: string;
    description?: string;
    location: string;             // "Straße Hausnummer, PLZ Stadt"
    date: string | Date;
    imageUrl?: string;
    tags?: string[];              // ids als strings
    participants?: string[];      // ids als strings
    // Freestyle Feature: abgeleitete Geo-Daten
    lat?: number;
    lon?: number;
    // Optional: Einzelteile der Adresse, falls du sie mitpersistierst
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
};

/** Erlaubte Felder beim Aktualisieren (inkl. lat/lon & Einzelteile) */
export type EventUpdateDTO = Partial<EventCreateDTO>;

/* ----------------------------- Hilfsfunktionen ----------------------------- */

function toObjectId(id?: string | null) {
    if (!id) return undefined;
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;
}

function toRegexContains(s?: string) {
    if (!s) return undefined;
    return new RegExp(String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

async function resolveParticipantIds(q?: string) {
    if (!q) return undefined;

    // 1) direkte ID
    const asId = toObjectId(q);
    if (asId) return [asId];

    // 2) sonst Suche (name/email, case-insensitive)
    const re = toRegexContains(q);
    const found = await Participant.find(
        re ? { $or: [{ name: re }, { email: re }] } : {}
    ).select('_id');
    return found.map((p) => p._id);
}

function collectStrings(v: unknown): string[] {
    if (v == null) return [];
    return (Array.isArray(v) ? v : String(v).split(','))
        .map((s) => s.trim())
        .filter(Boolean);
}

async function resolveTagIdsByNames(names?: string | string[]) {
    const arr = collectStrings(names);
    if (!arr.length) return undefined;
    const regexes = arr.map((n) => new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    const docs = await Tag.find({ name: { $in: regexes } }).select('_id');
    return docs.map((t) => t._id);
}

function mapIdStrings(ids?: string[]) {
    return (ids ?? []).map(toObjectId).filter(Boolean) as Types.ObjectId[];
}

/* --------------------------------- Service -------------------------------- */

export const EventService = {
    /** Liste mit Filtern (q, from, to, location, participant, tag, tags) */
    async list(query: Query) {
        const { q, from, to, location, participant, tag, tags } = query;
        const filter: Record<string, any> = {};

        // "Volltext light" auf title/description
        if (q) {
            const re = toRegexContains(q);
            if (re) filter.$or = [{ title: re }, { description: re }];
        }

        // Datumsbereich
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

        // Location-Teilstring
        if (location) filter.location = { $regex: String(location), $options: 'i' };

        // Teilnehmer: ID oder name/email
        if (participant) {
            const partIds = await resolveParticipantIds(participant);
            if (!partIds || partIds.length === 0) return [];
            filter.participants = { $in: partIds };
        }

        // Tag per ID
        if (tag) {
            const tid = toObjectId(tag);
            if (tid) filter.tags = { $in: [tid] };
            else return []; // ungültige id => keine Ergebnisse
        }

        // Tags per Namen
        if (tags) {
            const tagIdsByNames = await resolveTagIdsByNames(tags);
            if (!tagIdsByNames || tagIdsByNames.length === 0) return [];
            filter.tags = { $in: tagIdsByNames };
        }

        return Event.find(filter)
            .populate('tags participants')
            .sort({ date: 1 })
            .lean();
    },

    async get(id: string) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid event id');
        const doc = await Event.findById(id).populate('tags participants').lean();
        if (!doc) throw AppError.notFound('Event not found');
        return doc;
    },

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

        return created.populate('tags participants');
    },

    async update(id: string, input: EventUpdateDTO) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid event id');

        const payload: any = { ...input };
        if (input.date) payload.date = new Date(input.date);
        if (input.tags) payload.tags = mapIdStrings(input.tags);
        if (input.participants) payload.participants = mapIdStrings(input.participants);

        const updated = await Event.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        }).populate('tags participants');

        if (!updated) throw AppError.notFound('Event not found');
        return updated;
    },

    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid event id');
        const del = await Event.findByIdAndDelete(id);
        if (!del) throw AppError.notFound('Event not found');
        return { ok: true };
    },

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
