import { Tag } from '../models/Tag';
import { AppError } from '../utils/errors';
import { Types } from 'mongoose';

const isValidId = (id: string) => Types.ObjectId.isValid(id);

export const TagService = {
    async list() {
        return Tag.find().sort({ name: 1 }).lean();
    },

    async get(id: string) {
        if (!isValidId(id)) throw AppError.badRequest('Invalid tag id');
        const doc = await Tag.findById(id).lean();
        if (!doc) throw AppError.notFound('Tag not found');
        return doc;
    },

    async create(input: { name: string; color: string }) {
        if (!input?.name || !input?.color) throw AppError.badRequest('name and color are required');
        const existing = await Tag.findOne({ name: input.name });
        if (existing) throw AppError.conflict('Tag name already exists.');
        return Tag.create(input);
    },

    async update(id: string, input: Partial<{ name: string; color: string }>) {
        if (!isValidId(id)) throw AppError.badRequest('Invalid tag id');
        const updated = await Tag.findByIdAndUpdate(id, input, { new: true, runValidators: true });
        if (!updated) throw AppError.notFound('Tag not found');
        return updated;
    },

    async remove(id: string) {
        if (!isValidId(id)) throw AppError.badRequest('Invalid tag id');
        const del = await Tag.findByIdAndDelete(id);
        if (!del) throw AppError.notFound('Tag not found');
        return { ok: true };
    },

    /**
     * Bulk remove tags by an array of IDs
     */
    async removeMany(ids: string[]) {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw AppError.badRequest('ids[] is required and cannot be empty');
        }

        // Remove duplicate IDs
        const uniqueIds = [...new Set(ids.map(String))];

        // Validate all IDs
        const invalid = uniqueIds.filter((id) => !isValidId(id));
        if (invalid.length) {
            throw AppError.badRequest(`Invalid tag id(s): ${invalid.join(', ')}`);
        }

        // Perform bulk deletion
        const { deletedCount = 0 } = await Tag.deleteMany({
            _id: { $in: uniqueIds },
        });

        if (deletedCount === 0) {
            throw AppError.notFound('No tags matched the provided ids');
        }

        return { ok: true, deletedCount };
    },
};
