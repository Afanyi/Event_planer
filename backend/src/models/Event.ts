import { Schema, model, type Document } from "mongoose";

/**
 * Interface: EventDoc
 * --------------------
 * Defines the structure of an Event document stored in MongoDB.
 * Extends the default Mongoose Document type for type safety.
 */
export interface EventDoc extends Document {
  title: string; // Title of the event (required)
  description?: string; // Optional detailed description
  location: string; // Combined full location (e.g. "Main Street 1, 12345 Berlin")
  date: string; // Event date (as string, can be changed to Date if preferred)
  imageUrl?: string; // Optional image URL (for posters, thumbnails, etc.)
  tags: string[]; // List of tag IDs or tag names
  participants: string[]; // List of participant IDs

  // Derived / calculated fields
  lat?: number; // Latitude (optional, from geocoding)
  lon?: number; // Longitude (optional, from geocoding)

  // Optional: address parts (can be saved separately if needed)
  street?: string; // Street name
  houseNumber?: string; // House number
  postalCode?: string; // Postal / ZIP code
  city?: string; // City name
}

/**
 * Mongoose Schema for the Event model.
 * Defines the actual database structure, validation, and defaults.
 */
const EventSchema = new Schema<EventDoc>(
  {
    // Required fields
    title: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: String, required: true },

    // Optional / descriptive fields
    description: String,
    imageUrl: String,

    // Collections (arrays) for tags and participants
    tags: { type: [String], default: [] },
    participants: { type: [String], default: [] },

    // Coordinates (from geocoding)
    lat: Number,
    lon: Number,

    // Optional address parts (stored separately if needed)
    street: String,
    houseNumber: String,
    postalCode: String,
    city: String,
  },
  {
    // Adds createdAt and updatedAt timestamps automatically
    timestamps: true,
  },
);

/**
 * Exports the Event model.
 * ------------------------
 * The model is used to interact with the "events" collection in MongoDB.
 * Example: Event.find(), Event.create(), Event.updateOne(), etc.
 */
export const Event = model<EventDoc>("Event", EventSchema);
