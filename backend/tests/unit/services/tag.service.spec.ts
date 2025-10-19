import { TagService } from '../../../src/services/tag.service';

jest.mock('src/models/Tag', () => ({
    Tag: {
        find: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
    },
}));

const { Tag } = jest.requireMock('src/models/Tag');

describe('TagService', () => {
    beforeEach(() => jest.clearAllMocks());

    test('list() returns array', async () => {
        (Tag.find as any).mockResolvedValue([{ _id: 't1', name: 'work' }]);
        const res = await TagService.list();
        expect(res).toHaveLength(1);
    });

    test('get() returns tag or 404', async () => {
        (Tag.findById as any).mockResolvedValue({ _id: 't1', name: 'work' });
        const ok = await TagService.get('6562a1c4e9e6f1f1f1f1f1f1');
        expect(ok.name).toBe('work');

        (Tag.findById as any).mockResolvedValue(null);
        await expect(TagService.get('6562a1c4e9e6f1f1f1f1f1f1')).rejects.toThrow('Tag not found');
    });

    test('create() validates and enforces uniqueness', async () => {
        (Tag.findOne as any).mockResolvedValue(null);
        (Tag.create as any).mockResolvedValue({ _id: 't2', name: 'urgent' });
        const created = await TagService.create({ name: 'urgent', color: '#f00' });
        expect(created._id).toBe('t2');

        (Tag.findOne as any).mockResolvedValue({ _id: 'x' });
        await expect(TagService.create({ name: 'urgent', color: '#f00' })).rejects.toThrow('Tag name already exists.');
    });

    test('update() returns updated or 404', async () => {
        (Tag.findByIdAndUpdate as any).mockResolvedValue({ _id: 't3', name: 'edited' });
        const ok = await TagService.update('6562a1c4e9e6f1f1f1f1f1f1', { name: 'edited' });
        expect(ok.name).toBe('edited');

        (Tag.findByIdAndUpdate as any).mockResolvedValue(null);
        await expect(TagService.update('6562a1c4e9e6f1f1f1f1f1f1', { name: 'edited' })).rejects.toThrow('Tag not found');
    });

    test('remove() returns ok or 404', async () => {
        (Tag.findByIdAndDelete as any).mockResolvedValue({ _id: 't9' });
        const ok = await TagService.remove('6562a1c4e9e6f1f1f1f1f1f1');
        expect(ok).toEqual({ ok: true });

        (Tag.findByIdAndDelete as any).mockResolvedValue(null);
        await expect(TagService.remove('6562a1c4e9e6f1f1f1f1f1f1')).rejects.toThrow('Tag not found');
    });
});
