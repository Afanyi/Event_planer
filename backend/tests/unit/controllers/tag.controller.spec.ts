// tests/unit/controllers/tag.controller.spec.ts
import { TagController } from "../../../src/controllers/tag.controller";
import { mockRes, mockNext } from "../../__helpers__/express";

jest.mock("src/services/tag.service", () => ({
  TagService: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));
const { TagService } = jest.requireMock("src/services/tag.service");

describe("TagController", () => {
  beforeEach(() => jest.clearAllMocks());

  test("list -> 200", async () => {
    TagService.list.mockResolvedValue([{ _id: "t1" }]);
    const res = mockRes();
    const next = mockNext();
    await TagController.list({} as any, res as any, next as any);
    expect(res.json).toHaveBeenCalledWith([{ _id: "t1" }]);
  });

  test("get -> 200", async () => {
    TagService.get.mockResolvedValue({ _id: "t2" });
    const res = mockRes();
    const next = mockNext();
    await TagController.get(
      { params: { id: "t2" } } as any,
      res as any,
      next as any,
    );
    expect(TagService.get).toHaveBeenCalledWith("t2");
  });

  test("create -> 201", async () => {
    TagService.create.mockResolvedValue({ _id: "t3" });
    const res = mockRes();
    const next = mockNext();
    await TagController.create(
      { body: { name: "work", color: "#333" } } as any,
      res as any,
      next as any,
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ _id: "t3" });
  });

  test("update -> 200", async () => {
    TagService.update.mockResolvedValue({ _id: "t4", name: "edited" });
    const res = mockRes();
    const next = mockNext();
    await TagController.update(
      { params: { id: "t4" }, body: { name: "edited" } } as any,
      res as any,
      next as any,
    );
    expect(TagService.update).toHaveBeenCalledWith("t4", { name: "edited" });
  });

  test("remove -> 200", async () => {
    TagService.remove.mockResolvedValue({ ok: true });
    const res = mockRes();
    const next = mockNext();
    await TagController.remove(
      { params: { id: "t5" } } as any,
      res as any,
      next as any,
    );
    expect(TagService.remove).toHaveBeenCalledWith("t5");
  });
});
