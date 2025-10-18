import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ParticipantList from '../../components/ParticipantList';
import { api } from '../../api';

jest.mock('../../api');

const mockOnChanged = jest.fn();
const baseParticipants = [
    { _id: 'p1', name: 'Alice', email: 'alice@example.com' },
    { _id: 'p2', name: 'Bob',   email: 'bob@example.com'   }
];

const renderComp = (participants = baseParticipants) =>
    render(<ParticipantList participants={participants as any} onChanged={mockOnChanged} />);

describe('ParticipantList (unit)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders header and existing participants', () => {
        renderComp();

        expect(screen.getByText('👥 Participants')).toBeInTheDocument();

        const items = screen.getAllByRole('listitem');
        expect(items.length).toBeGreaterThanOrEqual(2);

        expect(items[0]).toHaveTextContent(/^Alice\b/);
        expect(items[0]).toHaveTextContent(/alice@example\.com/i);

        expect(items[1]).toHaveTextContent(/^Bob\b/);
        expect(items[1]).toHaveTextContent(/bob@example\.com/i);
    });

    it('submits successfully: calls api, resets form, and triggers onChanged', async () => {
        (api as jest.Mock).mockResolvedValue({ ok: true });

        renderComp();

        const nameInput  = screen.getByPlaceholderText('Name') as HTMLInputElement;
        const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
        const addBtn     = screen.getByRole('button', { name: 'Add' });
        const form       = addBtn.closest('form')!;

        // Gültige Eingaben (passen zur Server-/pattern-Validierung)
        fireEvent.change(nameInput,  { target: { value: 'Charlie Brown' } });
        fireEvent.change(emailInput, { target: { value: 'charlie@example.com' } });

        fireEvent.submit(form);

        // Der Disabled-Zustand kann asynchron gesetzt werden -> mit waitFor prüfen
        await waitFor(() => {
            expect(addBtn).toBeDisabled();
            expect(addBtn).toHaveTextContent('Adding…');
        });

        await waitFor(() => expect(mockOnChanged).toHaveBeenCalledTimes(1));

        // Nach erfolgreichem Submit
        expect(addBtn).not.toBeDisabled();
        expect(addBtn).toHaveTextContent('Add');
        expect(nameInput.value).toBe('');
        expect(emailInput.value).toBe('');
    });

    it('shows API error from Response.json() when response.ok === false', async () => {
        (api as jest.Mock).mockResolvedValue({
            ok: false,
            status: 409,
            statusText: 'Conflict',
            json: async () => ({ error: 'Duplicate participant' }),
        });

        renderComp();

        const addBtn = screen.getByRole('button', { name: 'Add' });
        const form   = addBtn.closest('form')!;

        // Gültiger Name + E-Mail, damit NICHT die Name-Validierung triggert
        fireEvent.change(screen.getByPlaceholderText('Name'),  { target: { value: 'Alice Example' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'alice@example.com' } });

        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('HTTP 409: Duplicate participant');
            expect(mockOnChanged).not.toHaveBeenCalled();
        });

        expect(addBtn).not.toBeDisabled();
        expect(addBtn).toHaveTextContent('Add');
    });

    it('shows fallback API error when api() returns an object with { error }', async () => {
        // Komponente unterstützt auch { error: ... } als Rückgabe
        (api as jest.Mock).mockResolvedValue({ error: 'Invalid email' });

        renderComp();

        const addBtn = screen.getByRole('button', { name: 'Add' });
        const form   = addBtn.closest('form')!;

        // Wichtig: gültiger Name + formal gültige E-Mail, damit der Submit wirklich ausgeführt wird
        fireEvent.change(screen.getByPlaceholderText('Name'),  { target: { value: 'Max Mustermann' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'max@example.com' } });

        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('HTTP 400: Invalid email');
            expect(mockOnChanged).not.toHaveBeenCalled();
        });
    });

    it('shows network/unknown error when api() throws', async () => {
        (api as jest.Mock).mockRejectedValue(new Error('Network down'));

        renderComp();

        const addBtn = screen.getByRole('button', { name: 'Add' });
        const form   = addBtn.closest('form')!;

        fireEvent.change(screen.getByPlaceholderText('Name'),  { target: { value: 'Dana Scully' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'dana@example.com' } });

        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Network down');
            expect(mockOnChanged).not.toHaveBeenCalled();
        });
    });
});
