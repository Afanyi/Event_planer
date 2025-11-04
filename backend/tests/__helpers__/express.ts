import type { MockRes } from "./types";

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
  const calls = (res.status as any)?.mock?.calls?.length ?? 0;
  if (status !== 200) {
    // Für !=200 MUSS status(code) aufgerufen worden sein
    expect(res.status).toHaveBeenCalledWith(status);
  } else {
    // Für 200 ist beides ok: explizit gesetzt ODER implizit (kein Aufruf)
    if (calls > 0) expect(res.status).toHaveBeenCalledWith(200);
  }
  expect(res.json).toHaveBeenCalledTimes(1);
}

/** NEW: dummy next() */
export function mockNext() {
  return jest.fn();
}
