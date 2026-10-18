import { describe, expect, it } from "vitest";

describe("Google Tag Manager configuration", () => {
  it("loads the configured container endpoint", async () => {
    const containerId = process.env.VITE_GTM_CONTAINER_ID;

    expect(containerId).toMatch(/^GTM-[A-Z0-9]+$/);

    const response = await fetch(
      `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId ?? "")}`,
      { method: "HEAD" }
    );

    expect(response.ok).toBe(true);
  }, 15_000);
});
