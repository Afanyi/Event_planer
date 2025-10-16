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
        return render(
            <EventForm
                tags={tags as any}
                participants={participants as any}
                onCreated={onCreated}
            />
        );
    }

    it('submits with all fields, tags and participants, calls api and resets form', async () => {
        renderForm();

        const titleInput = screen.getByPlaceholderText('Title') as HTMLInputElement;
        const dateInput  = screen.getByRole('textbox', { name: '' }) as HTMLInputElement
            || (screen.getByDisplayValue('') as HTMLInputElement); // fallback, depends on JSDOM
        // robust: direkt über name-Attribut holen
        const dateByName = screen.getByDisplayValue('', { exact: false }) as HTMLInputElement
            || (screen.getByPlaceholderText('Title') as HTMLInputElement); // dummy fallback
        // Besser: querySelector – aber Testing Library first:
        const dateEl = screen.getByDisplayValue('', { exact: false }) as HTMLInputElement
            || (document.querySelector('input[name="date"]') as HTMLInputElement);

        const locationInput = screen.getByPlaceholderText('Location') as HTMLInputElement;
        const imageUrlInput = screen.getByPlaceholderText('Image URL') as HTMLInputElement;
        const descInput = screen.getByPlaceholderText('Description') as HTMLTextAreaElement;

        // Checkboxen per Label-Text (enthält Name)
        const tagWork = screen.getByLabelText(/Work/i) as HTMLInputElement;
        const tagFun  = screen.getByLabelText(/Fun/i) as HTMLInputElement;
        const partAlice = screen.getByLabelText(/Alice/i) as HTMLInputElement;
        const partBob   = screen.getByLabelText(/Bob/i) as HTMLInputElement;

        // Formular ausfüllen
        fireEvent.change(titleInput, { target: { value: 'Project Kickoff' } });
        // datetime-local akzeptiert z.B. "2025-10-20T12:00"
        fireEvent.change(dateEl, { target: { value: '2025-10-20T12:00' } });
        fireEvent.change(locationInput, { target: { value: 'Berlin' } });
        fireEvent.change(imageUrlInput, { target: { value: 'https://example.com/pic.png' } });
        fireEvent.change(descInput, { target: { value: 'Initial meeting' } });

        // Tags/Teilnehmer wählen
        fireEvent.click(tagWork);
        fireEvent.click(tagFun);
        fireEvent.click(partAlice);
        fireEvent.click(partBob);

        // Absenden
        const submitBtn = screen.getByRole('button', { name: 'Create' });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(api).toHaveBeenCalledTimes(1);
        });

        // Payload prüfen
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

        // onCreated aufgerufen
        expect(onCreated).toHaveBeenCalled();

        // Formular wurde zurückgesetzt
        expect(titleInput.value).toBe('');
        expect(locationInput.value).toBe('');
        expect(imageUrlInput.value).toBe('');
        expect(descInput.value).toBe('');
        expect(tagWork.checked).toBe(false);
        expect(tagFun.checked).toBe(false);
        expect(partAlice.checked).toBe(false);
        expect(partBob.checked).toBe(false);
    });

    it('submits with empty imageUrl → imageUrl becomes empty string', async () => {
        renderForm();

        const titleInput = screen.getByPlaceholderText('Title') as HTMLInputElement;
        const dateEl = document.querySelector('input[name="date"]') as HTMLInputElement;
        const locationInput = screen.getByPlaceholderText('Location') as HTMLInputElement;
        const descInput = screen.getByPlaceholderText('Description') as HTMLTextAreaElement;

        // Nur Pflichtfelder + ein Tag/Teilnehmer
        fireEvent.change(titleInput, { target: { value: 'Standup' } });
        fireEvent.change(dateEl, { target: { value: '2025-10-21T09:00' } });
        fireEvent.change(locationInput, { target: { value: 'Remote' } });
        fireEvent.change(descInput, { target: { value: 'Daily sync' } });

        fireEvent.click(screen.getByLabelText(/Work/i));   // t1
        fireEvent.click(screen.getByLabelText(/Alice/i));  // p1

        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        await waitFor(() => expect(api).toHaveBeenCalledTimes(1));

        const [, calledOpts] = (api as jest.Mock).mock.calls[0];
        const sent = JSON.parse(calledOpts.body);

        expect(sent).toMatchObject({
            title: 'Standup',
            date: '2025-10-21T09:00',
            location: 'Remote',
            description: 'Daily sync',
            imageUrl: '',                 // wichtig
            tags: ['t1'],
            participants: ['p1'],
        });

        expect(onCreated).toHaveBeenCalled();
    });
});
