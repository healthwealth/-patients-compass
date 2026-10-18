import { describe, expect, it } from "vitest";
import { formatReorderAnnouncement, formatReorderSuccessToast } from "../client/src/lib/collectionReorder";

describe("collection reorder accessibility", () => {
  it("announces the article action and exact position", () => {
    expect(formatReorderAnnouncement("Build an Appointment Agenda", "grabbed", 1, 3)).toBe("Build an Appointment Agenda grabbed, position 1 of 3.");
    expect(formatReorderAnnouncement("Build an Appointment Agenda", "moved", 2, 3)).toBe("Build an Appointment Agenda moved, position 2 of 3.");
    expect(formatReorderAnnouncement("Build an Appointment Agenda", "dropped", 2, 3)).toBe("Build an Appointment Agenda dropped, position 2 of 3.");
  });

  it("formats concise success feedback after a drag reorder", () => {
    expect(formatReorderSuccessToast("Build an Appointment Agenda", 2)).toBe("Build an Appointment Agenda moved to position 2.");
  });
});
