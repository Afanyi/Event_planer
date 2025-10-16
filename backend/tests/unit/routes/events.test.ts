const express = require('express');
const request = require('supertest');

// ---------- Mongoose model mocks ----------
const EventMock = {
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
};

const ParticipantMock = {
    find: jest.fn(),
};

const TagMock = {
    find: jest.fn(),
};

jest.mock('../../../src/models/Event', () => ({ Event: EventMock }));
jest.mock('../../../src/models/Participant', () => ({ Participant: ParticipantMock }));
jest.mock('../../../src/models/Tag', () => ({ Tag: TagMock }));

// ---------- Router under test ----------
import { events as eventsRouter } from '../../../src/routes/events';

function makeApp() {
    const app = express();
    app.use(express.json());
    app.use('/events', eventsRouter);
    return app;
}

// ---------- helpers for chainable queries ----------
function chainFindResult(data: any[]) {
    const sort = jest.fn().mockResolvedValue(data);
    const populate = jest.fn().mockReturnValue({ sort });
    return { populate, sort };
}

function selectResult(docs: any[]) {
    const select = jest.fn().mockResolvedValue(docs);
    return { select };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /events (basic filters)', () => {
    it('applies q (title regex), date range, location and sorts by date ASC', async () => {
        const data = [{ _id: 'e1', title: 'JS Meetup' }];
        const chained = chainFindResult(data);
        EventMock.find.mockReturnValue(chained);

        const app = makeApp();
        const res = await request(app).get(
            '/events?q=meet&from=2025-01-01&to=2025-12-31&location=berlin'
        );

        expect(res.status).toBe(200);
        expect(res.body).toEqual(data);
        expect(EventMock.find).toHaveBeenCalledWith({
            title: { $regex: 'meet', $options: 'i' },
            date: { $gte: new Date('2025-01-01'), $lte: new Date('2025-12-31') },
            location: { $regex: 'berlin', $options: 'i' },
        });
        expect(chained.populate).toHaveBeenCalledWith('tags participants');
        expect(chained.sort).toHaveBeenCalledWith({ date: 1 });
    });
});

describe('GET /events (participant filter)', () => {
    it('participant as 24-hex id is used directly (no lookup)', async () => {
        const data = [{ _id: 'e1' }];
        const chained = chainFindResult(data);
        EventMock.find.mockReturnValue(chained);

        const app = makeApp();
        const res = await request(app).get('/events?participant=0123456789abcdef01234567');

        expect(res.status).toBe(200);
        expect(EventMock.find).toHaveBeenCalledWith({
            participants: { $in: ['0123456789abcdef01234567'] },
        });
        expect(ParticipantMock.find).not.toHaveBeenCalled();
    });

    it('participant as name/email triggers lookup; empty results return [] early', async () => {
        ParticipantMock.find.mockReturnValue(selectResult([])); // no ids found

        const app = makeApp();
        const res = await request(app).get('/events?participant=alice');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]); // early return
        expect(ParticipantMock.find).toHaveBeenCalledWith({
            $or: [
                { name: { $regex: 'alice', $options: 'i' } },
                { email: { $regex: 'alice', $options: 'i' } },
            ],
        });
        expect(EventMock.find).not.toHaveBeenCalled(); // because we short-circuit
    });

    it('participant name/email -> ids -> used in filter', async () => {
        ParticipantMock.find.mockReturnValue(selectResult([{ _id: 'p1' }, { _id: 'p2' }]));
        const data = [{ _id: 'e1' }];
        const chained = chainFindResult(data);
        EventMock.find.mockReturnValue(chained);

        const app = makeApp();
        const res = await request(app).get('/events?participant=ali');

        expect(res.status).toBe(200);
        expect(EventMock.find).toHaveBeenCalledWith({
            participants: { $in: ['p1', 'p2'] },
        });
    });
});

describe('GET /events (tags by name)', () => {
    it('tags=work,urgent resolves names -> ids and OR-filters; empty tag list returns [] early', async () => {
        // first: no tag names matched -> [] early
        TagMock.find.mockReturnValueOnce(selectResult([]));
        let app = makeApp();
        let res = await request(app).get('/events?tags=work,urgent');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
        expect(EventMock.find).not.toHaveBeenCalled();

        // second: some matched -> filter by ids with $in
        TagMock.find.mockReturnValueOnce(selectResult([{ _id: 't1' }, { _id: 't2' }]));
        const data = [{ _id: 'e1' }];
        const chained = chainFindResult(data);
        EventMock.find.mockReturnValueOnce(chained);

        app = makeApp();
        res = await request(app).get('/events?tags=work,urgent');
        expect(res.status).toBe(200);
        expect(EventMock.find).toHaveBeenCalledWith({ tags: { $in: ['t1', 't2'] } });
        expect(chained.populate).toHaveBeenCalledWith('tags participants');
        expect(chained.sort).toHaveBeenCalledWith({ date: 1 });
    });
});

describe('GET /events/by-tag/:tagId & /events/by-participant/:pid', () => {
    it('by-tag returns events populated & sorted', async () => {
        const data = [{ _id: 'e1' }];
        const chained = chainFindResult(data);
        EventMock.find.mockReturnValueOnce(chained);

        const app = makeApp();
        const res = await request(app).get('/events/by-tag/t42');

        expect(res.status).toBe(200);
        expect(EventMock.find).toHaveBeenCalledWith({ tags: 't42' });
        expect(chained.populate).toHaveBeenCalledWith('tags participants');
        expect(chained.sort).toHaveBeenCalledWith({ date: 1 });
    });

    it('by-participant returns events populated & sorted', async () => {
        const data = [{ _id: 'e1' }];
        const chained = chainFindResult(data);
        EventMock.find.mockReturnValueOnce(chained);

        const app = makeApp();
        const res = await request(app).get('/events/by-participant/p9');

        expect(res.status).toBe(200);
        expect(EventMock.find).toHaveBeenCalledWith({ participants: 'p9' });
        expect(chained.populate).toHaveBeenCalledWith('tags participants');
        expect(chained.sort).toHaveBeenCalledWith({ date: 1 });
    });
});

