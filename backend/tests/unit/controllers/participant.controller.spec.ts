import { ParticipantController } from '../../../src/controllers/participant.controller';
import { mockReq, mockRes } from '../../__helpers__/express';

jest.mock('src/services/participant.service', () => ({
    ParticipantService: {
        list: jest.fn(),
        get: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    },
}));
const { ParticipantService } = jest.requireMock('src/services/participant.service');

describe('ParticipantController', () => {
    beforeEach(() => jest.clearAllMocks());

    test('list -> 200', async () => {
        ParticipantService.list.mockResolvedValue([{ _id: 'p1' }]);
        const res = mockRes();
        await ParticipantController.list({} as any, res as any);
        expect(res.json).toHaveBeenCalledWith([{ _id: 'p1' }]);
    });

    test('get -> 200', async () => {
        ParticipantService.get.mockResolvedValue({ _id: 'p2' });
        const res = mockRes();
        await ParticipantController.get({ params: { id: 'p2' } } as any, res as any);
        expect(ParticipantService.get).toHaveBeenCalledWith('p2');
    });

    test('create -> 201', async () => {
        ParticipantService.create.mockResolvedValue({ _id: 'p3' });
        const res = mockRes();
        await ParticipantController.create({ body: { name: 'Sam', email: 's@x.io' } } as any, res as any);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ _id: 'p3' });
    });

    test('update -> 200', async () => {
        ParticipantService.update.mockResolvedValue({ _id: 'p4', name: 'Neo' });
        const res = mockRes();
        await ParticipantController.update({ params: { id: 'p4' }, body: { name: 'Neo' } } as any, res as any);
        expect(ParticipantService.update).toHaveBeenCalledWith('p4', { name: 'Neo' });
    });

    test('remove -> 200', async () => {
        ParticipantService.remove.mockResolvedValue({ ok: true });
        const res = mockRes();
        await ParticipantController.remove({ params: { id: 'p5' } } as any, res as any);
        expect(ParticipantService.remove).toHaveBeenCalledWith('p5');
    });
});
