import type { MockRes } from './types';

export function mockRes(): MockRes {
    const res: any = {};
    res.status = jest.fn().mockImplementation((code: number) => {
        res._status = code;
        return res;
    });
    res.json = jest.fn().mockImplementation((data: any) => {
        res._json = data;
        return res;
    });
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
}

export function mockReq(params: any = {}, body: any = {}, query: any = {}) {
    return { params, body, query } as any;
}

export function expectJson(res: MockRes, status = 200) {
    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledTimes(1);
}
