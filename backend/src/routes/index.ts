import { Router } from 'express';
import { events } from './events';
import { tags } from './tags';
import { participants } from './participants';

export const router = Router();
router.use('/events', events);
router.use('/tags', tags);
router.use('/participants', participants);
