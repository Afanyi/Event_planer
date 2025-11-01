import { Participant } from '../models/Participant';
import { AppError } from '../utils/errors';
import { Types } from 'mongoose';

const isValidId = (id: string) => Types.ObjectId.isValid(id);

export const ParticipantService = {
    async list() {
        return Participant.find().sort({ name: 1 }).lean();
    },

    async get(id: string) {
        if (!isValidId(id)) throw AppError.badRequest('Invalid participant id');
        const doc = await Participant.findById(id).lean();
        if (!doc) throw AppError.notFound('Participant not found');
        return doc;
    },

    async create(input: { name: string; email: string }) {
        if (!input?.name || !input?.email) {
            throw AppError.badRequest('name and email are required');
        }
        const existing = await Participant.findOne({ name: input.name });
        if (existing) throw AppError.conflict('Participant name already exists.');
        return Participant.create(input);
    },

    async update(id: string, input: Partial<{ name: string; email: string }>) {
        if (!isValidId(id)) throw AppError.badRequest('Invalid participant id');
        const updated = await Participant.findByIdAndUpdate(id, input, {
            new: true,
            runValidators: true,
        });
        if (!updated) throw AppError.notFound('Participant not found');
        return updated;
    },

    async remove(id: string) {
        if (!isValidId(id)) throw AppError.badRequest('Invalid participant id');
        const del = await Participant.findByIdAndDelete(id);
        if (!del) throw AppError.notFound('Participant not found');
        return { ok: true };
    },

    /**
     * Bulk remove by ids (non-breaking addition).
     * - Validates all ids.
     * - De-duplicates ids.
     * - Returns deletedCount for better UX.
     */
    async removeMany(ids: string[]) {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw AppError.badRequest('ids[] is required and cannot be empty');
        }

        const uniqueIds = [...new Set(ids.map(String))];
        const invalid = uniqueIds.filter((id) => !isValidId(id));
        if (invalid.length) {
            throw AppError.badRequest(`Invalid participant id(s): ${invalid.join(', ')}`);
        }

        const { deletedCount = 0 } = await Participant.deleteMany({
            _id: { $in: uniqueIds },
        });

        if (deletedCount === 0) {
            throw AppError.notFound('No participants matched the provided ids');
        }

        return { ok: true, deletedCount };
    },
};
