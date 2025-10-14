import {api} from '../api';
import type {Event, Participant, Tag} from '../types';

export default function EventList({
                                      events,
                                      allTags,
                                      allParticipants,
                                      onChanged,
                                  }: {
    events: Event[];
    allTags: Tag[];
    allParticipants: Participant[];
    onChanged: () => void;
}) {
    async function remove(id: string) {
        if (!confirm('Delete event?')) return;
        await api(`/events/${id}`, {method: 'DELETE'});
        onChanged();
    }

    async function addTag(eventId: string, tagId: string) {
        await api(`/events/${eventId}/tags/${tagId}`, {method: 'POST'});
        onChanged();
    }

    async function removeTag(eventId: string, tagId: string) {
        await api(`/events/${eventId}/tags/${tagId}`, {method: 'DELETE'});
        onChanged();
    }

    async function addPart(eventId: string, pid: string) {
        await api(`/events/${eventId}/participants/${pid}`, {method: 'POST'});
        onChanged();
    }

    async function removePart(eventId: string, pid: string) {
        await api(`/events/${eventId}/participants/${pid}`, {method: 'DELETE'});
        onChanged();
    }

    return (
        <div className="grid" style={{gap: 8}}>
            <h3 style={{margin: 0}}>📋 Events</h3>
            {events.length === 0 && <p style={{opacity: 0.7}}>No events yet. Add one!</p>}

            {events.map(e => (
                <div key={e._id} className="card grid" style={{gap: 8}}>
                    <div className="row" style={{justifyContent: 'space-between'}}>
                        <div>
                            <strong>{e.title}</strong>
                            <div style={{opacity: 0.8}}>{new Date(e.date).toLocaleString()}</div>
                            <div style={{opacity: 0.8}}>{e.location}</div>
                        </div>
                        <button onClick={() => remove(e._id)}>Delete</button>
                    </div>

                    {e.description && <div>{e.description}</div>}
                    {e.imageUrl && (
                        <img src={e.imageUrl} alt="event" style={{maxWidth: '100%', borderRadius: 8}}/>
                    )}

                    <div className="row">
                        {e.tags.map(t => (
                            <span
                                key={t._id}
                                className="tag"
                                style={{background: t.color}}
                                onClick={() => removeTag(e._id, t._id)}
                                title="Remove tag"
                            >
                {t.name} ✖
              </span>
                        ))}
                        <select
                            onChange={ev => {
                                const v = ev.target.value;
                                if (v) {
                                    addTag(e._id, v);
                                    ev.currentTarget.selectedIndex = 0;
                                }
                            }}
                        >
                            <option value="">+ Add tag…</option>
                            {allTags
                                .filter(t => !e.tags.some(et => et._id === t._id))
                                .map(t => (
                                    <option key={t._id} value={t._id}>
                                        {t.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="row">
                        {e.participants.map(p => (
                            <span
                                key={p._id}
                                className="badge"
                                onClick={() => removePart(e._id, p._id)}
                                title="Remove participant"
                            >
                {p.name} ✖
              </span>
                        ))}
                        <select
                            onChange={ev => {
                                const v = ev.target.value;
                                if (v) {
                                    addPart(e._id, v);
                                    ev.currentTarget.selectedIndex = 0;
                                }
                            }}
                        >
                            <option value="">+ Add participant…</option>
                            {allParticipants
                                .filter(p => !e.participants.some(ep => ep._id === p._id))
                                .map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>
            ))}
        </div>
    );
}
