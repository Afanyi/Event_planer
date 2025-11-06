import { ParticipantController } from "../../../src/controllers/participant.controller";
import { mockReq, mockRes, mockNext } from "../../__helpers__/express";

jest.mock("src/services/participant.service", () => ({
  ParticipantService: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));
const { ParticipantService } = jest.requireMock(
  "src/services/participant.service",
);

describe("ParticipantController", () => {
  beforeEach(() => jest.clearAllMocks());

  test("list -> 200", async () => {
    ParticipantService.list.mockResolvedValue([{ _id: "p1" }]);
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();
    await ParticipantController.list(req as any, res as any, next as any);
    expect(res.json).toHaveBeenCalledWith([{ _id: "p1" }]);
  });

  test("get -> 200", async () => {
    ParticipantService.get.mockResolvedValue({ _id: "p2" });
    const req = mockReq({ id: "p2" });
    const res = mockRes();
    const next = mockNext();
    await ParticipantController.get(req as any, res as any, next as any);
    expect(ParticipantService.get).toHaveBeenCalledWith("p2");
  });

  test("create -> 201", async () => {
    ParticipantService.create.mockResolvedValue({ _id: "p3" });
    const req = mockReq({}, { name: "Sam", email: "s@x.io" });
    const res = mockRes();
    const next = mockNext();
    await ParticipantController.create(req as any, res as any, next as any);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ _id: "p3" });
  });

  test("update -> 200", async () => {
    ParticipantService.update.mockResolvedValue({ _id: "p4", name: "Neo" });
    const req = mockReq({ id: "p4" }, { name: "Neo" });
    const res = mockRes();
    const next = mockNext();
    await ParticipantController.update(req as any, res as any, next as any);
    expect(ParticipantService.update).toHaveBeenCalledWith("p4", {
      name: "Neo",
    });
  });

  test("remove -> 200", async () => {
    ParticipantService.remove.mockResolvedValue({ ok: true });
    const req = mockReq({ id: "p5" });
    const res = mockRes();
    const next = mockNext();
    await ParticipantController.remove(req as any, res as any, next as any);
    expect(ParticipantService.remove).toHaveBeenCalledWith("p5");
  });
});