describe('POST /events', () => {
    it('400 when title or date missing', async () => {
        const app = makeApp();
        const res = await request(app).post('/events').send({ title: '' });
        expect(res.status).toBe(400);
    });

    it('400 when invalid date', async () => {
        const app = makeApp();
        const res = await request(app).post('/events').send({ title: 't', date: 'bad-date' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'invalid date');
    });

    it('201 create + populate returns created event', async () => {
        const populated = { _id: 'e1', title: 't' };
        const populate = jest.fn().mockResolvedValue(populated);
        EventMock.create.mockResolvedValue({ _id: 'e1', populate });

        const app = makeApp();
        const res = await request(app).post('/events').send({ title: 't', date: '2025-01-01' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(populated);
        expect(EventMock.create).toHaveBeenCalledWith({
            title: 't',
            description: '',
            location: '',
            date: new Date('2025-01-01'),
            imageUrl: '',
            tags: [],
            participants: [],
        });
        expect(populate).toHaveBeenCalledWith('tags participants');
    });
});

describe('PUT /events/:id', () => {
    it('400 on invalid date', async () => {
        const app = makeApp();
        const res = await request(app).put('/events/e1').send({ date: 'invalid' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'invalid date');
    });

    it('404 when event not found', async () => {
        EventMock.findByIdAndUpdate.mockResolvedValueOnce(null);

        const app = makeApp();
        const res = await request(app).put('/events/missing').send({ title: 'x' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Event not found');
    });

    it('200 updates and populates', async () => {
        const populated = { _id: 'e1', title: 'x' };
        const populate = jest.fn().mockResolvedValue(populated);
        // ts: the router chains .populate() on the query result
        (EventMock.findByIdAndUpdate as any).mockReturnValueOnce({ populate });

        const app = makeApp();
        const res = await request(app).put('/events/e1').send({ title: 'x' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(populated);
        expect(EventMock.findByIdAndUpdate).toHaveBeenCalledWith('e1', { title: 'x' }, { new: true });
        expect(populate).toHaveBeenCalledWith('tags participants');
    });
});

describe('DELETE /events/:id', () => {
    it('200 {ok:true} when deleted', async () => {
        EventMock.findByIdAndDelete.mockResolvedValueOnce({ _id: 'e1' });

        const app = makeApp();
        const res = await request(app).delete('/events/e1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });

    it('404 when not found', async () => {
        EventMock.findByIdAndDelete.mockResolvedValueOnce(null);

        const app = makeApp();
        const res = await request(app).delete('/events/e404');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Event not found');
    });
});

describe('Tag/Participant membership endpoints', () => {
    it('POST /events/:id/tags/:tagId adds tag (populate)', async () => {
        const populated = { _id: 'e1', tags: ['t1'] };
        const populate = jest.fn().mockResolvedValue(populated);
        (EventMock.findByIdAndUpdate as any).mockReturnValueOnce({ populate });

        const app = makeApp();
        const res = await request(app).post('/events/e1/tags/t1');

        expect(res.status).toBe(200);
        expect(EventMock.findByIdAndUpdate).toHaveBeenCalledWith(
            'e1',
            { $addToSet: { tags: 't1' } },
            { new: true }
        );
        expect(res.body).toEqual(populated);
    });

    it('DELETE /events/:id/tags/:tagId removes tag (populate)', async () => {
        const populated = { _id: 'e1', tags: [] };
        const populate = jest.fn().mockResolvedValue(populated);
        (EventMock.findByIdAndUpdate as any).mockReturnValueOnce({ populate });

        const app = makeApp();
        const res = await request(app).delete('/events/e1/tags/t1');

        expect(res.status).toBe(200);
        expect(EventMock.findByIdAndUpdate).toHaveBeenCalledWith(
            'e1',
            { $pull: { tags: 't1' } },
            { new: true }
        );
        expect(res.body).toEqual(populated);
    });

    it('POST /events/:id/participants/:pid adds participant (populate)', async () => {
        const populated = { _id: 'e1', participants: ['p1'] };
        const populate = jest.fn().mockResolvedValue(populated);
        (EventMock.findByIdAndUpdate as any).mockReturnValueOnce({ populate });

        const app = makeApp();
        const res = await request(app).post('/events/e1/participants/p1');

        expect(res.status).toBe(200);
        expect(EventMock.findByIdAndUpdate).toHaveBeenCalledWith(
            'e1',
            { $addToSet: { participants: 'p1' } },
            { new: true }
        );
        expect(res.body).toEqual(populated);
    });

    it('DELETE /events/:id/participants/:pid removes participant (populate)', async () => {
        const populated = { _id: 'e1', participants: [] };
        const populate = jest.fn().mockResolvedValue(populated);
        (EventMock.findByIdAndUpdate as any).mockReturnValueOnce({ populate });

        const app = makeApp();
        const res = await request(app).delete('/events/e1/participants/p1');

        expect(res.status).toBe(200);
        expect(EventMock.findByIdAndUpdate).toHaveBeenCalledWith(
            'e1',
            { $pull: { participants: 'p1' } },
            { new: true }
        );
        expect(res.body).toEqual(populated);
    });

    it('returns 404 when membership update target event not found', async () => {
        (EventMock.findByIdAndUpdate as any).mockResolvedValueOnce(null);

        const app = makeApp();
        const res = await request(app).post('/events/missing/tags/t1');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Event not found');
    });
});
