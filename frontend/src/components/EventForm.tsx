import { api } from '../api';
import type { Participant, Tag } from '../types';
import React from "react";

export default function EventForm({
                                      tags,
                                      participants,
                                      onCreated,
                                  }: {
    tags: Tag[];
    participants: Participant[];
    onCreated: () => void;
}) {
    async function create(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = new FormData(e.currentTarget as HTMLFormElement);
        const payload = {
            title: form.get('title'),
            description: form.get('description'),
            location: form.get('location'),
            date: form.get('date'),
            imageUrl: form.get('imageUrl') || '',
            tags: Array.from(
                (e.currentTarget as HTMLFormElement).querySelectorAll('input[name=tags]:checked')
            ).map((i: any) => i.value),
            participants: Array.from(
                (e.currentTarget as HTMLFormElement).querySelectorAll('input[name=parts]:checked')
            ).map((i: any) => i.value),
        };
        await api('/events', { method: 'POST', body: JSON.stringify(payload) });
        onCreated();
        (e.currentTarget as HTMLFormElement).reset();
    }

    return (
        <div className="card">
            <h3>➕ Create Event</h3>
            <form className="grid" style={{ gap: 8 }} onSubmit={create}>
                <div className="row">
                    <input name="title" placeholder="Title" required style={{ flex: 1 }} />
                    <input name="date" type="datetime-local" required />
                </div>
                <div className="row">
                    <input name="location" placeholder="Location" style={{ flex: 1 }} />
                    <input name="imageUrl" placeholder="Image URL" />
                </div>
                <textarea name="description" placeholder="Description" />

                <div className="row" style={{ gap: 12 }}>
                    <div>
                        <strong>Tags</strong>
                        <br />
                        {tags.map(t => (
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
                        {participants.map(p => (
                            <label key={p._id} className="row">
                                <input type="checkbox" name="parts" value={p._id} /> {p.name}
                            </label>
                        ))}
                    </div>
                </div>
                <button>Create</button>
            </form>
        </div>
    );
}
