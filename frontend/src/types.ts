/** Simple ID and Ref Types */
export type Id = string;   // ID type is just a string
export type Ref<T> = Id | T; // Ref can be either an ID (string) or a populated object of type T

/* =========================
 * Domain Models (Frontend)
 * ========================= */

/**
 * Represents a Tag that can be associated with events.
 * - Optional color for the tag.
 * - Must have an ID and name.
 */
export interface Tag {
    color?: string;    // Optional color for the tag
    _id: Id;          // Unique ID for the tag
    name: string;     // Name of the tag
}

/**
 * Represents a Participant that can be associated with events.
 * - Has a required ID and name.
 * - Optionally, an email.
 */
export interface Participant {
    _id: Id;          // Unique ID for the participant
    name: string;     // Name of the participant
    email?: string;   // Optional email of the participant
}

/**
 * Event object as used on the frontend.
 * - `tags` and `participants` can be either IDs or fully populated objects.
 * - Address can be sent as a combined string and optionally with individual address components.
 * - Geo-coordinates are optional (can be set through geocoding).
 */
export interface Event {
    _id: Id;              // Unique ID for the event

    title: string;        // Title of the event
    description?: string; // Optional description of the event

    location: string;     // Combined address as a string (e.g., "Street 1, 12345 City")

    date: string;         // Event date (ISO string, server will convert to Date)

    imageUrl?: string;    // Optional image URL associated with the event

    tags: Array<Ref<Tag>>;           // Array of tags, each can be either a tag ID or a populated tag object
    participants: Array<Ref<Participant>>;  // Array of participants, each can be either an ID or a populated participant object

    lat?: number;         // Optional latitude, set via geocoding
    lon?: number;         // Optional longitude, set via geocoding

    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
}

/* ======================
 * Form/API DTOs (Frontend)
 * ====================== */

/**
 * Payload used for creating an event from the frontend form.
 * - The combined address is sent as `location`, while individual components are also included.
 * - Optional image URL, tags, and participants.
 */
export interface EventCreatePayload {
    title: string;         // Event title (required)
    description?: string;  // Optional event description

    location: string;      // Combined address (street + house number, postal code, city)
    street: string;        // Individual address component (street)
    houseNumber: string;   // Individual address component (house number)
    postalCode: string;    // Individual address component (postal code)
    city: string;          // Individual address component (city)

    date: string;          // Event date (e.g., "2025-10-20T15:00")

    imageUrl?: string;     // Optional image URL for the event

    tags?: Id[];           // Array of tag IDs (optional)
    participants?: Id[];   // Array of participant IDs (optional)
}

/**
 * Payload for updating an event.
 * - Only the fields that change are included, making it a partial DTO.
 * - Tags and participants can be updated along with individual address parts.
 */
export type EventUpdatePayload = Partial<
    Omit<EventCreatePayload, 'street' | 'houseNumber' | 'postalCode' | 'city'>
> & {
    // Address components can also be provided individually for updates
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;

    // Optional update of geo-coordinates (latitude and longitude)
    lat?: number;
    lon?: number;
};

/* ===========================
 * Weather Feature: API Types
 * =========================== */

/**
 * Response format for the weather API endpoint.
 * Used to retrieve weather data for an event on a given date.
 */
export interface WeatherSummary {
    eventId?: Id;            // ID of the event this weather data is related to
    available: boolean;      // Whether the weather forecast is available for the given date

    date?: string;           // Date of the weather forecast (YYYY-MM-DD)
    tempMin?: number;        // Minimum temperature in °C
    tempMax?: number;        // Maximum temperature in °C
    precipitationChance?: number; // Chance of precipitation (percentage)
    icon?: string;           // Icon representing the weather (OpenWeatherMap icon code, e.g., "04d")
    description?: string;    // Short description (e.g., "cloudy")
    source?: string;         // Source of the weather data (e.g., "OpenWeatherMap 5-day/3-hour forecast")

    lat?: number;            // Latitude for the location of the weather data
    lon?: number;            // Longitude for the location of the weather data
    note?: string;           // Helpful note (e.g., "No forecast available")
}

/* ===========================
 * Helper Type Guards (optional)
 * =========================== */

/**
 * Checks if a value is a populated object (i.e., it has an `_id` field).
 * Used to differentiate between a populated object and just an ID reference.
 */
export function isPopulated<T extends { _id: Id }>(val: Ref<T>): val is T {
    return typeof val === 'object' && val !== null && '_id' in val;
}

/**
 * Extracts the ID from a reference (either a populated object or a raw ID).
 * Returns the ID as a string.
 */
export function refId<T extends { _id: Id }>(val: Ref<T>): Id {
    return (isPopulated(val) ? val._id : val) as Id;
}
