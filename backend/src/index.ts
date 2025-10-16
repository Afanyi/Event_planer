import dotenv from 'dotenv';
import { connect } from './db';
import { createApp } from './app';

dotenv.config();

const app = createApp();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventsdb';
const PORT = Number(process.env.PORT || 4000);

connect(MONGO_URI)
    .then(() => app.listen(PORT, () => console.log(`✅ API running on port ${PORT}`)))
    .catch((e) => { console.error('❌ Mongo connect failed', e); process.exit(1); });
