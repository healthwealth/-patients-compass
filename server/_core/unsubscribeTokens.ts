import crypto from "crypto";

/**
 * Generate a secure unsubscribe token for email links
 * Token format: base64(userId:timestamp:random)
 */
export function generateUnsubscribeToken(userId: number): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString("hex");
  const payload = `${userId}:${timestamp}:${random}`;
  return Buffer.from(payload).toString("base64");
}

/**
 * Verify and decode an unsubscribe token
 * Returns { userId, timestamp } if valid, null if invalid
 */
export function verifyUnsubscribeToken(
  token: string,
  maxAgeMs: number = 30 * 24 * 60 * 60 * 1000 // 30 days default
): { userId: number; timestamp: number } | null {
  try {
    const payload = Buffer.from(token, "base64").toString("utf-8");
    const [userIdStr, timestampStr] = payload.split(":");

    if (!userIdStr || !timestampStr) {
      return null;
    }

    const userId = parseInt(userIdStr, 10);
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(userId) || isNaN(timestamp)) {
      return null;
    }

    // Check token age
    const now = Date.now();
    if (now - timestamp > maxAgeMs) {
      return null;
    }

    return { userId, timestamp };
  } catch (error) {
    console.error("[UnsubscribeTokens] Failed to verify token:", error);
    return null;
  }
}

/**
 * Generate unsubscribe URL for email templates
 * Usage: Include in email footer as: ${generateUnsubscribeUrl(userId, baseUrl)}
 */
export function generateUnsubscribeUrl(userId: number, baseUrl: string): string {
  const token = generateUnsubscribeToken(userId);
  return `${baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
}
