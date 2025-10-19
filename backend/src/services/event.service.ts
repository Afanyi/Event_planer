import { Event } from '../models/Event';
import { Tag } from '../models/Tag';
import { Participant } from '../models/Participant';
import { AppError } from '../utils/errors';
import { Types } from 'mongoose';

type Query = {
    q?: string;
    from?: string;
    to?: string;
    location?: string;
    participant?: string; // id or name/email search
    tag?: string;         // id
    tags?: string | string[]; // names (comma or repeated)
};

export const EventService = {
    async list(query: Query) {
        const { q, from, to, location, participant, tag, tags } = query;
        const filter: any = {};

        if (q) filter.title = { $regex: String(q), $options: 'i' };
        if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = new Date(String(from));
            if (to) filter.date.$lte = new Date(String(to));
        }
        if (location) filter.location = { $regex: String(location), $options: 'i' };

        // participant as id or by name/email (subsearch)
        if (participant) {
            let ids: string[] = [];
            if (Types.ObjectId.isValid(participant)) ids = [participant];
            else {
                const subs = await Participant.find({
                    $or: [
                        { name: { $regex: new RegExp(String(participant), 'i') } },
                        { email: { $regex: new RegExp(String(participant), 'i') } },
                    ],
                }).select('_id');
                ids = subs.map(d => String(d._id));
            }
            if (!ids.length) return [];
            filter.participants = { $in: ids };
        }

        // tag by id
        if (tag && Types.ObjectId.isValid(tag)) filter.tags = { $in: [tag] };

        // tags by names
        const collect = (v: any): string[] =>
            v == null ? [] : (Array.isArray(v) ? v : String(v).split(','))
                .map((s: string) => s.trim()).filter(Boolean);
        const nameTerms = collect(tags);
        if (nameTerms.length) {
            const regexes = nameTerms.map(t => new RegExp(t, 'i'));
            const found = await Tag.find({ name: { $in: regexes } }).select('_id');
            const tagIds = found.map(t => String(t._id));
            if (!tagIds.length) return [];
            filter.tags = { $in: tagIds }; // OR semantics
        }

        return Event.find(filter).populate('tags participants').sort({ date: 1 }).lean();
    },

    async get(id: string) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid event id');
        const doc = await Event.findById(id).populate('tags participants').lean();
        if (!doc) throw AppError.notFound('Event not found'); return doc;
    },

    async create(input: {
        title: string; description?: string; location?: string; date: string | Date;
        imageUrl?: string; tags?: string[]; participants?: string[];
    }) {
        if (!input?.title) throw AppError.badRequest('title is required');
        if (!input?.date) throw AppError.badRequest('date is required');

        const toIds = (ids?: string[]) => (ids ?? [])
            .filter(Types.ObjectId.isValid).map(id => new Types.ObjectId(id));

        const created = await Event.create({
            ...input,
            date: new Date(input.date),
            tags: toIds(input.tags),
            participants: toIds(input.participants),
        });
        return created.populate('tags participants');
    },

    async update(id: string, input: Partial<{
        title: string; description: string; location: string; date: string | Date;
        imageUrl: string; tags: string[]; participants: string[];
    }>) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid event id');

        const mapIds = (ids?: string[]) => (ids ?? [])
            .filter(Types.ObjectId.isValid).map(v => new Types.ObjectId(v));

        const payload: any = { ...input };
        if (input.date) payload.date = new Date(input.date);
        if (input.tags) payload.tags = mapIds(input.tags);
        if (input.participants) payload.participants = mapIds(input.participants);

        const updated = await Event.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
            .populate('tags participants');
        if (!updated) throw AppError.notFound('Event not found'); return updated;
    },

    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid event id');
        const del = await Event.findByIdAndDelete(id);
        if (!del) throw AppError.notFound('Event not found'); return { ok: true };
    },

    async addTag(eventId: string, tagId: string) {
        const updated = await Event.findByIdAndUpdate(
            eventId, { $addToSet: { tags: tagId } }, { new: true }
        ).populate('tags participants');
        if (!updated) throw AppError.notFound('Event not found'); return updated;
    },
    async removeTag(eventId: string, tagId: string) {
        const updated = await Event.findByIdAndUpdate(
            eventId, { $pull: { tags: tagId } }, { new: true }
        ).populate('tags participants');
        if (!updated) throw AppError.notFound('Event not found'); return updated;
    },

    async addParticipant(eventId: string, participantId: string) {
        const updated = await Event.findByIdAndUpdate(
            eventId, { $addToSet: { participants: participantId } }, { new: true }
        ).populate('tags participants');
        if (!updated) throw AppError.notFound('Event not found'); return updated;
    },
    async removeParticipant(eventId: string, participantId: string) {
        const updated = await Event.findByIdAndUpdate(
            eventId, { $pull: { participants: participantId } }, { new: true }
        ).populate('tags participants');
        if (!updated) throw AppError.notFound('Event not found'); return updated;
    },
};
