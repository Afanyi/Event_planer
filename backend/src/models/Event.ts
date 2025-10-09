import { Schema, model, Types } from 'mongoose';

const EventSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    date: { type: Date, required: true },
    imageUrl: { type: String, default: '' },
    tags: [{ type: Types.ObjectId, ref: 'Tag' }],
    participants: [{ type: Types.ObjectId, ref: 'Participant' }]
}, { timestamps: true });

export const Event = model('Event', EventSchema);
