import { api } from '../api';
import type { Tag } from '../types';

export default function TagList({ tags, onChanged }: { tags: Tag[]; onChanged: () => void }) {
    async function addTag(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        await api('/tags', {
            method: 'POST',
            body: JSON.stringify({
                name: form.get('name'),
                color: form.get('color'),
            }),
        });
        onChanged();
        e.currentTarget.reset();
    }

    return (
        <div className="card">
            <h3>🏷️ Tags</h3>
            <form className="row" onSubmit={addTag}>
                <input name="name" placeholder="Name" required />
                <input name="color" placeholder="#rrggbb" defaultValue="#4f46e5" required />
                <button>Add</button>
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
