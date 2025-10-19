import { Router } from 'express';
import { EventController } from '../controllers/event.controller';

export const events = Router();

// List + Filter
events.get('/', EventController.list);

// Basic CRUD
events.get('/:id',    EventController.get);
events.post('/',      EventController.create);
events.put('/:id',    EventController.update);
events.delete('/:id', EventController.remove);

// Shortcuts
events.get('/by-tag/:tagId',                 EventController.byTag);
events.get('/by-participant/:participantId', EventController.byParticipant);

// Relations
events.post('/:id/tags/:tagId',                    EventController.addTag);
events.delete('/:id/tags/:tagId',                  EventController.removeTag);
events.post('/:id/participants/:participantId',    EventController.addParticipant);
events.delete('/:id/participants/:participantId',  EventController.removeParticipant);
