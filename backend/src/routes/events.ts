import { Router } from 'express';
import { EventController } from '../controllers/event.controller';

export const events = Router();

// ---- Spezifische Routen zuerst (sonst fängt "/:id" sie ab) ----
events.get('/by-tag/:tagId',                 EventController.byTag);
events.get('/by-participant/:participantId', EventController.byParticipant);

// 🎨 Weather endpoint
events.get('/:id/weather', EventController.weather);

// List + Filter
events.get('/', EventController.list);

// Basic CRUD
events.post('/',      EventController.create);
events.get('/:id',    EventController.get);
events.put('/:id',    EventController.update);
events.delete('/:id', EventController.remove);

// Relations
events.post('/:id/tags/:tagId',                   EventController.addTag);
events.delete('/:id/tags/:tagId',                 EventController.removeTag);
events.post('/:id/participants/:participantId',   EventController.addParticipant);
events.delete('/:id/participants/:participantId', EventController.removeParticipant);
