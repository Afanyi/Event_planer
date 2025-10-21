import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventList from '../../components/EventList';
import { api } from '../../api';

jest.mock('../../api');
jest.mock('../../components/WeatherBadge', () => () => <div>Weather</div>);  // Mock WeatherBadge

const onChanged = jest.fn();

const baseEvent = {
    _id: 'e1',
    title: 'Team Meeting',
    date: '2025-10-15T12:00:00.000Z',
    location: 'Berlin',
    description: 'Weekly sync',
    imageUrl: '',
    tags: [{ _id: 't1', name: 'Work', color: '#111111' }],
    participants: [{ _id: 'p1', name: 'Alice', email: 'alice@example.com' }]
};

const allTags = [
    { _id: 't1', name: 'Work', color: '#111111' },
    { _id: 't2', name: 'Fun', color: '#222222' }
];

const allParticipants = [
    { _id: 'p1', name: 'Alice', email: 'alice@example.com' },
    { _id: 'p2', name: 'Bob',   email: 'bob@example.com' }
];

function renderComp(events = [baseEvent]) {
    return render(
        <EventList
            events={events as any}
            allTags={allTags as any}
            allParticipants={allParticipants as any}
            onChanged={onChanged}
        />
    );
}

describe('EventList (unit)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders empty state', () => {
        renderComp([]);
        expect(screen.getByText('📋 Events')).toBeInTheDocument();
        expect(screen.getByText('No events yet. Add one!')).toBeInTheDocument();
    });

    it('renders event with title and location', () => {
        renderComp();
        expect(screen.getByText('Team Meeting')).toBeInTheDocument();
        expect(screen.getByText('Berlin')).toBeInTheDocument();
    });

    it('canceling delete does not call api or onChanged', async () => {
        (window as any).confirm = jest.fn(() => false);
        renderComp();

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(window.confirm).toHaveBeenCalledWith('Delete event?');
        expect(api).not.toHaveBeenCalled();
        expect(onChanged).not.toHaveBeenCalled();
    });

    it('confirming delete calls api and onChanged', async () => {
        (window as any).confirm = jest.fn(() => true);
        (api as jest.Mock).mockResolvedValue({ ok: true });

        renderComp();

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => {
            expect(api).toHaveBeenCalledWith('/events/e1', { method: 'DELETE' });
            expect(onChanged).toHaveBeenCalledTimes(1);
        });
    });

    it('clicking an existing tag chip triggers removeTag', async () => {
        (api as jest.Mock).mockResolvedValue({ ok: true });

        renderComp();

        // The chip text includes "✖", we can select by title or text; title is set to "Remove tag"
        const tagChip = screen.getByTitle('Remove tag');
        fireEvent.click(tagChip);

        await waitFor(() => {
            expect(api).toHaveBeenCalledWith('/events/e1/tags/t1', { method: 'DELETE' });
            expect(onChanged).toHaveBeenCalledTimes(1);
        });
    });


    it('clicking an existing participant badge triggers removePart', async () => {
        (api as jest.Mock).mockResolvedValue({ ok: true });

        renderComp();

        // Badge has title "Remove participant"
        const badge = screen.getByTitle('Remove participant');
        fireEvent.click(badge);

        await waitFor(() => {
            expect(api).toHaveBeenCalledWith('/events/e1/participants/p1', { method: 'DELETE' });
            expect(onChanged).toHaveBeenCalledTimes(1);
        });
    });

    it('adding a participant via select calls api and resets select', async () => {
        (api as jest.Mock).mockResolvedValue({ ok: true });

        renderComp();

        // Find the participant select (the second combobox on the card)
        const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
        const partSelect = selects[1]; // first is tags, second is participants

        fireEvent.change(partSelect, { target: { value: 'p2' } });

        await waitFor(() => {
            expect(api).toHaveBeenCalledWith('/events/e1/participants/p2', { method: 'POST' });
            expect(onChanged).toHaveBeenCalledTimes(1);
        });

        expect(partSelect.selectedIndex).toBe(0);
    });
});
