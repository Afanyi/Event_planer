const express = require('express');
const request = require('supertest');

// ---- Mocked Mongoose models ----
const ParticipantMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
};

const EventMock = {
    find: jest.fn(),
};

jest.mock('../../../src/models/Participant', () => ({
    Participant: ParticipantMock,
}));

jest.mock('../../../src/models/Event', () => ({
    Event: EventMock,
}));

// ---- Router under test ----
import { participants as participantsRouter } from '../../../src/routes/participants';

function makeApp() {
    const app = express();
    app.use(express.json());
    app.use('/participants', participantsRouter);
    return app;
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /participants', () => {
    it('returns 200 and sorted participant list', async () => {
        const sorted = [{ _id: 'p1', name: 'Alice', email: 'a@x.y' }];

        const sortFn = jest.fn().mockResolvedValue(sorted);
        ParticipantMock.find.mockReturnValue({ sort: sortFn });

        const app = makeApp();
        const res = await request(app).get('/participants');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(sorted);
        expect(ParticipantMock.find).toHaveBeenCalledTimes(1);
        expect(sortFn).toHaveBeenCalledWith({ name: 1 });
    });
});

describe('POST /participants', () => {
    it('400 when name or email missing', async () => {
        const app = makeApp();
        const res = await request(app).post('/participants').send({ name: 'OnlyName' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(ParticipantMock.findOne).not.toHaveBeenCalled();
    });

    it('400 when duplicate name exists', async () => {
        ParticipantMock.findOne.mockResolvedValue({ _id: 'p1', name: 'Dup' });

        const app = makeApp();
        const res = await request(app)
            .post('/participants')
            .send({ name: 'Dup', email: 'dup@example.com' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Participant name already exists.');
        expect(ParticipantMock.findOne).toHaveBeenCalledWith({ name: 'Dup' });
        expect(ParticipantMock.create).not.toHaveBeenCalled();
    });

    it('201 on success and returns created participant', async () => {
        ParticipantMock.findOne.mockResolvedValue(null);
        const created = { _id: 'p2', name: 'New', email: 'new@example.com' };
        ParticipantMock.create.mockResolvedValue(created);

        const app = makeApp();
        const res = await request(app)
            .post('/participants')
            .send({ name: 'New', email: 'new@example.com' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(created);
        expect(ParticipantMock.findOne).toHaveBeenCalledWith({ name: 'New' });
        expect(ParticipantMock.create).toHaveBeenCalledWith({
            name: 'New',
            email: 'new@example.com',
        });
    });
});

describe('PUT /participants/:id', () => {
    it('200 and returns updated participant', async () => {
        const updated = { _id: 'p1', name: 'Renamed', email: 'r@example.com' };
        ParticipantMock.findByIdAndUpdate.mockResolvedValue(updated);

        const app = makeApp();
        const res = await request(app)
            .put('/participants/p1')
            .send({ name: 'Renamed', email: 'r@example.com' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(updated);
        expect(ParticipantMock.findByIdAndUpdate).toHaveBeenCalledWith(
            'p1',
            { name: 'Renamed', email: 'r@example.com' },
            { new: true }
        );
    });

    it('404 if participant not found', async () => {
        ParticipantMock.findByIdAndUpdate.mockResolvedValue(null);

        const app = makeApp();
        const res = await request(app)
            .put('/participants/unknown')
            .send({ name: 'X', email: 'x@example.com' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Participant not found');
    });
});

describe('DELETE /participants/:id', () => {
    it('200 and { ok: true } when deleted', async () => {
        ParticipantMock.findByIdAndDelete.mockResolvedValue({ _id: 'p1' });

        const app = makeApp();
        const res = await request(app).delete('/participants/p1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
        expect(ParticipantMock.findByIdAndDelete).toHaveBeenCalledWith('p1');
    });

    it('404 if participant not found', async () => {
        ParticipantMock.findByIdAndDelete.mockResolvedValue(null);

        const app = makeApp();
        const res = await request(app).delete('/participants/unknown');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Participant not found');
    });
});

describe('GET /participants/:id/events', () => {
    it('returns 200 and events for participant (populate called)', async () => {
        const populated = [{ _id: 'e1', title: 'Event 1', participants: ['p1'] }];

        const populateFn = jest.fn().mockResolvedValue(populated);
        EventMock.find.mockReturnValue({ populate: populateFn });

        const app = makeApp();
        const res = await request(app).get('/participants/p1/events');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(populated);
        expect(EventMock.find).toHaveBeenCalledWith({ participants: 'p1' });
        expect(populateFn).toHaveBeenCalledWith('tags participants');
    });
});
