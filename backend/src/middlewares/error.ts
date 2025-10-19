import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function notFound(_req: Request, res: Response) {
    res.status(404).json({ error: 'Not found' });
}
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) return res.status(err.status).json({ error: err.message, details: err.details ?? null });
    console.error(err);
    res.status(err?.status || 500).json({ error: err?.message || 'Server error' });
}
