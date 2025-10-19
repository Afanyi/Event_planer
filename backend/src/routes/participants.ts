import { Router } from 'express';
import { ParticipantController } from '../controllers/participant.controller';
export const participants = Router();

participants.get('/',      ParticipantController.list);
participants.get('/:id',   ParticipantController.get);
participants.post('/',     ParticipantController.create);
participants.put('/:id',   ParticipantController.update);
participants.delete('/:id',ParticipantController.remove);
