export type Fn = jest.Mock<any, any>;

export type MockRes = {
  status: Fn;
  json: Fn;
  send: Fn;
  end: Fn;
  _status?: number;
  _json?: unknown;
};
