import { eq } from "drizzle-orm";
import { emailAutomation, users } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Initialize email automation tracking for a new user
 */
export async function initializeEmailAutomation(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  try {
    await db.insert(emailAutomation).values({
      userId,
    });
  } catch (error) {
    // User might already have automation record
    console.error("Error initializing email automation:", error);
  }
}

/**
 * Get email automation status for a user
 */
export async function getEmailAutomationStatus(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [automation] = await db
    .select()
    .from(emailAutomation)
    .where(eq(emailAutomation.userId, userId))
    .limit(1);

  return automation || null;
}

/**
 * Mark trial expiration email as sent
 */
export async function markTrialExpirationEmailSent(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .update(emailAutomation)
    .set({
      trialExpirationEmailSent: 1,
      trialExpirationEmailSentAt: new Date(),
    })
    .where(eq(emailAutomation.userId, userId));
}

/**
 * Mark onboarding email as sent (email 1, 2, or 3)
 */
export async function markOnboardingEmailSent(
  userId: number,
  emailNumber: 1 | 2 | 3
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const updates: any = {};
  updates[`onboardingEmail${emailNumber}Sent`] = 1;
  updates[`onboardingEmail${emailNumber}SentAt`] = new Date();

  await db.update(emailAutomation).set(updates).where(eq(emailAutomation.userId, userId));
}

/**
 * Schedule trial expiration email via Heartbeat cron
 */
export async function scheduleTrialExpirationEmail(
  userId: number,
  cronTaskUid: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .update(emailAutomation)
    .set({
      trialExpirationEmailScheduled: 1,
      trialExpirationCronTaskUid: cronTaskUid,
    })
    .where(eq(emailAutomation.userId, userId));
}

/**
 * Schedule onboarding email sequence via Heartbeat cron
 */
export async function scheduleOnboardingEmails(
  userId: number,
  cronTaskUid: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .update(emailAutomation)
    .set({
      onboardingCronTaskUid: cronTaskUid,
    })
    .where(eq(emailAutomation.userId, userId));
}

/**
 * Get users who need trial expiration emails (1 day before trial ends)
 */
export async function getUsersNeedingTrialExpirationEmails() {
  const db = await getDb();
  if (!db) return [];

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const today = new Date();

  const usersNeedingEmail = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      trialEndDate: users.trialEndDate,
    })
    .from(users)
    .where(
      eq(users.isTrialActive, 1)
    );

  // Filter to only those whose trial ends tomorrow
  return usersNeedingEmail.filter((user) => {
    if (!user.trialEndDate) return false;
    const trialEnd = new Date(user.trialEndDate);
    return trialEnd > today && trialEnd <= tomorrow;
  });
}

/**
 * Get users who need onboarding emails (days 1, 3, 5 after signup)
 */
export async function getUsersNeedingOnboardingEmails() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  const automationRecords = await db.select().from(emailAutomation);

  const usersNeedingEmails = [];

  for (const record of automationRecords) {
    const createdAt = new Date(record.createdAt);

    // Email 1 (Day 1)
    if (
      !record.onboardingEmail1Sent &&
      createdAt <= oneDayAgo &&
      createdAt > threeDaysAgo
    ) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, record.userId))
        .limit(1);

      if (user?.email) {
        usersNeedingEmails.push({
          userId: record.userId,
          email: user.email,
          name: user.name,
          emailNumber: 1,
        });
      }
    }

    // Email 2 (Day 3)
    if (
      !record.onboardingEmail2Sent &&
      createdAt <= threeDaysAgo &&
      createdAt > fiveDaysAgo
    ) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, record.userId))
        .limit(1);

      if (user?.email) {
        usersNeedingEmails.push({
          userId: record.userId,
          email: user.email,
          name: user.name,
          emailNumber: 2,
        });
      }
    }

    // Email 3 (Day 5)
    if (!record.onboardingEmail3Sent && createdAt <= fiveDaysAgo) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, record.userId))
        .limit(1);

      if (user?.email) {
        usersNeedingEmails.push({
          userId: record.userId,
          email: user.email,
          name: user.name,
          emailNumber: 3,
        });
      }
    }
  }

  return usersNeedingEmails;
}
