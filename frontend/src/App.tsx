import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type { Event, Tag, Participant } from './types';
import EventList from './components/EventList';
import EventForm from './components/EventForm';
import TagList from './components/TagList';
import ParticipantList from './components/ParticipantList';
import Filters from './components/Filters';
import { Modifications } from './components/Modifications'; // Import the Modifications component

export default function App() {
    const [events, setEvents] = useState<Event[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);

    // Filter-States
    const [q, setQ] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [location, setLocation] = useState('');
    const [participant, setParticipant] = useState('');
    const [tagsFilter, setTagsFilter] = useState('');

    // Selected tags and participants for deletion
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

    async function load() {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (location) params.set('location', location);
        if (participant) params.set('participant', participant);
        if (tagsFilter) params.set('tags', tagsFilter);

        setEvents(await api(`/events?${params.toString()}`));
        setTags(await api('/tags'));
        setParticipants(await api('/participants'));
    }

    useEffect(() => { load(); }, []);

    const pastFutureCounts = useMemo(() => {
        const now = Date.now();
        let past = 0, future = 0;
        for (const e of events) (new Date(e.date).getTime() < now ? past++ : future++);
        return { past, future };
    }, [events]);

    return (
        <div className="container grid" style={{ gap: 16 }}>
            <header className="row" style={{ justifyContent: 'space-between' }}>
                <h1>📅 Events Planner</h1>
                <div className="row">
                    <span className="badge">Past: {pastFutureCounts.past}</span>
                    <span className="badge">Upcoming: {pastFutureCounts.future}</span>
                </div>
            </header>

            <Filters
                q={q}
                setQ={setQ}
                from={from}
                setFrom={setFrom}
                to={to}
                setTo={setTo}
                location={location}
                setLocation={setLocation}
                participant={participant}
                setParticipant={setParticipant}
                tagsFilter={tagsFilter}
                setTagsFilter={setTagsFilter}
                onApply={load}
            />

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="grid">
                    <EventForm tags={tags} participants={participants} onCreated={load} />
                    <TagList tags={tags} onChanged={load} />
                    <ParticipantList participants={participants} onChanged={load} />
                </div>

                <div className="card">
                    <EventList events={events} allTags={tags} allParticipants={participants} onChanged={load} />
                </div>
            </div>

            {/* Modifications component for tag and participant deletion */}
            <Modifications
                tags={tags}
                participants={participants}
                selectedTags={selectedTags}
                selectedParticipants={selectedParticipants}
                setSelectedTags={setSelectedTags}
                setSelectedParticipants={setSelectedParticipants}
            />
        </div>
    );
}
