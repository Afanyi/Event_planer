import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
  static badRequest(msg: string, d?: unknown) {
    return new AppError(400, msg, d);
  }
  static notFound(msg = "Not found") {
    return new AppError(404, msg);
  }
  static conflict(msg: string, d?: unknown) {
    return new AppError(409, msg, d);
  }
}

export function asyncHandler<
  T extends (req: Request, res: Response, next: NextFunction) => Promise<any>,
>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);
}
