import { describe, it, expect } from "vitest";
import { generateUnsubscribeToken, parseUnsubscribeToken, getUnsubscribeLink } from "./unsubscribeHandler";

describe("Unsubscribe Handler", () => {
  describe("generateUnsubscribeToken", () => {
    it("should generate a valid token", () => {
      const token = generateUnsubscribeToken(123, "user@example.com");
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should generate different tokens for different users", () => {
      const token1 = generateUnsubscribeToken(123, "user1@example.com");
      const token2 = generateUnsubscribeToken(456, "user2@example.com");
      expect(token1).not.toBe(token2);
    });
  });

  describe("parseUnsubscribeToken", () => {
    it("should parse a valid token", () => {
      const userId = 123;
      const email = "user@example.com";
      const token = generateUnsubscribeToken(userId, email);
      const parsed = parseUnsubscribeToken(token);

      expect(parsed).toBeTruthy();
      expect(parsed?.userId).toBe(userId);
      expect(parsed?.email).toBe(email);
    });

    it("should return null for invalid token", () => {
      const parsed = parseUnsubscribeToken("invalid-token");
      expect(parsed).toBeNull();
    });

    it("should return null for malformed token", () => {
      const malformed = Buffer.from("invalid:format").toString("base64");
      const parsed = parseUnsubscribeToken(malformed);
      expect(parsed).toBeNull();
    });

    it("should handle empty token", () => {
      const parsed = parseUnsubscribeToken("");
      expect(parsed).toBeNull();
    });
  });

  describe("getUnsubscribeLink", () => {
    it("should generate a valid unsubscribe link", () => {
      const link = getUnsubscribeLink(123, "user@example.com");
      expect(link).toContain("https://thepatientscompass.com/api/unsubscribe");
      expect(link).toContain("token=");
    });

    it("should encode the token in the URL", () => {
      const link = getUnsubscribeLink(123, "user@example.com");
      const url = new URL(link);
      const token = url.searchParams.get("token");
      expect(token).toBeTruthy();

      // Should be able to parse the token back
      const parsed = parseUnsubscribeToken(token!);
      expect(parsed?.userId).toBe(123);
      expect(parsed?.email).toBe("user@example.com");
    });
  });

  describe("Token roundtrip", () => {
    it("should handle token generation and parsing roundtrip", () => {
      const testCases = [
        { userId: 1, email: "test1@example.com" },
        { userId: 999, email: "test999@example.com" },
        { userId: 12345, email: "long.email.address@subdomain.example.com" },
      ];

      testCases.forEach(({ userId, email }) => {
        const token = generateUnsubscribeToken(userId, email);
        const parsed = parseUnsubscribeToken(token);

        expect(parsed).toBeTruthy();
        expect(parsed?.userId).toBe(userId);
        expect(parsed?.email).toBe(email);
      });
    });
  });
});
