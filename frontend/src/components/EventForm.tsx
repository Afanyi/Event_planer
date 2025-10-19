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

function toLocalDatetimeInputValue(d = new Date()): string {
    const pad = (n: number) => `${n}`.padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
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

        const formEl = e.currentTarget;
        const form = new FormData(formEl);

        const title = String(form.get('title') ?? '').trim();
        const description = String(form.get('description') ?? '').trim();
        const location = String(form.get('location') ?? '').trim();
        const date = String(form.get('date') ?? '').trim();
        const imageUrl = String(form.get('imageUrl') ?? '').trim(); // keine Regex-Validierung

        const titleInput = formEl.elements.namedItem('title') as HTMLInputElement | null;
        const locInput = formEl.elements.namedItem('location') as HTMLInputElement | null;
        const dateInput = formEl.elements.namedItem('date') as HTMLInputElement | null;

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

        if (location && (location.length < 2 || location.length > 80 || !LOCATION_RE.test(location))) {
            const msg =
                'Ungültiger Ort. 2–80 Zeichen; Buchstaben/Ziffern sowie . , - / ( ) erlaubt; keine führenden/abschließenden Sonderzeichen.';
            setError({ message: msg });
            locInput?.setCustomValidity(msg);
            locInput?.reportValidity();
            locInput?.setCustomValidity('');
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
            location,
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

                <div className="row">
                    <input
                        name="location"
                        placeholder="Location"
                        style={{ flex: 1 }}
                        minLength={2}
                        maxLength={80}
                        pattern="^[A-Za-zÀ-ÖØ-öø-ÿ0-9](?:[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,\-\/()]+[A-Za-zÀ-ÖØ-öø-ÿ0-9])?$"
                        title="2–80 Zeichen; Buchstaben/Ziffern sowie . , - / ( ) erlaubt; keine führenden/abschließenden Sonderzeichen."
                    />
                    <input name="imageUrl" placeholder="Image URL" />
                </div>

                <textarea name="description" placeholder="Description" maxLength={500} title="Max. 500 Zeichen" />

                <div className="row" style={{ gap: 12 }}>
                    <div>
                        <strong>Tags</strong>
                        <br />
                        {tags.map((t) => (
                            <label key={t._id} className="row">
                                <input type="checkbox" name="tags" value={t._id} />{' '}
                                <span className="tag" style={{ background: t.color }}>
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
