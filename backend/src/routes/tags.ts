import { Router } from 'express';
import { Tag } from '../models/Tag';
import { asyncHandler } from '../utils/errors';

export const tags = Router();

tags.get('/', asyncHandler(async (_req, res) => {
    res.json(await Tag.find().sort({ name: 1 }));
}));

tags.post('/', asyncHandler(async (req, res) => {
    const { name, color } = req.body || {};
    if (!name || !color) return res.status(400).json({ error: 'name and color are required' });
    const created = await Tag.create({ name, color });
    res.status(201).json(created);
}));

tags.put('/:id', asyncHandler(async (req, res) => {
    const { name, color } = req.body || {};
    const updated = await Tag.findByIdAndUpdate(req.params.id, { name, color }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Tag not found' });
    res.json(updated);
}));

tags.delete('/:id', asyncHandler(async (req, res) => {
    const del = await Tag.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: 'Tag not found' });
    res.json({ ok: true });
}));
