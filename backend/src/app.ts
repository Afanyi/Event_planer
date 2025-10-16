import express from 'express';
import cors from 'cors';
import { events } from './routes/events';
import { tags } from './routes/tags';
import { participants } from './routes/participants';
import { errorHandler, notFound } from './utils/errors';

export function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

    app.get('/api/health', (_req, res) => res.json({ ok: true }));
    app.use('/api/events', events);
    app.use('/api/tags', tags);
    app.use('/api/participants', participants);
    app.use(notFound);
    app.use(errorHandler);

    return app;
}
