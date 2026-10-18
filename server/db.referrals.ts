import { eq, and, gt, lt, isNull } from "drizzle-orm";
import { referrals, users } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Generate a random alphanumeric string
 */
function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create a new referral code for a user
 * Referral codes expire after 90 days
 */
export async function createReferralCode(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const code = generateRandomString(12).toUpperCase();
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

  const result = await db.insert(referrals).values({
    referrerId: userId,
    referralCode: code,
    status: "pending",
    creditAmount: 1000, // $10 in cents
    expiresAt,
  });

  return { code, expiresAt };
}

/**
 * Get a user's active referral code
 */
export async function getUserReferralCode(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [referral] = await db
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerId, userId),
        eq(referrals.status, "pending"),
        gt(referrals.expiresAt, new Date())
      )
    )
    .limit(1);

  return referral || null;
}

/**
 * Track a referral when a new user signs up with a referral code
 */
export async function trackReferral(referralCode: string, newUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [referral] = await db
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.referralCode, referralCode),
        eq(referrals.status, "pending")
      )
    )
    .limit(1);

  if (!referral) {
    throw new Error("Invalid or expired referral code");
  }

  // Mark referral as converted
  await db
    .update(referrals)
    .set({
      status: "converted",
      referredUserId: newUserId,
      convertedAt: new Date(),
    })
    .where(eq(referrals.id, referral.id));

  return referral;
}

/**
 * Get referral earnings for a user
 * Returns total credits earned and pending credits
 */
export async function getReferralEarnings(userId: number) {
  const db = await getDb();
  if (!db) return { totalEarned: 0, creditsApplied: 0, pendingCredits: 0 };

  const userReferrals = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerId, userId));

  const totalEarned = userReferrals.reduce(
    (sum, ref) => sum + (ref.status === "converted" ? ref.creditAmount : 0),
    0
  );

  const creditsApplied = userReferrals.reduce(
    (sum, ref) =>
      sum +
      (ref.status === "converted" && ref.creditApplied
        ? ref.creditAmount
        : 0),
    0
  );

  const pendingCredits = totalEarned - creditsApplied;

  return {
    totalEarned,
    creditsApplied,
    pendingCredits,
    referralCount: userReferrals.filter((r) => r.status === "converted").length,
  };
}

/**
 * Get referral history for a user
 */
export async function getReferralHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const userReferrals = await db
    .select({
      id: referrals.id,
      referralCode: referrals.referralCode,
      status: referrals.status,
      creditAmount: referrals.creditAmount,
      creditApplied: referrals.creditApplied,
      referredUserEmail: users.email,
      createdAt: referrals.createdAt,
      convertedAt: referrals.convertedAt,
      expiresAt: referrals.expiresAt,
    })
    .from(referrals)
    .leftJoin(users, eq(referrals.referredUserId, users.id))
    .where(eq(referrals.referrerId, userId));

  return userReferrals;
}

/**
 * Apply pending credits to a user's account
 * This should be called after a referred user converts to paid
 */
export async function applyReferralCredits(referralId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [referral] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.id, referralId))
    .limit(1);

  if (!referral || referral.creditApplied) {
    return false; // Already applied or not found
  }

  await db
    .update(referrals)
    .set({ creditApplied: 1 })
    .where(eq(referrals.id, referralId));

  return true;
}

/**
 * Get referral statistics for analytics
 */
export async function getReferralStats() {
  const db = await getDb();
  if (!db)
    return {
      totalReferrals: 0,
      convertedReferrals: 0,
      totalCreditsIssued: 0,
      conversionRate: 0,
    };

  const allReferrals = await db.select().from(referrals);

  const convertedReferrals = allReferrals.filter(
    (r) => r.status === "converted"
  );
  const totalCreditsIssued = convertedReferrals.reduce(
    (sum, r) => sum + r.creditAmount,
    0
  );

  return {
    totalReferrals: allReferrals.length,
    convertedReferrals: convertedReferrals.length,
    totalCreditsIssued,
    conversionRate:
      allReferrals.length > 0
        ? (convertedReferrals.length / allReferrals.length) * 100
        : 0,
  };
}
