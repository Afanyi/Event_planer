import { api } from '../api';
import type { Participant, Tag } from '../types';
import React, { useMemo, useState } from 'react';

/* ============================ Regex Validation Rules ============================ */
// Title: 3–80 characters, no leading/trailing special chars, allows punctuation inside
const TITLE_RE: RegExp =
    /^[A-Za-zÀ-ÖØ-öø-ÿ0-9](?:[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,:;!?\-()'"\/&]+[A-Za-zÀ-ÖØ-öø-ÿ0-9])?$/;

// Location: 2–80 characters, allows . , - / ( ), no leading/trailing special chars
const LOCATION_RE: RegExp =
    /^[A-Za-zÀ-ÖØ-öø-ÿ0-9](?:[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,\-\/()]+[A-Za-zÀ-ÖØ-öø-ÿ0-9])?$/;

// German postal code (exactly 5 digits)
const PLZ_RE: RegExp = /^\d{5}$/;

/**
 * Converts a Date into an HTML5 datetime-local input string.
 * Example: 2025-10-31T14:05
 */
function toLocalDatetimeInputValue(d = new Date()): string {
    const pad = (n: number) => `${n}`.padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

/**
 * Builds a full address string from individual parts.
 * Example: ("Main St", "12", "12345", "Berlin") → "Main St 12, 12345 Berlin"
 */
function composeLocation(street: string, houseNumber: string, postalCode: string, city: string): string {
    return `${street} ${houseNumber}, ${postalCode} ${city}`.replace(/\s+/g, ' ').trim();
}

/**
 * EventForm Component
 * -------------------
 * - Used to create new events.
 * - Includes client-side validation for title, address, postal code, and date.
 * - Submits data to backend API (`/events`) and resets the form after success.
 */
export default function EventForm({
                                      tags,
                                      participants,
                                      onCreated,
                                  }: {
    tags: Tag[];
    participants: Participant[];
    onCreated: () => void;
}) {
    // Store validation or API error messages
    const [error, setError] = useState<{ code?: number; message: string } | null>(null);

    // Minimum selectable date/time = current local time
    const minDate = useMemo(() => toLocalDatetimeInputValue(), []);

    /**
     * Handles form submission
     * -----------------------
     * - Collects form data manually (using FormData)
     * - Validates inputs programmatically
     * - Sends POST request to API if valid
     */
    async function create(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const formEl = e.currentTarget as HTMLFormElement;
        const form = new FormData(formEl);

        // Extract and clean input values
        const title = String(form.get('title') ?? '').trim();
        const description = String(form.get('description') ?? '').trim();
        const date = String(form.get('date') ?? '').trim();
        const imageUrl = String(form.get('imageUrl') ?? '').trim();

        // Address fields (new)
        const street = String(form.get('street') ?? '').trim();
        const houseNumber = String(form.get('houseNumber') ?? '').trim();
        const postalCode = String(form.get('postalCode') ?? '').trim();
        const city = String(form.get('city') ?? '').trim();

        // For validation feedback (highlight invalid inputs)
        const titleInput = formEl.elements.namedItem('title') as HTMLInputElement | null;
        const dateInput = formEl.elements.namedItem('date') as HTMLInputElement | null;
        const streetInput = formEl.elements.namedItem('street') as HTMLInputElement | null;
        const houseInput = formEl.elements.namedItem('houseNumber') as HTMLInputElement | null;
        const plzInput = formEl.elements.namedItem('postalCode') as HTMLInputElement | null;
        const cityInput = formEl.elements.namedItem('city') as HTMLInputElement | null;

        /* ===================== Field-by-field Validation ===================== */

        // Title validation
        if (title.length < 3 || title.length > 80 || !TITLE_RE.test(title)) {
            const msg = 'Invalid title. Must be 3–80 characters, letters/numbers only, no leading/trailing symbols.';
            setError({ message: msg });
            titleInput?.setCustomValidity(msg);
            titleInput?.reportValidity();
            titleInput?.setCustomValidity('');
            return;
        }

        // Street validation
        if (street.length < 2 || street.length > 80) {
            const msg = 'Street must be 2–80 characters.';
            setError({ message: msg });
            streetInput?.setCustomValidity(msg);
            streetInput?.reportValidity();
            streetInput?.setCustomValidity('');
            return;
        }

        // House number validation
        if (houseNumber.length < 1 || houseNumber.length > 10) {
            const msg = 'House number must be 1–10 characters.';
            setError({ message: msg });
            houseInput?.setCustomValidity(msg);
            houseInput?.reportValidity();
            houseInput?.setCustomValidity('');
            return;
        }

        // Postal code validation
        if (!PLZ_RE.test(postalCode)) {
            const msg = 'Please enter a valid 5-digit German postal code.';
            setError({ message: msg });
            plzInput?.setCustomValidity(msg);
            plzInput?.reportValidity();
            plzInput?.setCustomValidity('');
            return;
        }

        // City validation
        if (city.length < 2 || city.length > 80) {
            const msg = 'City must be 2–80 characters.';
            setError({ message: msg });
            cityInput?.setCustomValidity(msg);
            cityInput?.reportValidity();
            cityInput?.setCustomValidity('');
            return;
        }

        // Build combined location string
        const location = composeLocation(street, houseNumber, postalCode, city);
        if (location.length < 2 || location.length > 80 || !LOCATION_RE.test(location)) {
            const msg =
                'Invalid address. Allowed: letters, numbers, . , - / ( ); no leading/trailing symbols.';
            setError({ message: msg });
            // Focus first address field for feedback
            streetInput?.setCustomValidity(msg);
            streetInput?.reportValidity();
            streetInput?.setCustomValidity('');
            return;
        }

        // Date validation
        if (!date) {
            const msg = 'Please select a date and time.';
            setError({ message: msg });
            dateInput?.setCustomValidity(msg);
            dateInput?.reportValidity();
            dateInput?.setCustomValidity('');
            return;
        }
        const picked = new Date(date);
        const now = new Date();
        if (Number.isFinite(picked.getTime()) && picked.getTime() < now.getTime()) {
            const msg = 'The selected date/time is in the past.';
            setError({ message: msg });
            dateInput?.setCustomValidity(msg);
            dateInput?.reportValidity();
            dateInput?.setCustomValidity('');
            return;
        }

        /* ===================== Prepare Payload for API ===================== */
        const payload = {
            title,
            description,
            // Important: send both full location and its individual components
            location,
            street,
            houseNumber,
            postalCode,
            city,
            date,
            imageUrl: imageUrl || '',
            tags: Array.from(
                formEl.querySelectorAll<HTMLInputElement>('input[name=tags]:checked')
            ).map((i) => i.value),
            participants: Array.from(
                formEl.querySelectorAll<HTMLInputElement>('input[name=parts]:checked')
            ).map((i) => i.value),
        };

        // Send POST request to backend
        await api('/events', { method: 'POST', body: JSON.stringify(payload) });

        // Trigger refresh in parent component
        onCreated();

        // Reset form fields
        formEl.reset();
    }

    /* ============================ JSX Markup ============================ */
    return (
        <div className="card">
            <h3>➕ Create Event</h3>

            {/* Display validation or API error messages */}
            {error && (
                <div
                    role="alert"
                    aria-live="polite"
                    style={{
                        marginBottom: 8,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #b84a4a',
                        background: '#2a0f0f',
                        color: '#ffd9d9',
                        fontSize: 14,
                    }}
                >
                    ⚠️ {error.message}
                </div>
            )}

            {/* Event creation form */}
            <form className="grid" style={{ gap: 8 }} onSubmit={create} noValidate>
                {/* Title and Date row */}
                <div className="row">
                    <input
                        name="title"
                        placeholder="Title"
                        required
                        minLength={3}
                        maxLength={80}
                        pattern="^[A-Za-zÀ-ÖØ-öø-ÿ0-9](?:[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,:;!?\-()'&\/]+[A-Za-zÀ-ÖØ-öø-ÿ0-9])?$"
                        title="3–80 characters; letters/numbers; punctuation allowed (.,:;!?-()'&/); no leading/trailing symbols."
                        style={{ flex: 1 }}
                    />
                    <input
                        name="date"
                        type="datetime-local"
                        required
                        min={minDate}
                        title="Select a date and time (cannot be in the past)."
                    />
                </div>

                {/* Address section (4 fields) */}
                <div className="row" style={{ gap: 8 }}>
                    <input
                        name="street"
                        placeholder="Street (e.g. Main Street)"
                        required
                        minLength={2}
                        maxLength={80}
                        style={{ flex: 2 }}
                        autoComplete="address-line1"
                    />
                    <input
                        name="houseNumber"
                        placeholder="No."
                        required
                        minLength={1}
                        maxLength={10}
                        style={{ maxWidth: 100 }}
                        autoComplete="address-line2"
                    />
                    <input
                        name="postalCode"
                        placeholder="ZIP"
                        required
                        pattern="\d{5}"
                        title="5-digit German postal code"
                        style={{ maxWidth: 120 }}
                        autoComplete="postal-code"
                    />
                    <input
                        name="city"
                        placeholder="City (e.g. Berlin)"
                        required
                        minLength={2}
                        maxLength={80}
                        style={{ flex: 1 }}
                        autoComplete="address-level2"
                    />
                </div>

                {/* Optional image URL */}
                <div className="row">
                    <input name="imageUrl" placeholder="Image URL (optional)" />
                </div>

                {/* Description text area */}
                <textarea
                    name="description"
                    placeholder="Description"
                    maxLength={500}
                    title="Max. 500 characters"
                />

                {/* Tags and Participants checkboxes */}
                <div className="row" style={{ gap: 12 }}>
                    <div>
                        <strong>Tags</strong>
                        <br />
                        {tags.map((t) => (
                            <label key={t._id} className="row">
                                <input type="checkbox" name="tags" value={t._id} />{' '}
                                <span className="tag" style={{ background: (t as any).color }}>
                                    {t.name}
                                </span>
                            </label>
                        ))}
                    </div>

                    <div>
                        <strong>Participants</strong>
                        <br />
                        {participants.map((p) => (
                            <label key={p._id} className="row">
                                <input type="checkbox" name="parts" value={p._id} /> {p.name}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Submit button */}
                <button type="submit">Create</button>
            </form>
        </div>
    );
}
