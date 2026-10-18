import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("portrait crop and Integration Hub surfaces", () => {
  it("exposes click-to-focus and saved-versus-new crop comparison controls", () => {
    const source = read("client/src/pages/AdminAssistantAppearance.tsx");
    expect(source).toContain("Set portrait focal point on new crop preview");
    expect(source).toContain("Saved layout");
    expect(source).toContain("New crop");
    expect(source).toContain("updateCropFromPreview");
  });

  it("shows explicit privacy-safe external source statuses", () => {
    const source = read("client/src/pages/IntegrationHub.tsx");
    expect(source).toContain("{connectedCount} of {SOURCES.length} external sources connected");
    expect(source).toContain("No active external sync");
    expect(source).toContain("Apple Health");
    expect(source).toContain("Fitbit");
    expect(source).toContain("Oura Ring");
    expect(source).toContain("Garmin");
    expect(source).toContain("health values are never shown in this summary");
    expect(source).toContain("Last synced");
    expect(source).toContain("Sync Now");
    expect(source).toContain("FITBIT_SCOPES");
    expect(source).toContain('name: "profile"');
    expect(source).toContain('name: "activity"');
    expect(source).toContain('name: "sleep"');
    expect(source).toContain("Authorization not configured");
    expect(source).toContain("scopeAccepted");
  });
});
