import { api } from '../__helpers__/app';

describe('Participants API', () => {
    it('CRUD flow', async () => {
        // Create
        const create = await api().post('/api/participants').send({ name: 'Alice', email: 'alice@uni.de' });
        expect(create.status).toBe(201);
        const id = create.body._id;

        // Get
        const get = await api().get(`/api/participants/${id}`);
        expect(get.status).toBe(200);
        expect(get.body.name).toBe('Alice');

        // List
        const list = await api().get('/api/participants');
        expect(list.status).toBe(200);
        expect(list.body).toHaveLength(1);

        // Update
        const upd = await api().put(`/api/participants/${id}`).send({ name: 'Alice B.' });
        expect(upd.status).toBe(200);
        expect(upd.body.name).toBe('Alice B.');

        // Delete
        const del = await api().delete(`/api/participants/${id}`);
        expect(del.status).toBe(200);
        expect(del.body).toEqual({ ok: true });
    });

    it('requires name & email', async () => {
        const res = await api().post('/api/participants').send({ name: '' });
        expect(res.status).toBe(400);
    });
});
