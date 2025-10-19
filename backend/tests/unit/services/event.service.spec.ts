import { EventService } from '../../../src/services/event.service';

jest.mock('src/models/Event', () => ({
    Event: {
        find: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockReturnThis(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn().mockReturnThis(),
        findByIdAndDelete: jest.fn(),
    },
}));
jest.mock('src/models/Tag', () => ({
    Tag: {
        find: jest.fn().mockResolvedValue([]),
    },
}));
jest.mock('src/models/Participant', () => ({
    Participant: {
        find: jest.fn().mockResolvedValue([]),
    },
}));

// Pull typed refs for convenience
const { Event } = jest.requireMock('src/models/Event');
const { Tag } = jest.requireMock('src/models/Tag');
const { Participant } = jest.requireMock('src/models/Participant');

describe('EventService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('list() returns array, filters by q/from/to/location', async () => {
        (Event.find as any).mockReturnThis();
        (Event.populate as any).mockReturnThis();
        (Event.sort as any).mockReturnThis();
        (Event.lean as any).mockResolvedValue([{ _id: 'e1', title: 'Meetup' }]);

        const out = await EventService.list({
            q: 'meet',
            from: '2025-01-01',
            to: '2025-12-31',
            location: 'darmstadt',
        });

        expect(Event.find).toHaveBeenCalledTimes(1);
        expect(Event.sort).toHaveBeenCalledWith({ date: 1 });
        expect(Array.isArray(out)).toBe(true);
        expect(out[0].title).toBe('Meetup');
    });

    test('list() filters by tag id', async () => {
        (Event.find as any).mockReturnThis();
        (Event.populate as any).mockReturnThis();
        (Event.sort as any).mockReturnThis();
        (Event.lean as any).mockResolvedValue([{ _id: 'e2' }]);

        const out = await EventService.list({ tag: '6562a1c4e9e6f1f1f1f1f1f1' });
        expect(Event.find).toHaveBeenCalled();
        expect(out).toHaveLength(1);
    });

    test('list() filters by tags (names) using Tag subquery', async () => {
        (Tag.find as any).mockResolvedValue([{ _id: 't1' }, { _id: 't2' }]);
        (Event.find as any).mockReturnThis();
        (Event.populate as any).mockReturnThis();
        (Event.sort as any).mockReturnThis();
        (Event.lean as any).mockResolvedValue([{ _id: 'e3' }]);

        const out = await EventService.list({ tags: 'work, urgent' });
        expect(Tag.find).toHaveBeenCalled();
        expect(Event.find).toHaveBeenCalled();
        expect(out).toHaveLength(1);
    });

    test('get() returns event or throws 404', async () => {
        (Event.findById as any).mockReturnThis();
        (Event.populate as any).mockReturnThis();
        (Event.lean as any).mockResolvedValue({ _id: 'e1' });

        const ok = await EventService.get('6562a1c4e9e6f1f1f1f1f1f1');
        expect(ok._id).toBe('e1');

        (Event.lean as any).mockResolvedValue(null);
        await expect(EventService.get('6562a1c4e9e6f1f1f1f1f1f1')).rejects.toThrow('Event not found');
    });

    test('create() validates and returns populated doc', async () => {
        const populate = jest.fn().mockResolvedValue({ _id: 'e4', title: 'New' });
        (Event.create as any).mockResolvedValue({ populate });

        const res = await EventService.create({
            title: 'New',
            date: '2025-10-10T10:00:00Z',
            participants: [],
            tags: [],
        });

        expect(Event.create).toHaveBeenCalled();
        expect(res._id).toBe('e4');
    });

    test('update() maps ids and populates', async () => {
        (Event.findByIdAndUpdate as any).mockReturnValue({
            populate: jest.fn().mockResolvedValue({ _id: 'e5', title: 'Upd' }),
        });

        const res = await EventService.update('6562a1c4e9e6f1f1f1f1f1f1', {
            title: 'Upd',
            tags: ['6562a1c4e9e6f1f1f1f1f1f1'],
        });

        expect(Event.findByIdAndUpdate).toHaveBeenCalled();
        expect(res.title).toBe('Upd');
    });

    test('remove() returns ok or 404', async () => {
        (Event.findByIdAndDelete as any).mockResolvedValue({ _id: 'e1' });
        const good = await EventService.remove('6562a1c4e9e6f1f1f1f1f1f1');
        expect(good).toEqual({ ok: true });

        (Event.findByIdAndDelete as any).mockResolvedValue(null);
        await expect(EventService.remove('6562a1c4e9e6f1f1f1f1f1f1')).rejects.toThrow('Event not found');
    });
});
