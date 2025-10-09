import { Schema, model } from 'mongoose';

const ParticipantSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true }
}, { timestamps: true });

export const Participant = model('Participant', ParticipantSchema);
