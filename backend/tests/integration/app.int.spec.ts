import { api } from "../__helpers__/app";

describe("Health", () => {
  it("GET /api/health -> 200", async () => {
    const res = await api().get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
