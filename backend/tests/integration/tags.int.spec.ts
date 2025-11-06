import { api } from "../__helpers__/app";
import { Tag } from "../../src/models/Tag";

describe("Tags API", () => {
  it("CRUD flow", async () => {
    // Create
    const create = await api()
      .post("/api/tags")
      .send({ name: "work", color: "#333333" });
    expect(create.status).toBe(201);
    expect(create.body._id).toBeDefined();

    // Get
    const get = await api().get(`/api/tags/${create.body._id}`);
    expect(get.status).toBe(200);
    expect(get.body.name).toBe("work");

    // List
    const list = await api().get("/api/tags");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);

    // Update
    const upd = await api()
      .put(`/api/tags/${create.body._id}`)
      .send({ color: "#ff0000" });
    expect(upd.status).toBe(200);
    expect(upd.body.color).toBe("#ff0000");

    // Delete
    const del = await api().delete(`/api/tags/${create.body._id}`);
    expect(del.status).toBe(200);
    expect(del.body).toEqual({ ok: true });

    const list2 = await api().get("/api/tags");
    expect(list2.body).toHaveLength(0);
  });

  it("rejects duplicate names", async () => {
    await Tag.create({ name: "unique", color: "#111" });
    const res = await api()
      .post("/api/tags")
      .send({ name: "unique", color: "#222" });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });
});
