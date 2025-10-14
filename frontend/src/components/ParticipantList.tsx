import { api } from '../api';
import type { Participant } from '../types';
import { useState } from 'react';

export default function ParticipantList({
                                            participants,
                                            onChanged,
                                        }: {
    participants: Participant[];
    onChanged: () => void;
}) {
    const [error, setError] = useState<{ code: number; message: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function addP(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const formEl = e.currentTarget;
            const form = new FormData(e.currentTarget);
            const res: unknown = await api('/participants', {
                method: 'POST',
                body: JSON.stringify({
                    name: form.get('name'),
                    email: form.get('email'),
                }),
            });

            // If api() returns a fetch Response, we can read exact HTTP status + backend message
            if (res && typeof res === 'object' && 'ok' in (res as Response)) {
                const response = res as Response;

                if (!response.ok) {
                    let msg = '';
                    try {
                        const data = await response.json();
                        msg = (data as any)?.error ?? '';
                    } catch {
                        // ignore JSON parse errors
                    }
                    setError({
                        code: response.status,
                        message: msg || response.statusText || 'Request failed',
                    });
                    return;
                }
                formEl.reset();
                onChanged();
                //e.currentTarget.reset();
                return;
            }

            // Fallback: if api() returns parsed JSON directly with an error field
            if (res && typeof res === 'object' && 'error' in (res as any)) {
                setError({
                    code: 400, // best-effort when no Response is available
                    message: (res as any).error || 'Bad Request',
                });
                return;
            }
            formEl.reset();
            onChanged();
            //e.currentTarget.reset();
        } catch (err: any) {
            setError({
                code: 0, // network/unknown
                message: err?.message || 'Network error',
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="card">
            <h3>👥 Participants</h3>

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
                    ⚠️ {error.code ? `HTTP ${error.code}: ` : ''}{error.message}
                </div>
            )}

            <form className="row" onSubmit={addP}>
                <input name="name" placeholder="Name" required />
                <input name="email" placeholder="Email" required />
                <button disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</button>
            </form>
            <ul>
                {participants.map(p => (
                    <li key={p._id}>
                        {p.name} — <span style={{ opacity: 0.7 }}>{p.email}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
