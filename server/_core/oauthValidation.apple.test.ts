import { beforeEach, describe, expect, it, vi } from "vitest";

const { jwtVerifyMock, appleJwks } = vi.hoisted(() => ({
  jwtVerifyMock: vi.fn(),
  appleJwks: vi.fn(),
}));

vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => appleJwks),
  jwtVerify: jwtVerifyMock,
}));

import { verifyAppleToken } from "./oauthValidation";

describe("verifyAppleToken", () => {
  beforeEach(() => {
    jwtVerifyMock.mockReset();
  });

  it("verifies Apple issuer, audience, algorithm, and signature", async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: {
        iss: "https://appleid.apple.com",
        aud: "com.thepatientscompass.web",
        sub: "apple-user-123",
        email: "patient@example.com",
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    });

    const result = await verifyAppleToken(
      "signed.apple.id.token",
      "com.thepatientscompass.web",
      "TEAM123456",
      "KEY123456"
    );

    expect(result.valid).toBe(true);
    expect(jwtVerifyMock).toHaveBeenCalledWith(
      "signed.apple.id.token",
      appleJwks,
      expect.objectContaining({
        issuer: "https://appleid.apple.com",
        audience: "com.thepatientscompass.web",
        algorithms: ["RS256"],
      })
    );
  });

  it("rejects a token when cryptographic verification fails", async () => {
    jwtVerifyMock.mockRejectedValue(new Error("signature verification failed"));

    const result = await verifyAppleToken(
      "forged.apple.id.token",
      "com.thepatientscompass.web",
      "TEAM123456",
      "KEY123456"
    );

    expect(result).toEqual({
      valid: false,
      error: "Failed to verify Apple token",
    });
  });
});
