//import express from 'express';
//import request from 'supertest';
const express = require('express');
const request = require('supertest');


// ---- Mocks for Mongoose models ----
const TagMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
};

const EventMock = {
    find: jest.fn(),
};

jest.mock('../../../src/models/Tag', () => ({
    Tag: TagMock,
}));

jest.mock('../../../src/models/Event', () => ({
    Event: EventMock,
}));

// ---- Router under test ----
import { tags as tagsRouter } from '../../../src/routes/tags';


function makeApp() {
    const app = express();
    app.use(express.json());
    app.use('/tags', tagsRouter);
    return app;
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /tags', () => {
    it('returns 200 and sorted tag list', async () => {
        const sorted = [{ _id: 't1', name: 'Alpha', color: '#111' }];

        const sortFn = jest.fn().mockResolvedValue(sorted);
        TagMock.find.mockReturnValue({ sort: sortFn });

        const app = makeApp();
        const res = await request(app).get('/tags');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(sorted);

        expect(TagMock.find).toHaveBeenCalledTimes(1);
        expect(sortFn).toHaveBeenCalledWith({ name: 1 });
    });
});

describe('POST /tags', () => {
    it('400 if name or color missing', async () => {
        const app = makeApp();
        const res = await request(app).post('/tags').send({ name: 'OnlyName' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(TagMock.findOne).not.toHaveBeenCalled();
    });

    it('400 if duplicate name', async () => {
        TagMock.findOne.mockResolvedValue({ _id: 't1', name: 'Dup' });

        const app = makeApp();
        const res = await request(app).post('/tags').send({ name: 'Dup', color: '#abc' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Tag name already exists.');
        expect(TagMock.findOne).toHaveBeenCalledWith({ name: 'Dup' });
        expect(TagMock.create).not.toHaveBeenCalled();
    });

    it('201 on success and returns created tag', async () => {
        TagMock.findOne.mockResolvedValue(null);
        const created = { _id: 't2', name: 'New', color: '#fff' };
        TagMock.create.mockResolvedValue(created);

        const app = makeApp();
        const res = await request(app).post('/tags').send({ name: 'New', color: '#fff' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(created);
        expect(TagMock.findOne).toHaveBeenCalledWith({ name: 'New' });
        expect(TagMock.create).toHaveBeenCalledWith({ name: 'New', color: '#fff' });
    });
});

describe('PUT /tags/:id', () => {
    it('200 and returns updated tag', async () => {
        const updated = { _id: 't1', name: 'Renamed', color: '#000' };
        TagMock.findByIdAndUpdate.mockResolvedValue(updated);

        const app = makeApp();
        const res = await request(app)
            .put('/tags/t1')
            .send({ name: 'Renamed', color: '#000' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(updated);
        expect(TagMock.findByIdAndUpdate).toHaveBeenCalledWith(
            't1',
            { name: 'Renamed', color: '#000' },
            { new: true }
        );
    });

    it('404 if tag not found', async () => {
        TagMock.findByIdAndUpdate.mockResolvedValue(null);

        const app = makeApp();
        const res = await request(app).put('/tags/unknown').send({ name: 'X', color: '#123' });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Tag not found');
    });
});

describe('DELETE /tags/:id', () => {
    it('200 and { ok: true } when deleted', async () => {
        TagMock.findByIdAndDelete.mockResolvedValue({ _id: 't1' });

        const app = makeApp();
        const res = await request(app).delete('/tags/t1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
        expect(TagMock.findByIdAndDelete).toHaveBeenCalledWith('t1');
    });

    it('404 if tag not found', async () => {
        TagMock.findByIdAndDelete.mockResolvedValue(null);

        const app = makeApp();
        const res = await request(app).delete('/tags/unknown');

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Tag not found');
    });
});

describe('GET /tags/:id/events', () => {
    it('returns 200 and events for tag (populate called)', async () => {
        const populated = [{ _id: 'e1', title: 'Event 1', tags: ['t1'] }];

        const populateFn = jest.fn().mockResolvedValue(populated);
        EventMock.find.mockReturnValue({ populate: populateFn });

        const app = makeApp();
        const res = await request(app).get('/tags/t1/events');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(populated);

        expect(EventMock.find).toHaveBeenCalledWith({ tags: 't1' });
        expect(populateFn).toHaveBeenCalledWith('tags participants');
    });
});
