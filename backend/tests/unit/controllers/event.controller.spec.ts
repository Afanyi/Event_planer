import { EventController } from '../../../src/controllers/event.controller';
import { mockReq, mockRes, expectJson } from '../../__helpers__/express';

jest.mock('src/services/event.service', () => ({
    EventService: {
        list: jest.fn(),
        get: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        addTag: jest.fn(),
        removeTag: jest.fn(),
        addParticipant: jest.fn(),
        removeParticipant: jest.fn(),
    },
}));
const { EventService } = jest.requireMock('src/services/event.service');

describe('EventController', () => {
    beforeEach(() => jest.clearAllMocks());

    test('list -> 200 with payload', async () => {
        EventService.list.mockResolvedValue([{ _id: 'e1' }]);
        const req = mockReq({}, {}, { q: 'dev' });
        const res = mockRes();
        await EventController.list(req as any, res as any);
        expect(EventService.list).toHaveBeenCalledWith({ q: 'dev', from: undefined, to: undefined, tag: undefined, tags: undefined, location: undefined, participant: undefined });
        expect(res.json).toHaveBeenCalledWith([{ _id: 'e1' }]);
    });

    test('get -> 200', async () => {
        EventService.get.mockResolvedValue({ _id: 'e1' });
        const req = mockReq({ id: 'e1' });
        const res = mockRes();
        await EventController.get(req as any, res as any);
        expect(EventService.get).toHaveBeenCalledWith('e1');
        expectJson(res, 200);
    });

    test('create -> 201', async () => {
        EventService.create.mockResolvedValue({ _id: 'e2' });
        const req = mockReq({}, { title: 'New', date: '2025-10-10T10:00:00Z' });
        const res = mockRes();
        await EventController.create(req as any, res as any);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ _id: 'e2' });
    });

    test('update -> 200', async () => {
        EventService.update.mockResolvedValue({ _id: 'e3', title: 'Upd' });
        const req = mockReq({ id: 'e3' }, { title: 'Upd' });
        const res = mockRes();
        await EventController.update(req as any, res as any);
        expect(EventService.update).toHaveBeenCalledWith('e3', { title: 'Upd' });
        expectJson(res);
    });

    test('remove -> 200', async () => {
        EventService.remove.mockResolvedValue({ ok: true });
        const req = mockReq({ id: 'e4' });
        const res = mockRes();
        await EventController.remove(req as any, res as any);
        expect(EventService.remove).toHaveBeenCalledWith('e4');
        expectJson(res);
    });

    test('relation routes', async () => {
        EventService.addTag.mockResolvedValue({ _id: 'e1' });
        await EventController.addTag(mockReq({ id: 'e1', tagId: 't1' }) as any, mockRes() as any);

        EventService.removeTag.mockResolvedValue({ _id: 'e1' });
        await EventController.removeTag(mockReq({ id: 'e1', tagId: 't1' }) as any, mockRes() as any);

        EventService.addParticipant.mockResolvedValue({ _id: 'e1' });
        await EventController.addParticipant(mockReq({ id: 'e1', participantId: 'p1' }) as any, mockRes() as any);

        EventService.removeParticipant.mockResolvedValue({ _id: 'e1' });
        await EventController.removeParticipant(mockReq({ id: 'e1', participantId: 'p1' }) as any, mockRes() as any);

        expect(EventService.addTag).toHaveBeenCalledWith('e1', 't1');
        expect(EventService.removeTag).toHaveBeenCalledWith('e1', 't1');
        expect(EventService.addParticipant).toHaveBeenCalledWith('e1', 'p1');
        expect(EventService.removeParticipant).toHaveBeenCalledWith('e1', 'p1');
    });
});
