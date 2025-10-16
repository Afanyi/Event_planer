import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';
import { api } from '../../api';

// Mock API calls for integration-level rendering
jest.mock('../../api');

describe('App integration', () => {
    beforeEach(() => {
        (api as jest.Mock).mockImplementation(async (url: string) => {
            if (url.startsWith('/events')) return [
                { _id: '1', title: 'Meeting', date: '2025-10-15T12:00:00Z', location: 'Berlin', tags: [], participants: [] }
            ];
            if (url === '/tags') return [];
            if (url === '/participants') return [];
            return [];
        });
    });

    it('renders event list with fetched data', async () => {
        render(<App />);
        await waitFor(() => expect(screen.getByText('Meeting')).toBeInTheDocument());
    });
});
