import { describe, expect, it, vi } from "vitest";

const databaseMocks = vi.hoisted(() => {
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
  const update = vi.fn().mockReturnValue({ set: updateSet });
  return { update };
});

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({ update: databaseMocks.update }),
  recordUserActivity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "profile-images/77/avatar_abc123.jpg",
    url: "/manus-storage/profile-images/77/avatar_abc123.jpg",
  }),
}));

import { recordUserActivity } from "../db";
import { storagePut } from "../storage";
import { profileRouter } from "./profile";

const ctx = {
  user: { id: 77, name: "Test Patient", email: "test@example.com" },
} as never;

describe("profile avatar settings", () => {
  it("rejects malformed image data before storage or database access", async () => {
    const caller = profileRouter.createCaller(ctx);

    await expect(
      caller.uploadProfileImage({ fileName: "avatar.jpg", mimeType: "image/jpeg", dataBase64: "not-valid@@" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(storagePut).not.toHaveBeenCalled();
  });

  it("stores a validated image reference and records a private profile event", async () => {
    const caller = profileRouter.createCaller(ctx);
    const result = await caller.uploadProfileImage({
      fileName: "avatar.jpg",
      mimeType: "image/jpeg",
      dataBase64: Buffer.from("safe avatar image").toString("base64"),
    });

    expect(storagePut).toHaveBeenCalledWith("profile-images/77/avatar.jpg", expect.any(Buffer), "image/jpeg");
    expect(result.profileImageUrl).toBe("/manus-storage/profile-images/77/avatar_abc123.jpg");
    expect(recordUserActivity).toHaveBeenCalledWith(expect.objectContaining({
      userId: 77,
      eventType: "profile_image_updated",
    }));
  });
});
