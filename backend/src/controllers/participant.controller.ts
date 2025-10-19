import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { ParticipantService } from '../services/participant.service';

export const ParticipantController = {
    list:  asyncHandler(async (_req: Request, res: Response) => res.json(await ParticipantService.list())),
    get:   asyncHandler(async (req: Request, res: Response) => res.json(await ParticipantService.get(req.params.id))),
    create:asyncHandler(async (req: Request, res: Response) => res.status(201).json(await ParticipantService.create(req.body))),
    update:asyncHandler(async (req: Request, res: Response) => res.json(await ParticipantService.update(req.params.id, req.body))),
    remove:asyncHandler(async (req: Request, res: Response) => res.json(await ParticipantService.remove(req.params.id))),
};
