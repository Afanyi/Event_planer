import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { ParticipantService } from '../services/participant.service';

export const ParticipantController = {
    // List all participants
    list: asyncHandler(async (_req: Request, res: Response) => res.json(await ParticipantService.list())),

    // Get a specific participant by ID
    get: asyncHandler(async (req: Request, res: Response) => res.json(await ParticipantService.get(req.params.id))),

    // Create a new participant
    create: asyncHandler(async (req: Request, res: Response) => res.status(201).json(await ParticipantService.create(req.body))),

    // Update an existing participant by ID
    update: asyncHandler(async (req: Request, res: Response) => res.json(await ParticipantService.update(req.params.id, req.body))),

    // Delete a participant by ID
    remove: asyncHandler(async (req: Request, res: Response) => res.json(await ParticipantService.remove(req.params.id))),

    /**
     * Bulk delete selected participants by an array of IDs
     */
    removeBulk: asyncHandler(async (req: Request, res: Response) => {
        const { ids } = req.body;  // Expecting an array of participant IDs in the request body
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        const result = await ParticipantService.removeMany(ids);  // Call the service to delete the participants
        return res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} participant(s).`,
        });
    }),
};
