import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Validates that the VITE_SHOW_MAINTENANCE_BANNER environment variable
 * is set to a valid value ("true" or "false") or is undefined (defaults to hidden).
 */
describe("VITE_SHOW_MAINTENANCE_BANNER env flag", () => {
  it("should be 'true', 'false', or undefined", () => {
    const value = process.env.VITE_SHOW_MAINTENANCE_BANNER;
    if (value !== undefined) {
      expect(["true", "false"]).toContain(value);
    }
    // undefined is also valid — banner defaults to hidden
    expect(true).toBe(true);
  });

  it("requires an explicit true flag before rendering the banner", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/components/MaintenanceBanner.tsx"),
      "utf8"
    );

    expect(source).toContain(
      'const SHOW_BANNER = publicConfig.showMaintenanceBanner;'
    );
    const config = readFileSync(resolve(process.cwd(), "client/src/lib/publicConfig.ts"), "utf8");
    expect(config).toContain('import.meta.env.VITE_SHOW_MAINTENANCE_BANNER === "true"');
  });
});
