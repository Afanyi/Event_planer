import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';
import { api } from '../../api';

// We'll mock the api() function and emulate a tiny in-memory backend.
jest.mock('../../api');

type Event = {
    _id: string;
    title: string;
    date: string;        // ISO string
    location: string;
    description?: string;
    imageUrl?: string;
    tags: { _id: string; name: string; color: string }[];
    participants: { _id: string; name: string; email: string }[];
};

const TAGS = [
    { _id: 't1', name: 'Work', color: '#111111' },
    { _id: 't2', name: 'Fun',  color: '#222222' }
];

const PARTICIPANTS = [
    { _id: 'p1', name: 'Alice', email: 'alice@example.com' },
    { _id: 'p2', name: 'Bob',   email: 'bob@example.com'   }
];

describe('App (integration)', () => {
    let EVENTS: Event[];

    beforeEach(() => {
        jest.clearAllMocks();

        // Fresh dataset for each test
        EVENTS = [
            {
                _id: 'e1',
                title: 'Existing Event',
                date: '2030-01-02T12:00', // future-ish date to avoid flakiness
                location: 'Berlin',
                description: 'desc',
                imageUrl: '',
                tags: [TAGS[0]],           // Work
                participants: [PARTICIPANTS[0]] // Alice
            }
        ];

        // Default mock: answer by URL
        (api as jest.Mock).mockImplementation(async (url: string, opts?: RequestInit) => {
            // create event
            if (url === '/events' && opts?.method === 'POST') {
                const body = JSON.parse(String(opts.body || '{}'));
                const newEvent: Event = {
                    _id: `e${EVENTS.length + 1}`,
                    title: body.title,
                    date: body.date,
                    location: body.location || '',
                    description: body.description || '',
                    imageUrl: body.imageUrl || '',
                    tags: (body.tags || []).map((id: string) => TAGS.find(t => t._id === id)!),
                    participants: (body.participants || []).map((pid: string) => PARTICIPANTS.find(p => p._id === pid)!)
                };
                EVENTS.push(newEvent);
                return { ok: true };
            }

            // list events (with filters in query string) – we don't need real filtering for this test,
            // but we assert the URL later. Just return current EVENTS.
            if (url.startsWith('/events?')) {
                return [...EVENTS];
            }

            if (url === '/tags') return TAGS;
            if (url === '/participants') return PARTICIPANTS;

            // event tag/participant attach/detach (not used here)
            if (url.includes('/tags/') || url.includes('/participants/')) return { ok: true };

            throw new Error('Unhandled API call: ' + url);
        });
    });

    it('loads initial data and shows header + counters', async () => {
        render(<App />);

        // Header
        expect(screen.getByText('📅 Events Planner')).toBeInTheDocument();

        // Initial loads (events, tags, participants)
        await waitFor(() => {
            // the badge elements render after events state is set
            expect(screen.getByText(/Past:/)).toBeInTheDocument();
            expect(screen.getByText(/Upcoming:/)).toBeInTheDocument();
            // existing event should appear
            expect(screen.getByText('Existing Event')).toBeInTheDocument();
        });

        // Ensure our API was called for all three lists
        const calledUrls = (api as jest.Mock).mock.calls.map((c) => c[0]);
        expect(calledUrls.some((u: string) => u.startsWith('/events?'))).toBe(true);
        expect(calledUrls).toContain('/tags');
        expect(calledUrls).toContain('/participants');
    });

    it('applies filters and calls /events? with correct query string', async () => {
        render(<App />);

        // Wait for initial fetches
        await waitFor(() => screen.getByText('Existing Event'));

        // Fill filters
        fireEvent.change(screen.getByPlaceholderText('Search title…'), { target: { value: 'meet' } });
        // dates in yyyy-mm-dd
        const from = '2030-01-01';
        const to   = '2030-12-31';
        // Select by role and name isn't trivial here; simpler with querySelector:
        const root = screen.getByText('📅 Events Planner').closest('div')!;
        const fromInput = root.querySelector('input[type="date"][value=""]') as HTMLInputElement
            || root.querySelectorAll('input[type="date"]')[0] as HTMLInputElement;
        const toInput   = root.querySelectorAll('input[type="date"]')[1] as HTMLInputElement;

        fireEvent.change(fromInput, { target: { value: from } });
        fireEvent.change(toInput,   { target: { value: to } });

        fireEvent.change(screen.getByPlaceholderText('Location…'),   { target: { value: 'Berlin' } });
        fireEvent.change(screen.getByPlaceholderText('Participant…'), { target: { value: 'Alice' } });
        fireEvent.change(screen.getByPlaceholderText('Tags…'),        { target: { value: 't1,t2' } });

        // Apply
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

        await waitFor(() => {
            // The most recent call to /events? should include all query params
            const calls = (api as jest.Mock).mock.calls
                .map((c) => c[0])
                .filter((u: string) => typeof u === 'string' && u.startsWith('/events?'));
            expect(calls.length).toBeGreaterThan(1);
            const last = String(calls[calls.length - 1]);

            expect(last).toContain('q=meet');
            expect(last).toContain(`from=${from}`);
            expect(last).toContain(`to=${to}`);
            expect(last).toContain('location=Berlin');
            expect(last).toContain('participant=Alice');
            expect(last).toContain('tags=t1%2Ct2'); // comma-encoded
        });
    });

    it('creates a new event via EventForm → reloads → shows the new event', async () => {
        render(<App />);

        // Wait initial render
        await waitFor(() => expect(screen.getByText('Existing Event')).toBeInTheDocument());

        // Get the EventForm's form node
        const createBtn = screen.getByRole('button', { name: 'Create' });
        const form = createBtn.closest('form') as HTMLFormElement;

        // Inputs strictly scoped to the EventForm
        const titleInput  = form.querySelector('input[name="title"]') as HTMLInputElement;
        const dateInput   = form.querySelector('input[name="date"]') as HTMLInputElement;
        const locationInp = form.querySelector('input[name="location"]') as HTMLInputElement;
        const imageUrlInp = form.querySelector('input[name="imageUrl"]') as HTMLInputElement;
        const descInput   = form.querySelector('textarea[name="description"]') as HTMLTextAreaElement;

        // Checkboxes INSIDE EventForm (by value)
        const tagWork    = form.querySelector('input[name="tags"][value="t1"]') as HTMLInputElement;
        const participantAlice = form.querySelector('input[name="parts"][value="p1"]') as HTMLInputElement;

        // Fill and submit
        fireEvent.change(titleInput,  { target: { value: 'Brand New Event' } });
        fireEvent.change(dateInput,   { target: { value: '2030-05-05T10:00' } });
        fireEvent.change(locationInp, { target: { value: 'Munich' } });
        fireEvent.change(imageUrlInp, { target: { value: '' } });
        fireEvent.change(descInput,   { target: { value: 'Some notes' } });

        fireEvent.click(tagWork);
        fireEvent.click(participantAlice);

        fireEvent.submit(form);

        // 1) Ensure POST /events happened
        await waitFor(() => {
            expect((api as jest.Mock).mock.calls.some(
                (c) => c[0] === '/events' && c[1]?.method === 'POST'
            )).toBe(true);
        });

        // 2) Ensure App.load() re-fetched /events? after POST
        await waitFor(() => {
            const calls = (api as jest.Mock).mock.calls.map((c) => c[0]);
            // At least two GETs to /events? (initial + after creation)
            expect(calls.filter((u: string) => typeof u === 'string' && u.startsWith('/events?')).length)
                .toBeGreaterThanOrEqual(2);
        });

        // 3) UI shows the new event
        await waitFor(() => expect(screen.getByText('Brand New Event')).toBeInTheDocument());

        // Verify payload of the POST
        const postCall = (api as jest.Mock).mock.calls.find(
            (c) => c[0] === '/events' && c[1]?.method === 'POST'
        );
        const payload = JSON.parse(String(postCall?.[1]?.body || '{}'));
        expect(payload).toMatchObject({
            title: 'Brand New Event',
            date: '2030-05-05T10:00',
            location: 'Munich',
            description: 'Some notes',
            imageUrl: '',
            tags: ['t1'],
            participants: ['p1'],
        });
    });

});
