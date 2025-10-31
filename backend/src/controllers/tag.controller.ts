import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { TagService } from '../services/tag.service';

export const TagController = {
    // List all tags
    list: asyncHandler(async (_req: Request, res: Response) => res.json(await TagService.list())),

    // Get a specific tag by ID
    get: asyncHandler(async (req: Request, res: Response) => res.json(await TagService.get(req.params.id))),

    // Create a new tag
    create: asyncHandler(async (req: Request, res: Response) => res.status(201).json(await TagService.create(req.body))),

    // Update an existing tag by ID
    update: asyncHandler(async (req: Request, res: Response) => res.json(await TagService.update(req.params.id, req.body))),

    // Delete a tag by ID
    remove: asyncHandler(async (req: Request, res: Response) => res.json(await TagService.remove(req.params.id))),

    /**
     * Bulk delete selected tags by an array of IDs
     */
    removeBulk: asyncHandler(async (req: Request, res: Response) => {
        const { ids } = req.body;  // Expecting an array of tag IDs in the request body
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        const result = await TagService.removeMany(ids);  // Call the service to delete the tags
        return res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} tag(s).`,
        });
    }),
};
