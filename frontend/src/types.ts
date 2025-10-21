// frontend/src/types.ts

/** Einfache ID- und Ref-Typen */
export type Id = string;
export type Ref<T> = Id | T;

/* =========================
 * Domänen-Modelle (Frontend)
 * ========================= */

export interface Tag {
    color?: string;
    _id: Id;
    name: string;
}

export interface Participant {
    _id: Id;
    name: string;
    email?: string;
}

/**
 * Event wie es im Frontend genutzt wird.
 * - `tags`/`participants` können als IDs (nicht-populiert) oder als Objekte (populiert) vorliegen.
 * - Adresse als kombinierter String + optionale Einzelteile.
 * - Geo-Koordinaten optional (werden via Geocoding gesetzt).
 */
export interface Event {
    _id: Id;

    title: string;
    description?: string;

    // Kombinierte Adresse: "Musterstraße 1, 12345 Berlin"
    location: string;

    // ISO-String (Date wird serverseitig zu Date konvertiert)
    date: string;

    imageUrl?: string;

    tags: Array<Ref<Tag>>;
    participants: Array<Ref<Participant>>;

    // Freestyle-Feature: abgeleitete Geo-Daten
    lat?: number;
    lon?: number;

    // Optional: Einzelteile der Adresse (falls im Backend mitpersistiert)
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
}

/* ======================
 * Form-/API-DTOs (FE)
 * ====================== */

/** Payload zum Erstellen aus dem Formular (Frontend → Backend) */
export interface EventCreatePayload {
    title: string;
    description?: string;

    // Kombinierte Adresse wird im Form zusammengebaut und als `location` gesendet:
    location: string;

    // Einzelteile zusätzlich mitsenden (Backend kann sie speichern/validieren)
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;

    date: string;            // e.g. "2025-10-20T15:00"
    imageUrl?: string;

    tags?: Id[];             // als IDs
    participants?: Id[];     // als IDs
}

/** Payload für Updates (nur Felder, die sich ändern) */
export type EventUpdatePayload = Partial<
    Omit<EventCreatePayload, 'street' | 'houseNumber' | 'postalCode' | 'city'>
> & {
    // Beim Update können auch nur Einzelteile kommen, die zu `location` kombiniert werden
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;

    // Freestyle-Feature: Koordinaten ggf. direkt aktualisieren
    lat?: number;
    lon?: number;
};

/* ===========================
 * Wetter-Feature: API-Types
 * =========================== */

/**
 * Antwort des Wetter-Endpunkts:
 * GET /api/events/:id/weather?date=YYYY-MM-DD
 */
export interface WeatherSummary {
    eventId?: Id;
    available: boolean;

    date?: string;                // YYYY-MM-DD
    tempMin?: number;             // °C
    tempMax?: number;             // °C
    precipitationChance?: number; // %
    icon?: string;                // OWM-Icon-Code (z.B. "04d")
    description?: string;         // Kurzbeschreibung (z.B. "clouds")
    source?: string;              // "OpenWeatherMap 5-day/3-hour forecast"

    // Zur Anzeige/Debug hilfreich
    lat?: number;
    lon?: number;
    note?: string;                // z.B. wenn kein Forecast verfügbar
}

/* ===========================
 * Hilfs-Typwächter (optional)
 * =========================== */

/** Prüft, ob ein Wert ein populiertes Objekt (= mit _id) ist. */
export function isPopulated<T extends { _id: Id }>(val: Ref<T>): val is T {
    return typeof val === 'object' && val !== null && '_id' in val;
}

/** Extrahiert die ID aus einer Ref (egal ob ID oder populiertes Objekt). */
export function refId<T extends { _id: Id }>(val: Ref<T>): Id {
    return (isPopulated(val) ? val._id : val) as Id;
}
