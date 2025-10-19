import express from 'express';
import cors from 'cors';
import { router } from './routes';
import { errorHandler, notFound } from './middlewares/error';

export function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

    app.get('/api/health', (_req, res) => res.json({ ok: true }));

    app.use('/api', router);

    app.use(notFound);
    app.use(errorHandler);
    return app;
}
