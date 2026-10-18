import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  getUserActivities: vi.fn(),
}));

import { getUserActivities } from "../db";
import { activityRouter } from "./activity";

describe("activity.list", () => {
  it("returns the authenticated user’s persisted activity in reverse chronological order", async () => {
    const events = [
      {
        id: 8,
        userId: 42,
        eventType: "wellness_plan_saved",
        title: "Wellness plan saved",
        summary: "A new wellness plan was saved to your dashboard.",
        sourceRef: "71",
        createdAt: new Date("2026-08-25T12:00:00Z"),
      },
    ];
    vi.mocked(getUserActivities).mockResolvedValue(events as never);

    const caller = activityRouter.createCaller({ user: { id: 42 } } as never);
    const result = await caller.list({ limit: 5, range: "all" });

    expect(getUserActivities).toHaveBeenCalledWith(42, { limit: 5, eventTypes: undefined, since: undefined });
    expect(result).toEqual(events);
  });

  it("passes only allowlisted event types and a bounded time range to the authenticated user query", async () => {
    vi.mocked(getUserActivities).mockResolvedValue([] as never);
    const caller = activityRouter.createCaller({ user: { id: 42 } } as never);

    await caller.list({ limit: 12, range: "7d", eventTypes: ["content_saved"] });

    expect(getUserActivities).toHaveBeenCalledWith(42, expect.objectContaining({
      limit: 12,
      eventTypes: ["content_saved"],
      since: expect.any(Date),
    }));
    const options = vi.mocked(getUserActivities).mock.calls.at(-1)?.[1];
    expect(options?.since?.getTime()).toBeGreaterThan(Date.now() - 8 * 24 * 60 * 60 * 1000);
  });
});
