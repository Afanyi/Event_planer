import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connect } from './db';
import { events } from './routes/events';
import { tags } from './routes/tags';
import { participants } from './routes/participants';
import { errorHandler, notFound } from './utils/errors';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/events', events);
app.use('/api/tags', tags);
app.use('/api/participants', participants);
app.use(notFound);
app.use(errorHandler);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventsdb';
const PORT = Number(process.env.PORT || 4000);

connect(MONGO_URI)
    .then(() => app.listen(PORT, () => console.log(`✅ API running on port ${PORT}`)))
    .catch((e) => { console.error('❌ Mongo connect failed', e); process.exit(1); });
