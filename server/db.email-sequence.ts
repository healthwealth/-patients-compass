import { eq } from "drizzle-orm";
import { emailSequences, type InsertEmailSequence } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Create a new email sequence for a user
 */
export async function createEmailSequence(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[EmailSequence] Cannot create sequence: database not available");
    return;
  }

  try {
    await db.insert(emailSequences).values({
      userId,
      sequenceType: "welcome",
      status: "pending",
    });
  } catch (error) {
    // If sequence already exists, that's fine
    if ((error as any)?.code === "ER_DUP_ENTRY") {
      console.log(`[EmailSequence] Sequence already exists for user ${userId}`);
      return;
    }
    console.error("[EmailSequence] Failed to create sequence:", error);
    throw error;
  }
}

/**
 * Get email sequence for a user
 */
export async function getEmailSequence(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[EmailSequence] Cannot get sequence: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Mark email as sent
 */
export async function markEmailSent(
  userId: number,
  emailNumber: 1 | 2 | 3,
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[EmailSequence] Cannot mark sent: database not available");
    return;
  }

  const field = `email${emailNumber}Sent` as const;
  const dateField = `email${emailNumber}SentAt` as const;

  await db
    .update(emailSequences)
    .set({
      [field]: 1,
      [dateField]: new Date(),
      status: emailNumber === 3 ? "completed" : "in_progress",
    } as any)
    .where(eq(emailSequences.userId, userId));
}

/**
 * Get all pending email sequences (for scheduled job)
 */
export async function getPendingEmailSequences(emailNumber: 1 | 2 | 3) {
  const db = await getDb();
  if (!db) {
    console.warn("[EmailSequence] Cannot get pending: database not available");
    return [];
  }

  const field = `email${emailNumber}Sent` as const;

  // Get sequences where this email hasn't been sent yet
  const result = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences[field], 0))
    .limit(100); // Process in batches

  return result;
}

/**
 * Get users who should receive email 1 (created today)
 */
export async function getUsersForEmail1() {
  const db = await getDb();
  if (!db) {
    console.warn("[EmailSequence] Cannot get users for email 1: database not available");
    return [];
  }

  // Get sequences created today that haven't sent email 1
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.email1Sent, 0));

  return result.filter((seq) => {
    const createdDate = new Date(seq.createdAt);
    createdDate.setHours(0, 0, 0, 0);
    return createdDate.getTime() === today.getTime();
  });
}

/**
 * Get users who should receive email 2 (created 2 days ago)
 */
export async function getUsersForEmail2() {
  const db = await getDb();
  if (!db) {
    console.warn("[EmailSequence] Cannot get users for email 2: database not available");
    return [];
  }

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);

  const result = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.email2Sent, 0));

  return result.filter((seq) => {
    const createdDate = new Date(seq.createdAt);
    createdDate.setHours(0, 0, 0, 0);
    return createdDate.getTime() === twoDaysAgo.getTime();
  });
}

/**
 * Get users who should receive email 3 (created 5 days ago)
 */
export async function getUsersForEmail3() {
  const db = await getDb();
  if (!db) {
    console.warn("[EmailSequence] Cannot get users for email 3: database not available");
    return [];
  }

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  fiveDaysAgo.setHours(0, 0, 0, 0);

  const result = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.email3Sent, 0));

  return result.filter((seq) => {
    const createdDate = new Date(seq.createdAt);
    createdDate.setHours(0, 0, 0, 0);
    return createdDate.getTime() === fiveDaysAgo.getTime();
  });
}

/**
 * Get user info for email sending (join with users table)
 */
export async function getUsersWithEmailSequence(userIds: number[]) {
  const db = await getDb();
  if (!db) {
    console.warn("[EmailSequence] Cannot get users: database not available");
    return [];
  }

  // This is a simplified query - in production you'd join with users table
  // For now, we'll fetch the email sequences and you'll need to join with users separately
  const sequences = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.userId, userIds[0])); // Simplified for demo

  return sequences;
}
