import { Participant } from '../models/Participant';
import { AppError } from '../utils/errors';
import { Types } from 'mongoose';

export const ParticipantService = {
    async list() { return Participant.find().sort({ name: 1 }).lean(); },
    async get(id: string) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid participant id');
        const doc = await Participant.findById(id).lean();
        if (!doc) throw AppError.notFound('Participant not found'); return doc;
    },
    async create(input: { name: string; email: string }) {
        if (!input?.name || !input?.email) throw AppError.badRequest('name and email are required');
        const existing = await Participant.findOne({ name: input.name });
        if (existing) throw AppError.conflict('Participant name already exists.');
        return Participant.create(input);
    },
    async update(id: string, input: Partial<{ name: string; email: string }>) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid participant id');
        const updated = await Participant.findByIdAndUpdate(id, input, { new: true, runValidators: true });
        if (!updated) throw AppError.notFound('Participant not found'); return updated;
    },
    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) throw AppError.badRequest('Invalid participant id');
        const del = await Participant.findByIdAndDelete(id);
        if (!del) throw AppError.notFound('Participant not found'); return { ok: true };
    },
};
