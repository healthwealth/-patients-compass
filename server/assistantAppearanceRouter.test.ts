import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { getDb } from "./db";
import { storagePut } from "./storage";
import { assistantAppearanceRouter } from "./routers/assistantAppearance";

const callerFor = (role: "admin" | "user") =>
  assistantAppearanceRouter.createCaller({ user: { id: 8, role } } as never);

describe("assistant appearance router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects non-administrators from options, portrait updates, and custom uploads", async () => {
    const caller = callerFor("user");
    await expect(caller.options()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.setPortrait({ portraitKey: "sage_educator" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.setCropPosition({ cropPositionX: 50, cropPositionY: 22 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.uploadCustomPortrait({ label: "Custom educator", description: "A professional editorial portrait.", altText: "Health Companion AI educator portrait", fileName: "portrait.png", contentType: "image/png", dataBase64: "aGVsbG8=" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows administrators to list the diverse built-in options", async () => {
    const from = vi.fn().mockResolvedValue([]);
    vi.mocked(getDb).mockResolvedValue({ select: vi.fn(() => ({ from })) } as never);
    const caller = callerFor("admin");
    const options = await caller.options();
    expect(options.length).toBeGreaterThanOrEqual(5);
    expect(options.every((option) => option.isCustom === false)).toBe(true);
  });

  it("allows administrators to update the singleton setting", async () => {
    const values = vi.fn().mockReturnValue({
      onDuplicateKeyUpdate: vi.fn().mockResolvedValue(undefined),
    });
    const limit = vi.fn()
      .mockResolvedValueOnce([{ portraitKey: "sage_educator" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ portraitKey: "sage_educator" }]);
    const db = {
      insert: vi.fn(() => ({ values })),
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
    };
    vi.mocked(getDb).mockResolvedValue(db as never);

    const caller = callerFor("admin");
    await expect(caller.setPortrait({ portraitKey: "sage_educator" })).resolves.toMatchObject({ key: "sage_educator" });
    expect(db.insert).toHaveBeenCalled();
    expect(values).toHaveBeenCalledWith({ id: 1, portraitKey: "sage_educator", updatedBy: 8 });
  });

  it("persists bounded crop coordinates for the active portrait", async () => {
    const values = vi.fn().mockReturnValue({
      onDuplicateKeyUpdate: vi.fn().mockResolvedValue(undefined),
    });
    const limit = vi.fn()
      .mockResolvedValueOnce([{ portraitKey: "sage_educator" }])
      .mockResolvedValueOnce([{ portraitKey: "sage_educator" }])
      .mockResolvedValueOnce([{ portraitKey: "sage_educator", cropPositionX: 64, cropPositionY: 18 }]);
    const db = {
      insert: vi.fn(() => ({ values })),
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })),
    };
    vi.mocked(getDb).mockResolvedValue(db as never);

    const caller = callerFor("admin");
    await expect(caller.setCropPosition({ cropPositionX: 64, cropPositionY: 18 })).resolves.toMatchObject({ cropPositionX: 64, cropPositionY: 18 });
    expect(values).toHaveBeenCalledWith({ id: 1, portraitKey: "sage_educator", cropPositionX: 64, cropPositionY: 18, updatedBy: 8 });
    await expect(caller.setCropPosition({ cropPositionX: 101, cropPositionY: 18 })).rejects.toThrow();
  });

  it("uploads and stores an administrator-owned custom portrait", async () => {
    vi.mocked(storagePut).mockResolvedValue({ key: "assistant-portraits/custom.png", url: "/manus-storage/custom.png" });
    const values = vi.fn().mockResolvedValue([{ insertId: 4 }]);
    vi.mocked(getDb).mockResolvedValue({ insert: vi.fn(() => ({ values })) } as never);
    const caller = callerFor("admin");
    const portrait = await caller.uploadCustomPortrait({
      label: "Community educator",
      description: "A professional community health education portrait.",
      altText: "Health Companion AI community educator",
      fileName: "portrait.png",
      contentType: "image/png",
      dataBase64: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]).toString("base64"),
    });
    expect(portrait).toMatchObject({ label: "Community educator", url: "/manus-storage/custom.png", isCustom: true });
    expect(storagePut).toHaveBeenCalledWith(expect.stringContaining("assistant-portraits/custom_"), expect.any(Buffer), "image/png");
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ label: "Community educator", createdBy: 8, imageUrl: "/manus-storage/custom.png" }));
  });

  it("rejects custom portrait payloads whose bytes do not match the declared image type", async () => {
    vi.mocked(getDb).mockResolvedValue({ insert: vi.fn() } as never);
    const caller = callerFor("admin");
    await expect(caller.uploadCustomPortrait({
      label: "Invalid educator",
      description: "A professional community health education portrait.",
      altText: "Health Companion AI community educator",
      fileName: "portrait.png",
      contentType: "image/png",
      dataBase64: Buffer.from("not-an-image").toString("base64"),
    })).rejects.toThrow("not a valid image");
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("allows an administrator to select and resolve an available custom portrait", async () => {
    const custom = { key: "custom_abc123", label: "Community educator", description: "A professional community health education portrait.", url: "/manus-storage/custom.png", altText: "Health Companion AI community educator" };
    const chain = (rows: unknown[]) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(rows) })) })) });
    const values = vi.fn().mockReturnValue({ onDuplicateKeyUpdate: vi.fn().mockResolvedValue(undefined) });
    const db = {
      insert: vi.fn(() => ({ values })),
      select: vi.fn()
        .mockReturnValueOnce(chain([custom]))
        .mockReturnValueOnce(chain([{ portraitKey: custom.key }]))
        .mockReturnValueOnce(chain([]))
        .mockReturnValueOnce(chain([custom])),
    };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = callerFor("admin");
    await expect(caller.setPortrait({ portraitKey: custom.key })).resolves.toMatchObject({ ...custom, isCustom: true });
    expect(values).toHaveBeenCalledWith({ id: 1, portraitKey: custom.key, updatedBy: 8 });
  });
});
