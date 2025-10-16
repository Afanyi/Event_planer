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
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        // email is inside a span
        expect(screen.getByText(/alice@example.com/i)).toBeInTheDocument();
    });

    it('submits successfully: calls api, resets form, and triggers onChanged', async () => {
        (api as jest.Mock).mockResolvedValue({ ok: true });

        renderComp();

        const nameInput  = screen.getByPlaceholderText('Name') as HTMLInputElement;
        const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement;
        const addBtn     = screen.getByRole('button', { name: 'Add' });
        const form       = addBtn.closest('form')!;

        fireEvent.change(nameInput,  { target: { value: 'Charlie' } });
        fireEvent.change(emailInput, { target: { value: 'charlie@example.com' } });

        fireEvent.submit(form);

        // During submit
        expect(addBtn).toBeDisabled();
        expect(addBtn).toHaveTextContent('Adding…');

        await waitFor(() => expect(mockOnChanged).toHaveBeenCalledTimes(1));

        // After submit
        expect(addBtn).not.toBeDisabled();
        expect(addBtn).toHaveTextContent('Add');

        // Form reset (both inputs empty after reset)
        expect(nameInput.value).toBe('');
        expect(emailInput.value).toBe('');
    });

    it('shows API error from Response.json() when response.ok === false', async () => {
        (api as jest.Mock).mockResolvedValue({
            ok: false,
            status: 409,
            statusText: 'Conflict',
            json: async () => ({ error: 'Duplicate participant' })
        });

        renderComp();

        const addBtn = screen.getByRole('button', { name: 'Add' });
        const form   = addBtn.closest('form')!;
        fireEvent.change(screen.getByPlaceholderText('Name'),  { target: { value: 'Alice' } });
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
        (api as jest.Mock).mockResolvedValue({ error: 'Invalid email' });

        renderComp();

        const addBtn = screen.getByRole('button', { name: 'Add' });
        const form   = addBtn.closest('form')!;
        fireEvent.change(screen.getByPlaceholderText('Name'),  { target: { value: 'X' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'x' } });
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
        fireEvent.change(screen.getByPlaceholderText('Name'),  { target: { value: 'Dana' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'dana@example.com' } });
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Network down');
            expect(mockOnChanged).not.toHaveBeenCalled();
        });
    });
});
