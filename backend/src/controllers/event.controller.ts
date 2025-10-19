import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { EventService } from '../services/event.service';

export const EventController = {
    list: asyncHandler(async (req: Request, res: Response) => {
        const { q, from, to, location, participant, tag, tags } = req.query as any;
        res.json(await EventService.list({ q, from, to, location, participant, tag, tags }));
    }),
    get:    asyncHandler(async (req: Request, res: Response) => res.json(await EventService.get(req.params.id))),
    create: asyncHandler(async (req: Request, res: Response) => res.status(201).json(await EventService.create(req.body))),
    update: asyncHandler(async (req: Request, res: Response) => res.json(await EventService.update(req.params.id, req.body))),
    remove: asyncHandler(async (req: Request, res: Response) => res.json(await EventService.remove(req.params.id))),

    byTag:  asyncHandler(async (req: Request, res: Response) => res.json(await EventService.list({ tag: req.params.tagId }))),
    byParticipant: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.list({ participant: req.params.participantId }))),

    addTag: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.addTag(req.params.id, req.params.tagId))),
    removeTag: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.removeTag(req.params.id, req.params.tagId))),

    addParticipant: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.addParticipant(req.params.id, req.params.participantId))),
    removeParticipant: asyncHandler(async (req: Request, res: Response) =>
        res.json(await EventService.removeParticipant(req.params.id, req.params.participantId))),
};
