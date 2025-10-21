import { Schema, model, type Document } from 'mongoose';

export interface EventDoc extends Document {
    title: string;
    description?: string;
    // Kombinierte Location (z.B. "Musterstraße 1, 12345 Berlin")
    location: string;
    // Event-Datum (du kannst alternativ Date nutzen)
    date: string;
    imageUrl?: string;
    tags: string[];
    participants: string[];
    // Abgeleitet:
    lat?: number;
    lon?: number;

    // Optional: Einzelteile, falls du sie mit speichern willst
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
}

const EventSchema = new Schema<EventDoc>(
    {
        title: { type: String, required: true },
        description: String,
        location: { type: String, required: true },
        date: { type: String, required: true },
        imageUrl: String,
        tags: { type: [String], default: [] },
        participants: { type: [String], default: [] },
        lat: Number,
        lon: Number,
        // optional
        street: String,
        houseNumber: String,
        postalCode: String,
        city: String
    },
    { timestamps: true }
);

export const Event = model<EventDoc>('Event', EventSchema);
