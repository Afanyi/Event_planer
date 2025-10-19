import { api } from '../__helpers__/app';
import { Tag } from '../../src/models/Tag';
import { Participant } from '../../src/models/Participant';
import { Event } from '../../src/models/Event';

function iso(d: string) { return new Date(d).toISOString(); }

describe('Events API', () => {
    it('creates, reads, updates, deletes event', async () => {
        // Create
        const create = await api().post('/api/events').send({
            title: 'HDA Dev Meetup',
            description: 'CI/CD',
            location: 'Darmstadt',
            date: iso('2025-10-10T10:00:00Z'),
            imageUrl: ''
        });
        expect(create.status).toBe(201);
        const id = create.body._id;

        // Get
        const get = await api().get(`/api/events/${id}`);
        expect(get.status).toBe(200);
        expect(get.body.title).toBe('HDA Dev Meetup');

        // Update
        const upd = await api().put(`/api/events/${id}`).send({ title: 'HDA Dev Meetup (upd)' });
        expect(upd.status).toBe(200);
        expect(upd.body.title).toContain('(upd)');

        // List
        const list = await api().get('/api/events');
        expect(list.status).toBe(200);
        expect(Array.isArray(list.body)).toBe(true);
        expect(list.body.length).toBe(1);

        // Delete
        const del = await api().delete(`/api/events/${id}`);
        expect(del.status).toBe(200);
        expect(del.body).toEqual({ ok: true });

        const list2 = await api().get('/api/events');
        expect(list2.body).toHaveLength(0);
    });

    it('supports filters: q, from/to, location', async () => {
        await Event.create([
            { title: 'Meet Darmstadt', date: iso('2025-10-10T10:00:00Z'), location: 'Darmstadt' },
            { title: 'Meet Frankfurt', date: iso('2025-12-10T10:00:00Z'), location: 'Frankfurt' }
        ]);

        // q filter
        const f1 = await api().get('/api/events').query({ q: 'Darm' });
        expect(f1.status).toBe(200);
        expect(f1.body).toHaveLength(1);
        expect(f1.body[0].title).toMatch(/Darmstadt/);

        // date range
        const f2 = await api().get('/api/events').query({ from: '2025-12-01', to: '2025-12-31' });
        expect(f2.body).toHaveLength(1);
        expect(f2.body[0].title).toMatch(/Frankfurt/);

        // location regex
        const f3 = await api().get('/api/events').query({ location: 'frank' });
        expect(f3.body).toHaveLength(1);
        expect(f3.body[0].location).toBe('Frankfurt');
    });

    it('filters by tag id and by tag names', async () => {
        const tWork = await Tag.create({ name: 'work', color: '#111' });
        const tUrg = await Tag.create({ name: 'urgent', color: '#222' });

        await Event.create([
            { title: 'Work Only', date: iso('2025-10-01T10:00:00Z'), tags: [tWork._id] },
            { title: 'Urgent Only', date: iso('2025-10-02T10:00:00Z'), tags: [tUrg._id] }
        ]);

        // tag by id
        const r1 = await api().get('/api/events').query({ tag: String(tWork._id) });
        expect(r1.status).toBe(200);
        expect(r1.body).toHaveLength(1);
        expect(r1.body[0].title).toBe('Work Only');

        // tags by names
        const r2 = await api().get('/api/events').query({ tags: 'urgent' });
        expect(r2.status).toBe(200);
        expect(r2.body).toHaveLength(1);
        expect(r2.body[0].title).toBe('Urgent Only');

        // names OR-match
        const r3 = await api().get('/api/events').query({ tags: 'work,urgent' });
        expect(r3.status).toBe(200);
        expect(r3.body).toHaveLength(2);
    });

    it('filters by participant id or by participant name/email', async () => {
        const pAlex = await Participant.create({ name: 'Alex', email: 'alex@uni.de' });
        const pBob  = await Participant.create({ name: 'Bob',  email: 'bob@uni.de' });

        await Event.create([
            { title: 'Alex Event', date: iso('2025-10-05T10:00:00Z'), participants: [pAlex._id] },
            { title: 'Bob Event',  date: iso('2025-10-06T10:00:00Z'), participants: [pBob._id] }
        ]);

        const byId = await api().get('/api/events').query({ participant: String(pAlex._id) });
        expect(byId.status).toBe(200);
        expect(byId.body).toHaveLength(1);
        expect(byId.body[0].title).toBe('Alex Event');

        const byName = await api().get('/api/events').query({ participant: 'bob' });
        expect(byName.status).toBe(200);
        expect(byName.body).toHaveLength(1);
        expect(byName.body[0].title).toBe('Bob Event');
    });

    it('relation endpoints: add/remove tag/participant; by-tag/by-participant', async () => {
        const tag = await Tag.create({ name: 'infra', color: '#999' });
        const part = await Participant.create({ name: 'Dana', email: 'dana@uni.de' });

        const create = await api().post('/api/events').send({
            title: 'Infra',
            date: iso('2025-10-10T10:00:00Z'),
        });
        const id = create.body._id;

        // add tag
        const addTag = await api().post(`/api/events/${id}/tags/${String(tag._id)}`);
        expect(addTag.status).toBe(200);
        expect(addTag.body.tags).toHaveLength(1);

        // by-tag
        const byTag = await api().get(`/api/events/by-tag/${String(tag._id)}`);
        expect(byTag.status).toBe(200);
        expect(byTag.body).toHaveLength(1);

        // add participant
        const addP = await api().post(`/api/events/${id}/participants/${String(part._id)}`);
        expect(addP.status).toBe(200);
        expect(addP.body.participants).toHaveLength(1);

        // by-participant
        const byP = await api().get(`/api/events/by-participant/${String(part._id)}`);
        expect(byP.status).toBe(200);
        expect(byP.body).toHaveLength(1);

        // remove tag/participant
        const rmTag = await api().delete(`/api/events/${id}/tags/${String(tag._id)}`);
        expect(rmTag.status).toBe(200);
        expect(rmTag.body.tags).toHaveLength(0);

        const rmP = await api().delete(`/api/events/${id}/participants/${String(part._id)}`);
        expect(rmP.status).toBe(200);
        expect(rmP.body.participants).toHaveLength(0);
    });

    it('validates required fields', async () => {
        const bad = await api().post('/api/events').send({ title: '' });
        expect(bad.status).toBe(400);
        expect(bad.body.error).toMatch(/title|date/i);
    });
});
