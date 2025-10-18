import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventForm from '../../components/EventForm';
import { api } from '../../api';

jest.mock('../../api');

const tags = [
    { _id: 't1', name: 'Work', color: '#111111' },
    { _id: 't2', name: 'Fun',  color: '#222222' },
];

const participants = [
    { _id: 'p1', name: 'Alice', email: 'alice@example.com' },
    { _id: 'p2', name: 'Bob',   email: 'bob@example.com'   },
];

describe('EventForm (unit)', () => {
    const onCreated = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (api as jest.Mock).mockResolvedValue({ ok: true });
    });

    function renderForm() {
        render(<EventForm tags={tags as any} participants={participants as any} onCreated={onCreated} />);
        const submitBtn = screen.getByRole('button', { name: 'Create' });
        const form = submitBtn.closest('form') as HTMLFormElement;
        return { form, submitBtn };
    }

    it('submits with all fields, tags and participants, calls api and resets form', async () => {
        const { form } = renderForm();

        // Query all inputs directly by name on the <form> (most reliable)
        const titleInput  = form.querySelector('input[name="title"]') as HTMLInputElement;
        const dateInput   = form.querySelector('input[name="date"]') as HTMLInputElement;
        const locationInp = form.querySelector('input[name="location"]') as HTMLInputElement;
        const imageUrlInp = form.querySelector('input[name="imageUrl"]') as HTMLInputElement;
        const descInput   = form.querySelector('textarea[name="description"]') as HTMLTextAreaElement;

        const tagWork   = screen.getByLabelText(/Work/i) as HTMLInputElement;
        const tagFun    = screen.getByLabelText(/Fun/i)  as HTMLInputElement;
        const partAlice = screen.getByLabelText(/Alice/i) as HTMLInputElement;
        const partBob   = screen.getByLabelText(/Bob/i)   as HTMLInputElement;

        fireEvent.change(titleInput,  { target: { value: 'Project Kickoff' } });
        fireEvent.change(dateInput,   { target: { value: '2025-10-20T12:00' } });
        fireEvent.change(locationInp, { target: { value: 'Berlin' } });
        fireEvent.change(imageUrlInp, { target: { value: 'https://example.com/pic.png' } });
        fireEvent.change(descInput,   { target: { value: 'Initial meeting' } });

        fireEvent.click(tagWork);
        fireEvent.click(tagFun);
        fireEvent.click(partAlice);
        fireEvent.click(partBob);

        // IMPORTANT: submit the form (so e.currentTarget === form and reset() works)
        fireEvent.submit(form);

        await waitFor(() => expect(api).toHaveBeenCalledTimes(1));

        const [calledUrl, calledOpts] = (api as jest.Mock).mock.calls[0];
        expect(calledUrl).toBe('/events');

        const sent = JSON.parse(calledOpts.body);
        expect(sent).toEqual({
            title: 'Project Kickoff',
            description: 'Initial meeting',
            location: 'Berlin',
            date: '2025-10-20T12:00',
            imageUrl: 'https://example.com/pic.png',
            tags: ['t1', 't2'],
            participants: ['p1', 'p2'],
        });

        expect(onCreated).toHaveBeenCalled();

        // Reset checks
        expect(titleInput.value).toBe('');
        expect(dateInput.value).toBe('');
        expect(locationInp.value).toBe('');
        expect(imageUrlInp.value).toBe('');
        expect(descInput.value).toBe('');
        expect(tagWork.checked).toBe(false);
        expect(tagFun.checked).toBe(false);
        expect(partAlice.checked).toBe(false);
        expect(partBob.checked).toBe(false);
    });

    it('submits with empty imageUrl → imageUrl becomes empty string', async () => {
        const { form } = renderForm();

        const titleInput  = form.querySelector('input[name="title"]') as HTMLInputElement;
        const dateInput   = form.querySelector('input[name="date"]') as HTMLInputElement;
        const locationInp = form.querySelector('input[name="location"]') as HTMLInputElement;
        const descInput   = form.querySelector('textarea[name="description"]') as HTMLTextAreaElement;

        fireEvent.change(titleInput,  { target: { value: 'Standup' } });
        fireEvent.change(dateInput,   { target: { value: '2025-10-21T09:00' } });
        fireEvent.change(locationInp, { target: { value: 'Remote' } });
        fireEvent.change(descInput,   { target: { value: 'Daily sync' } });

        fireEvent.click(screen.getByLabelText(/Work/i));   // t1
        fireEvent.click(screen.getByLabelText(/Alice/i));  // p1

        fireEvent.submit(form);

        await waitFor(() => expect(api).toHaveBeenCalledTimes(1));

        const [, calledOpts] = (api as jest.Mock).mock.calls[0];
        const sent = JSON.parse(calledOpts.body);

        expect(sent).toMatchObject({
            title: 'Standup',
            date: '2025-10-21T09:00',
            location: 'Remote',
            description: 'Daily sync',
            imageUrl: '',           // <- empty string is expected
            tags: ['t1'],
            participants: ['p1'],
        });

        expect(onCreated).toHaveBeenCalled();
    });
});
