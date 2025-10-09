import { Router } from 'express';
import { Participant } from '../models/Participant';
import { Event } from '../models/Event';
import { asyncHandler } from '../utils/errors';

export const participants = Router();

participants.get('/', asyncHandler(async (_req, res) => {
    res.json(await Participant.find().sort({ name: 1 }));
}));

participants.post('/', asyncHandler(async (req, res) => {
    const { name, email } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
    const created = await Participant.create({ name, email });
    res.status(201).json(created);
}));

participants.put('/:id', asyncHandler(async (req, res) => {
    const { name, email } = req.body || {};
    const updated = await Participant.findByIdAndUpdate(req.params.id, { name, email }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Participant not found' });
    res.json(updated);
}));

participants.delete('/:id', asyncHandler(async (req, res) => {
    const del = await Participant.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: 'Participant not found' });
    res.json({ ok: true });
}));

participants.get('/:id/events', asyncHandler(async (req, res) => {
    const events = await Event.find({ participants: req.params.id }).populate('tags participants');
    res.json(events);
}));
