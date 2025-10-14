import { api } from '../api';
import type { Tag } from '../types';
import { useState } from 'react';

export default function TagList({ tags, onChanged }: { tags: Tag[]; onChanged: () => void }) {
    const [error, setError] = useState<{ code: number; message: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function addTag(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const formEl = e.currentTarget;
            const form = new FormData(e.currentTarget);
            const res: unknown = await api('/tags', {
                method: 'POST',
                body: JSON.stringify({
                    name: form.get('name'),
                    color: form.get('color'),
                }),
            });

            // If api() returns a fetch Response, use exact HTTP status + backend message
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

            // Fallback: api() returned parsed JSON with an error field
            if (res && typeof res === 'object' && 'error' in (res as any)) {
                setError({
                    code: 400,
                    message: (res as any).error || 'Bad Request',
                });
                return;
            }
            formEl.reset();
            onChanged();
            //e.currentTarget.reset();
        } catch (err: any) {
            setError({
                code: 0,
                message: err?.message || 'Network error',
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="card">
            <h3>🏷️ Tags</h3>

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

            <form className="row" onSubmit={addTag}>
                <input name="name" placeholder="Name" required />
                <input name="color" placeholder="#rrggbb" defaultValue="#4f46e5" required />
                <button disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</button>
            </form>
            <div className="row" style={{ marginTop: 8 }}>
                {tags.map(t => (
                    <span key={t._id} className="tag" style={{ background: t.color }}>
                        {t.name}
                    </span>
                ))}
            </div>
        </div>
    );
}
