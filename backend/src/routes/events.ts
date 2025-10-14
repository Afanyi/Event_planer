import { Router } from 'express';
import { Event } from '../models/Event';
import { Participant } from '../models/Participant';
import { asyncHandler } from '../utils/errors';

export const events = Router();

events.get('/', asyncHandler(async (req, res) => {
    const { q, from, to, location, participant } = req.query as any;

    const filter: any = {};

    // Titelvolltext
    if (q) filter.title = { $regex: String(q), $options: 'i' };

    // Datumsbereich
    if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = new Date(String(from));
        if (to) filter.date.$lte = new Date(String(to));
    }

    // Standort-Teilstring
    if (location) {
        filter.location = { $regex: String(location), $options: 'i' };
    }

    // Participant-Filter: akzeptiert entweder ObjectId oder Teilstring (Name/Email)
    if (participant) {
        const p = String(participant).trim();

        let participantIds: string[] = [];
        const looksLikeId = /^[0-9a-fA-F]{24}$/.test(p);

        if (looksLikeId) {
            participantIds = [p];
        } else {
            const matches = await Participant.find({
                $or: [
                    { name:   { $regex: p, $options: 'i' } },
                    { email:  { $regex: p, $options: 'i' } },
                ],
            }).select('_id');
            participantIds = matches.map(m => String(m._id));
        }

        // wenn keine Treffer → leere Ergebnisliste zurückgeben
        if (participantIds.length === 0) {
            return res.json([]);
        }
        filter.participants = { $in: participantIds };
    }

    const result = await Event.find(filter)
        .populate('tags participants')
        .sort({ date: 1 });

    res.json(result);
}));

events.get('/by-tag/:tagId', asyncHandler(async (req, res) => {
    const events = await Event.find({ tags: req.params.tagId })
        .populate('tags participants')
        .sort({ date: 1 });
    res.json(events);
}));

events.get('/by-participant/:participantId', asyncHandler(async (req, res) => {
    const events = await Event.find({ participants: req.params.participantId })
        .populate('tags participants')
        .sort({ date: 1 });
    res.json(events);
}));

events.post('/', asyncHandler(async (req, res) => {
    const { title, description = '', location = '', date, imageUrl = '', tags = [], participants = [] } = req.body || {};
    if (!title || !date) return res.status(400).json({ error: 'title and date are required' });
    const d = new Date(date);
    if (isNaN(d.getTime())) return res.status(400).json({ error: 'invalid date' });
    const created = await Event.create({ title, description, location, date: d, imageUrl, tags, participants });
    const populated = await created.populate('tags participants');
    res.status(201).json(populated);
}));

events.put('/:id', asyncHandler(async (req, res) => {
    const { title, description, location, date, imageUrl, tags, participants } = req.body || {};
    const update: any = { title, description, location, imageUrl, tags, participants };
    if (date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return res.status(400).json({ error: 'invalid date' });
        update.date = d;
    }
    const updated = await Event.findByIdAndUpdate(req.params.id, update, { new: true }).populate('tags participants');
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json(updated);
}));

events.delete('/:id', asyncHandler(async (req, res) => {
    const del = await Event.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: 'Event not found' });
    res.json({ ok: true });
}));

events.post('/:id/tags/:tagId', asyncHandler(async (req, res) => {
    const updated = await Event.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { tags: req.params.tagId } },
        { new: true }
    ).populate('tags participants');
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json(updated);
}));

events.delete('/:id/tags/:tagId', asyncHandler(async (req, res) => {
    const updated = await Event.findByIdAndUpdate(
        req.params.id,
        { $pull: { tags: req.params.tagId } },
        { new: true }
    ).populate('tags participants');
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json(updated);
}));

events.post('/:id/participants/:participantId', asyncHandler(async (req, res) => {
    const updated = await Event.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { participants: req.params.participantId } },
        { new: true }
    ).populate('tags participants');
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json(updated);
}));

events.delete('/:id/participants/:participantId', asyncHandler(async (req, res) => {
    const updated = await Event.findByIdAndUpdate(
        req.params.id,
        { $pull: { participants: req.params.participantId } },
        { new: true }
    ).populate('tags participants');
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json(updated);
}));
