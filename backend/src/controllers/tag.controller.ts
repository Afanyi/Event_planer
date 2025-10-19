import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { TagService } from '../services/tag.service';

export const TagController = {
    list:  asyncHandler(async (_req: Request, res: Response) => res.json(await TagService.list())),
    get:   asyncHandler(async (req: Request, res: Response) => res.json(await TagService.get(req.params.id))),
    create:asyncHandler(async (req: Request, res: Response) => res.status(201).json(await TagService.create(req.body))),
    update:asyncHandler(async (req: Request, res: Response) => res.json(await TagService.update(req.params.id, req.body))),
    remove:asyncHandler(async (req: Request, res: Response) => res.json(await TagService.remove(req.params.id))),
};
