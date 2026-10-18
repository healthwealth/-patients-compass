import { TRPCError } from "@trpc/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

/**
 * OAuth Token Validation Module
 * Verifies Google and Apple OAuth tokens server-side to prevent spoofing attacks
 */

interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
  iat: number;
  exp: number;
}

interface AppleTokenPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  c_hash: string;
  email: string;
  email_verified: string;
  auth_time: number;
  nonce_supported: boolean;
}

interface TokenValidationResult {
  valid: boolean;
  payload?: GoogleTokenPayload | AppleTokenPayload;
  error?: string;
}

/**
 * Verify Google OAuth ID Token
 * Validates the token signature, expiration, and claims
 *
 * @param token - Google ID token from frontend
 * @param clientId - Google OAuth Client ID (from environment)
 * @returns Validation result with decoded payload
 */
export async function verifyGoogleToken(
  token: string,
  clientId: string
): Promise<TokenValidationResult> {
  try {
    if (!token || typeof token !== "string") {
      return {
        valid: false,
        error: "Invalid token format",
      };
    }

    const tokenInfoUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
    tokenInfoUrl.searchParams.set("id_token", token);

    // Google Identity Services returns an ID token, not an access token.
    const response = await fetch(tokenInfoUrl, { method: "GET" });

    if (!response.ok) {
      return {
        valid: false,
        error: "Invalid or expired Google token",
      };
    }

    const payload = (await response.json()) as any;

    // Verify the token is for our application
    if (payload.aud !== clientId) {
      return {
        valid: false,
        error: "Token audience does not match client ID",
      };
    }

    // Verify token hasn't expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return {
        valid: false,
        error: "Google token has expired",
      };
    }

    // Verify email is verified
    if (!payload.email_verified) {
      return {
        valid: false,
        error: "Google email is not verified",
      };
    }

    return {
      valid: true,
      payload: payload as GoogleTokenPayload,
    };
  } catch (error: any) {
    console.error("[OAuth Validation] Google token verification error:", error);
    return {
      valid: false,
      error: "Failed to verify Google token",
    };
  }
}

/**
 * Verify Apple OAuth ID Token
 * Validates the token signature, expiration, and claims
 *
 * @param token - Apple ID token from frontend
 * @param clientId - Apple App ID (from environment)
 * @param teamId - Apple Team ID (from environment)
 * @param keyId - Apple Key ID (from environment)
 * @returns Validation result with decoded payload
 */
export async function verifyAppleToken(
  token: string,
  clientId: string,
  _teamId: string,
  _keyId: string
): Promise<TokenValidationResult> {
  try {
    if (!token || typeof token !== "string") {
      return {
        valid: false,
        error: "Invalid token format",
      };
    }

    if (!clientId) {
      return { valid: false, error: "Apple Service ID is not configured" };
    }

    const { payload } = await jwtVerify(token, appleJwks, {
      issuer: "https://appleid.apple.com",
      audience: clientId,
      algorithms: ["RS256"],
    });

    if (!payload.sub || typeof payload.email !== "string") {
      return { valid: false, error: "Apple token is missing required identity claims" };
    }

    return {
      valid: true,
      payload: payload as unknown as AppleTokenPayload,
    };
  } catch (error: any) {
    console.error("[OAuth Validation] Apple token verification error:", error);
    return {
      valid: false,
      error: "Failed to verify Apple token",
    };
  }
}

/**
 * Validate OAuth token and extract user information
 * Used by social login procedures to verify tokens before creating/updating users
 *
 * @param provider - OAuth provider (google or apple)
 * @param token - OAuth token from frontend
 * @param clientId - OAuth Client ID
 * @param teamId - (Apple only) Team ID
 * @param keyId - (Apple only) Key ID
 * @returns User information extracted from token
 */
export async function validateOAuthToken(
  provider: "google" | "apple",
  token: string,
  clientId: string,
  teamId?: string,
  keyId?: string
): Promise<{
  valid: boolean;
  userId?: string;
  email?: string;
  name?: string;
  picture?: string;
  error?: string;
}> {
  let result: TokenValidationResult;

  if (provider === "google") {
    result = await verifyGoogleToken(token, clientId);
  } else if (provider === "apple") {
    if (!teamId || !keyId) {
      return {
        valid: false,
        error: "Team ID and Key ID required for Apple token verification",
      };
    }
    result = await verifyAppleToken(token, clientId, teamId, keyId);
  } else {
    return {
      valid: false,
      error: "Unsupported OAuth provider",
    };
  }

  if (!result.valid) {
    return {
      valid: false,
      error: result.error,
    };
  }

  const payload = result.payload as any;

  return {
    valid: true,
    userId: payload.sub,
    email: payload.email,
    name: payload.name || payload.given_name || "User",
    picture: payload.picture,
  };
}

/**
 * Create TRPCError from OAuth validation error
 * Provides consistent error handling across OAuth procedures
 */
export function createOAuthError(error: string): TRPCError {
  const errorMap: Record<string, { code: string; message: string }> = {
    "Invalid token format": {
      code: "BAD_REQUEST",
      message: "Invalid authentication token format",
    },
    "Invalid or expired Google token": {
      code: "UNAUTHORIZED",
      message: "Google authentication failed. Please try again.",
    },
    "Token audience does not match client ID": {
      code: "UNAUTHORIZED",
      message: "Authentication token is not valid for this application",
    },
    "Google token has expired": {
      code: "UNAUTHORIZED",
      message: "Google authentication expired. Please sign in again.",
    },
    "Google email is not verified": {
      code: "UNAUTHORIZED",
      message: "Your Google account email must be verified",
    },
    "Invalid JWT format": {
      code: "BAD_REQUEST",
      message: "Invalid authentication token format",
    },
    "Apple token has expired": {
      code: "UNAUTHORIZED",
      message: "Apple authentication expired. Please sign in again.",
    },
    "Invalid token issuer": {
      code: "UNAUTHORIZED",
      message: "Authentication token is not from a trusted source",
    },
    "Apple Service ID is not configured": {
      code: "PRECONDITION_FAILED",
      message: "Apple authentication is not configured",
    },
    "Apple token is missing required identity claims": {
      code: "UNAUTHORIZED",
      message: "Apple authentication token is missing required information",
    },
    "Failed to verify Google token": {
      code: "INTERNAL_SERVER_ERROR",
      message: "Google authentication verification failed",
    },
    "Failed to verify Apple token": {
      code: "INTERNAL_SERVER_ERROR",
      message: "Apple authentication verification failed",
    },
  };

  const errorInfo = errorMap[error] || {
    code: "INTERNAL_SERVER_ERROR",
    message: "Authentication failed",
  };

  return new TRPCError({
    code: errorInfo.code as any,
    message: errorInfo.message,
  });
}
