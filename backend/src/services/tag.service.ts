import { Tag } from '../models/Tag';
import { AppError } from '../utils/errors';
import { Types } from 'mongoose';

export const TagService = {
    async list() { return Tag.find().sort({ name: 1 }).lean(); },
    async get(id: string) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid tag id');
        const doc = await Tag.findById(id).lean();
        if (!doc) throw AppError.notFound('Tag not found'); return doc;
    },
    async create(input: { name: string; color: string }) {
        if (!input?.name || !input?.color) throw AppError.badRequest('name and color are required');
        const existing = await Tag.findOne({ name: input.name });
        if (existing) throw AppError.conflict('Tag name already exists.');
        return Tag.create(input);
    },
    async update(id: string, input: Partial<{ name: string; color: string }>) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid tag id');
        const updated = await Tag.findByIdAndUpdate(id, input, { new: true, runValidators: true });
        if (!updated) throw AppError.notFound('Tag not found'); return updated;
    },
    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid tag id');
        const del = await Tag.findByIdAndDelete(id);
        if (!del) throw AppError.notFound('Tag not found'); return { ok: true };
    },
};
