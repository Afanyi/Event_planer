import { api } from '../api';
import type { Participant, Tag } from '../types';
import React, { useMemo, useState } from 'react';

// ===== Regex-Konstanten =====
// 3–80 Zeichen, kein führendes/abschließendes Sonderzeichen, erlaubte Satzzeichen innen
const TITLE_RE: RegExp =
    /^[A-Za-zÀ-ÖØ-öø-ÿ0-9](?:[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,:;!?\-()'"\/&]+[A-Za-zÀ-ÖØ-öø-ÿ0-9])?$/;
// 2–80 Zeichen, . , - / ( ) erlaubt, kein führendes/abschließendes Sonderzeichen
const LOCATION_RE: RegExp =
    /^[A-Za-zÀ-ÖØ-öø-ÿ0-9](?:[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,\-\/()]+[A-Za-zÀ-ÖØ-öø-ÿ0-9])?$/;
// Deutsche PLZ (5 Ziffern)
const PLZ_RE: RegExp = /^\d{5}$/;

function toLocalDatetimeInputValue(d = new Date()): string {
    const pad = (n: number) => `${n}`.padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function composeLocation(street: string, houseNumber: string, postalCode: string, city: string): string {
    return `${street} ${houseNumber}, ${postalCode} ${city}`.replace(/\s+/g, ' ').trim();
}

export default function EventForm({
                                      tags,
                                      participants,
                                      onCreated,
                                  }: {
    tags: Tag[];
    participants: Participant[];
    onCreated: () => void;
}) {
    const [error, setError] = useState<{ code?: number; message: string } | null>(null);
    const minDate = useMemo(() => toLocalDatetimeInputValue(), []);

    async function create(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const formEl = e.currentTarget as HTMLFormElement;
        const form = new FormData(formEl);

        const title = String(form.get('title') ?? '').trim();
        const description = String(form.get('description') ?? '').trim();
        const date = String(form.get('date') ?? '').trim();
        const imageUrl = String(form.get('imageUrl') ?? '').trim(); // keine Regex-Validierung

        // Neue Adressfelder
        const street = String(form.get('street') ?? '').trim();
        const houseNumber = String(form.get('houseNumber') ?? '').trim();
        const postalCode = String(form.get('postalCode') ?? '').trim();
        const city = String(form.get('city') ?? '').trim();

        // Inputs für Validierungsfeedback
        const titleInput = formEl.elements.namedItem('title') as HTMLInputElement | null;
        const dateInput = formEl.elements.namedItem('date') as HTMLInputElement | null;
        const streetInput = formEl.elements.namedItem('street') as HTMLInputElement | null;
        const houseInput = formEl.elements.namedItem('houseNumber') as HTMLInputElement | null;
        const plzInput = formEl.elements.namedItem('postalCode') as HTMLInputElement | null;
        const cityInput = formEl.elements.namedItem('city') as HTMLInputElement | null;

        // ===== Programmatic Validierung =====
        if (title.length < 3 || title.length > 80 || !TITLE_RE.test(title)) {
            const msg =
                'Ungültiger Titel. 3–80 Zeichen; Buchstaben/Ziffern erlaubt; keine führenden/abschließenden Sonderzeichen.';
            setError({ message: msg });
            titleInput?.setCustomValidity(msg);
            titleInput?.reportValidity();
            titleInput?.setCustomValidity('');
            return;
        }

        // Street
        if (street.length < 2 || street.length > 80) {
            const msg = 'Straße: 2–80 Zeichen.';
            setError({ message: msg });
            streetInput?.setCustomValidity(msg);
            streetInput?.reportValidity();
            streetInput?.setCustomValidity('');
            return;
        }
        // House number
        if (houseNumber.length < 1 || houseNumber.length > 10) {
            const msg = 'Hausnummer: 1–10 Zeichen.';
            setError({ message: msg });
            houseInput?.setCustomValidity(msg);
            houseInput?.reportValidity();
            houseInput?.setCustomValidity('');
            return;
        }
        // PLZ
        if (!PLZ_RE.test(postalCode)) {
            const msg = 'Bitte eine gültige 5-stellige PLZ eingeben.';
            setError({ message: msg });
            plzInput?.setCustomValidity(msg);
            plzInput?.reportValidity();
            plzInput?.setCustomValidity('');
            return;
        }
        // City
        if (city.length < 2 || city.length > 80) {
            const msg = 'Stadt: 2–80 Zeichen.';
            setError({ message: msg });
            cityInput?.setCustomValidity(msg);
            cityInput?.reportValidity();
            cityInput?.setCustomValidity('');
            return;
        }

        const location = composeLocation(street, houseNumber, postalCode, city);
        if (location.length < 2 || location.length > 80 || !LOCATION_RE.test(location)) {
            const msg =
                'Ungültige Adresse. Erlaubt sind Buchstaben/Ziffern sowie . , - / ( ); keine führenden/abschließenden Sonderzeichen.';
            setError({ message: msg });
            // Fokussiere das erste Feld (Straße) bei Adressfehlern
            streetInput?.setCustomValidity(msg);
            streetInput?.reportValidity();
            streetInput?.setCustomValidity('');
            return;
        }

        if (!date) {
            const msg = 'Bitte ein Datum/Zeit wählen.';
            setError({ message: msg });
            dateInput?.setCustomValidity(msg);
            dateInput?.reportValidity();
            dateInput?.setCustomValidity('');
            return;
        }
        const picked = new Date(date);
        const now = new Date();
        if (Number.isFinite(picked.getTime()) && picked.getTime() < now.getTime()) {
            const msg = 'Datum/Zeit liegt in der Vergangenheit.';
            setError({ message: msg });
            dateInput?.setCustomValidity(msg);
            dateInput?.reportValidity();
            dateInput?.setCustomValidity('');
            return;
        }

        const payload = {
            title,
            description,
            // Wichtig: kombinierte Adresse und Einzelteile mitsenden
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

        await api('/events', { method: 'POST', body: JSON.stringify(payload) });
        onCreated();
        formEl.reset();
    }

    return (
        <div className="card">
            <h3>➕ Create Event</h3>

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

            <form className="grid" style={{ gap: 8 }} onSubmit={create} noValidate>
                <div className="row">
                    <input
                        name="title"
                        placeholder="Title"
                        required
                        minLength={3}
                        maxLength={80}
                        pattern="^[A-Za-zÀ-ÖØ-öø-ÿ0-9](?:[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,:;!?\-()'&\/]+[A-Za-zÀ-ÖØ-öø-ÿ0-9])?$"
                        title="3–80 Zeichen; Buchstaben/Ziffern; übliche Satzzeichen (.,:;!?-()'&/); keine führenden/abschließenden Sonderzeichen."
                        style={{ flex: 1 }}
                    />
                    <input
                        name="date"
                        type="datetime-local"
                        required
                        min={minDate}
                        title="Bitte Datum und Zeit auswählen (nicht in der Vergangenheit)."
                    />
                </div>

                {/* Adresse: 4 Felder */}
                <div className="row" style={{ gap: 8 }}>
                    <input
                        name="street"
                        placeholder="Straße (z. B. Musterstraße)"
                        required
                        minLength={2}
                        maxLength={80}
                        style={{ flex: 2 }}
                        autoComplete="address-line1"
                    />
                    <input
                        name="houseNumber"
                        placeholder="Nr."
                        required
                        minLength={1}
                        maxLength={10}
                        style={{ maxWidth: 100 }}
                        autoComplete="address-line2"
                    />
                    <input
                        name="postalCode"
                        placeholder="PLZ"
                        required
                        pattern="\d{5}"
                        title="5-stellige deutsche Postleitzahl"
                        style={{ maxWidth: 120 }}
                        autoComplete="postal-code"
                    />
                    <input
                        name="city"
                        placeholder="Stadt (z. B. Berlin)"
                        required
                        minLength={2}
                        maxLength={80}
                        style={{ flex: 1 }}
                        autoComplete="address-level2"
                    />
                </div>

                <div className="row">
                    <input name="imageUrl" placeholder="Image URL (optional)" />
                </div>

                <textarea name="description" placeholder="Description" maxLength={500} title="Max. 500 Zeichen" />

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

                <button type="submit">Create</button>
            </form>
        </div>
    );
}
