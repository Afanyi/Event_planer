import { api } from '../api';
import type { Participant } from '../types';

export default function ParticipantList({
                                            participants,
                                            onChanged,
                                        }: {
    participants: Participant[];
    onChanged: () => void;
}) {
    async function addP(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        await api('/participants', {
            method: 'POST',
            body: JSON.stringify({
                name: form.get('name'),
                email: form.get('email'),
            }),
        });
        onChanged();
        e.currentTarget.reset();
    }

    return (
        <div className="card">
            <h3>👥 Participants</h3>
            <form className="row" onSubmit={addP}>
                <input name="name" placeholder="Name" required />
                <input name="email" placeholder="Email" required />
                <button>Add</button>
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
