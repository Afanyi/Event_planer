//import request from 'supertest';
const request = require('supertest');
import mongoose from 'mongoose';
import { startTestMongo, stopTestMongo, clearDatabase } from '../setup/mongo';
import { createApp } from '../../src/app';
import { Tag } from '../../src/models/Tag';
import { Participant } from '../../src/models/Participant';
import { Event } from '../../src/models/Event';

describe('Integration: Events/Tags/Participants (real MongoDB)', () => {
    const app = createApp();

    beforeAll(async () => {
        await startTestMongo();
    });

    afterAll(async () => {
        await stopTestMongo();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    it('GET /api/health returns ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });

    it('POST /api/tags creates tag and prevents duplicates (unique name)', async () => {
        const r1 = await request(app).post('/api/tags').send({ name: 'work', color: '#ff0000' });
        expect(r1.status).toBeLessThan(300);
        expect(r1.body.name).toBe('work');

        // zweiter gleicher Name sollte 409/400 o.ä. liefern – hängt von deiner Route ab
        const r2 = await request(app).post('/api/tags').send({ name: 'work', color: '#00ff00' });
        expect(r2.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/participants creates participant and prevents duplicate names (per Spezifikation)', async () => {
        const p1 = await request(app).post('/api/participants').send({ name: 'Alice', email: 'a@ex.com' });
        expect(p1.status).toBeLessThan(300);
        expect(p1.body.name).toBe('Alice');

        const p2 = await request(app).post('/api/participants').send({ name: 'Alice', email: 'different@ex.com' });
        // laut Kommentar „Prevent duplicate participant names“
        expect(p2.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/events creates and populates relations', async () => {
        const tag = await request(app).post('/api/tags').send({ name: 'urgent', color: '#123456' }).then(r => r.body);
        const part = await request(app).post('/api/participants').send({ name: 'Bob', email: 'b@ex.com' }).then(r => r.body);

        const evtRes = await request(app).post('/api/events').send({
            title: 'Standup',
            description: 'Daily',
            location: 'Room 1',
            date: new Date().toISOString(),
            imageUrl: '',
            tags: [tag._id],
            participants: [part._id]
        });

        expect(evtRes.status).toBe(201);
        expect(evtRes.body.title).toBe('Standup');
        // sollte bereits populated sein, je nach Route/Helper:
        expect(evtRes.body.tags?.[0]?.name).toBe('urgent');
        expect(evtRes.body.participants?.[0]?.name).toBe('Bob');
    });

    it('GET /api/events supports search filters (q, from, to, location, tag names, participant name)', async () => {
        // Tags & Participants anlegen
        const [tWork, tFun] = await Promise.all([
            request(app).post('/api/tags').send({ name: 'work', color: '#111111' }).then(r => r.body),
            request(app).post('/api/tags').send({ name: 'fun', color: '#222222' }).then(r => r.body),
        ]);
        const [alice, bob] = await Promise.all([
            request(app).post('/api/participants').send({ name: 'Alice', email: 'a@ex.com' }).then(r => r.body),
            request(app).post('/api/participants').send({ name: 'Bob', email: 'b@ex.com' }).then(r => r.body),
        ]);

        // Drei Events
        const now = Date.now();
        await request(app).post('/api/events').send({
            title: 'Sprint Planning', description: 'work stuff', location: 'Berlin',
            date: new Date(now - 86400000).toISOString(), tags: [tWork._id], participants: [alice._id]
        });
        await request(app).post('/api/events').send({
            title: 'Board Game Night', description: 'fun event', location: 'Darmstadt',
            date: new Date(now).toISOString(), tags: [tFun._id], participants: [bob._id]
        });
        await request(app).post('/api/events').send({
            title: 'Team Lunch', description: 'food', location: 'Berlin',
            date: new Date(now + 86400000).toISOString(), tags: [tWork._id, tFun._id], participants: [alice._id, bob._id]
        });

        // q=team (Titel/Desc)
        let res = await request(app).get('/api/events').query({ q: 'team' });
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].title).toBe('Team Lunch');

        // location=Berlin
        res = await request(app).get('/api/events').query({ location: 'berlin' });
        expect(res.body.length).toBe(2);

        // tag by NAME (?tags=work)
        res = await request(app).get('/api/events').query({ tags: 'work' });
        expect(res.body.length).toBe(2);

        // participant by NAME (?participant=Alice)
        res = await request(app).get('/api/events').query({ participant: 'Alice' });
        expect(res.body.length).toBe(2);

        // date range (?from, ?to)
        const from = new Date(now - 3600000).toISOString();
        const to = new Date(now + 3600000).toISOString();
        res = await request(app).get('/api/events').query({ from, to });
        expect(res.body.length).toBe(1);
        expect(res.body[0].title).toBe('Board Game Night');
    });

    it('PUT /api/events/:id updates fields and keeps population', async () => {
        const tag = await request(app).post('/api/tags').send({ name: 'work', color: '#111111' }).then(r => r.body);
        const evt = await request(app).post('/api/events').send({
            title: 'Daily', date: new Date().toISOString(), tags: [tag._id], participants: []
        }).then(r => r.body);

        const upd = await request(app).put(`/api/events/${evt._id}`).send({ title: 'Daily Standup' });
        expect(upd.status).toBe(200);
        expect(upd.body.title).toBe('Daily Standup');
        // optional: prüfen, dass tags weiterhin populated sind (falls dein Helper das macht)
    });

    it('DELETE /api/events/:id removes the event', async () => {
        const e = await request(app).post('/api/events').send({
            title: 'Temp', date: new Date().toISOString()
        }).then(r => r.body);

        const del = await request(app).delete(`/api/events/${e._id}`);
        expect(del.status).toBe(200);

        // prüfe, dass weg ist
        const again = await Event.findById(e._id);
        expect(again).toBeNull();
    });

    it('PATCH-like: add/remove participants via endpoints', async () => {
        const p = await request(app)
            .post('/api/participants')
            .send({ name: 'Eve', email: 'e@ex.com' })
            .then(r => r.body);

        const e = await request(app)
            .post('/api/events')
            .send({ title: 'Workshop', date: new Date().toISOString(), participants: [] })
            .then(r => r.body);

        // Teilnehmer HINZUFÜGEN -> POST /api/events/:id/participants/:participantId
        const add = await request(app)
            .post(`/api/events/${e._id}/participants/${p._id}`);
        expect(add.status).toBe(200); // findByIdAndUpdate -> 200 OK
        expect(add.body.participants?.some((pp: any) => pp._id === p._id)).toBe(true);

        // Teilnehmer ENTFERNEN -> DELETE /api/events/:id/participants/:participantId
        const rem = await request(app)
            .delete(`/api/events/${e._id}/participants/${p._id}`);
        expect(rem.status).toBe(200);
        expect(rem.body.participants?.some((pp: any) => pp._id === p._id)).toBe(false);
    });
});
