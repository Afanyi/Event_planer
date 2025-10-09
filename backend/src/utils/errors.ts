import { Request, Response, NextFunction } from 'express';

export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<any>>(fn: T) {
    return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

export function notFound(req: any, res: any) {
    res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err: any, _req: any, res: any, _next: any) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
}
