import { asyncHandler, notFound, errorHandler } from '../../../src/utils/errors';

describe('utils/errors', () => {
    let req: any;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
        req = {};
        next = jest.fn();

        const json = jest.fn();
        const status = jest.fn().mockReturnThis();
        res = { status, json };

        // silence console.error during tests
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
        jest.clearAllMocks();
    });

    describe('asyncHandler', () => {
        it('calls the wrapped handler and does not call next on success', async () => {
            const okHandler = jest.fn(async (_req, res) => {
                res.status(200).json({ ok: true });
            });

            const wrapped = asyncHandler(okHandler);
            await wrapped(req, res, next);

            expect(okHandler).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ ok: true });
            expect(next).not.toHaveBeenCalled();
        });

        it('forwards errors to next(err) on rejection', async () => {
            const err = new Error('boom');
            const failing = jest.fn(async () => {
                throw err;
            });

            const wrapped = asyncHandler(failing);
            await wrapped(req, res, next);

            expect(failing).toHaveBeenCalledTimes(1);
            expect(next).toHaveBeenCalledWith(err);
        });
    });

    describe('notFound', () => {
        it('responds with 404 and {error:"Not found"}', () => {
            notFound(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
        });
    });

    describe('errorHandler', () => {
        it('uses err.status and err.message when provided', () => {
            const err: any = { status: 418, message: "I'm a teapot" };
            errorHandler(err, req, res, next);
            expect(console.error).toHaveBeenCalledWith(err);
            expect(res.status).toHaveBeenCalledWith(418);
            expect(res.json).toHaveBeenCalledWith({ error: "I'm a teapot" });
        });

        it('falls back to 500 and error.message for generic Error', () => {
            const err = new Error('kaboom');
            errorHandler(err as any, req, res, next);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'kaboom' });
        });

        it('falls back to 500 and "Server error" if no message', () => {
            const err = {} as any;
            errorHandler(err, req, res, next);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
        });
    });
});
