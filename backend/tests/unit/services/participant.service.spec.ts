import { ParticipantService } from "../../../src/services/participant.service";

const chain = (result: any) => ({
  sort: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

jest.mock("src/models/Participant", () => ({
  Participant: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

const { Participant } = jest.requireMock("src/models/Participant");

describe("ParticipantService", () => {
  beforeEach(() => jest.clearAllMocks());

  test("list() returns array", async () => {
    (Participant.find as any).mockReturnValue(
      chain([{ _id: "p1", name: "Alex" }]),
    );
    const out = await ParticipantService.list();
    expect(out[0].name).toBe("Alex");
  });

  test("get() returns participant or 404", async () => {
    (Participant.findById as any).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: "p2", name: "Sam" }),
    });
    const ok = await ParticipantService.get("6562a1c4e9e6f1f1f1f1f1f1");
    expect(ok.name).toBe("Sam");

    (Participant.findById as any).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    await expect(
      ParticipantService.get("6562a1c4e9e6f1f1f1f1f1f1"),
    ).rejects.toThrow("Participant not found");
  });

  test("create() validates and checks uniqueness by name", async () => {
    (Participant.findOne as any).mockResolvedValue(null);
    (Participant.create as any).mockResolvedValue({
      _id: "p3",
      name: "Dana",
      email: "d@x.io",
    });
    const ok = await ParticipantService.create({
      name: "Dana",
      email: "d@x.io",
    });
    expect(ok._id).toBe("p3");

    (Participant.findOne as any).mockResolvedValue({ _id: "dup" });
    await expect(
      ParticipantService.create({ name: "Dana", email: "d@x.io" }),
    ).rejects.toThrow("Participant name already exists.");
  });

  test("update() returns updated or 404", async () => {
    (Participant.findByIdAndUpdate as any).mockResolvedValue({
      _id: "p4",
      name: "Neo",
    });
    const ok = await ParticipantService.update("6562a1c4e9e6f1f1f1f1f1f1", {
      name: "Neo",
    });
    expect(ok.name).toBe("Neo");

    (Participant.findByIdAndUpdate as any).mockResolvedValue(null);
    await expect(
      ParticipantService.update("6562a1c4e9e6f1f1f1f1f1f1", { name: "Neo" }),
    ).rejects.toThrow("Participant not found");
  });

  test("remove() returns ok or 404", async () => {
    (Participant.findByIdAndDelete as any).mockResolvedValue({ _id: "p5" });
    const ok = await ParticipantService.remove("6562a1c4e9e6f1f1f1f1f1f1");
    expect(ok).toEqual({ ok: true });

    (Participant.findByIdAndDelete as any).mockResolvedValue(null);
    await expect(
      ParticipantService.remove("6562a1c4e9e6f1f1f1f1f1f1"),
    ).rejects.toThrow("Participant not found");
  });
});
