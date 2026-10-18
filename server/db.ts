import { eq, desc, count, and, gte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, labReports, emailSubscribers, biomarkerReadings, healthNotes, wellnessPlans, userActivities } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Lab Report Helpers ───────────────────────────────────────────────────────

export async function createLabReport(data: {
  userId: number;
  fileName: string;
  fileKey?: string;
  fileUrl?: string;
  rawText?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(labReports).values({
    userId: data.userId,
    fileName: data.fileName,
    fileKey: data.fileKey ?? null,
    fileUrl: data.fileUrl ?? null,
    rawText: data.rawText ?? null,
    status: "pending",
  });
  const insertId = (result as any).insertId;
  const [report] = await db
    .select()
    .from(labReports)
    .where(eq(labReports.id, insertId))
    .limit(1);
  await recordUserActivity({
    userId: data.userId,
    eventType: "lab_report_saved",
    title: "Lab report added",
    summary: "A report was saved to your private dashboard.",
    sourceRef: String(insertId),
  });
  return report;
}

export async function updateLabReport(
  id: number,
  data: {
    analysisResult?: unknown;
    status?: "pending" | "processing" | "completed" | "failed";
    rawText?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(labReports)
    .set({
      analysisResult: data.analysisResult as any,
      status: data.status,
      rawText: data.rawText,
      updatedAt: new Date(),
    })
    .where(eq(labReports.id, id));
  const [report] = await db
    .select()
    .from(labReports)
    .where(eq(labReports.id, id))
    .limit(1);
  return report;
}

export async function getLabReportsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(labReports)
    .where(eq(labReports.userId, userId))
    .orderBy(desc(labReports.createdAt));
}

export async function getLabReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [report] = await db
    .select()
    .from(labReports)
    .where(eq(labReports.id, id))
    .limit(1);
  return report ?? null;
}

// ─── Email Subscriber Helpers ─────────────────────────────────────────────────

export async function subscribeEmail(data: {
  email: string;
  name?: string;
  source?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.insert(emailSubscribers).values({
      email: data.email,
      name: data.name ?? null,
      source: data.source ?? "landing_page",
    });
    return { success: true, alreadySubscribed: false };
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      return { success: true, alreadySubscribed: true };
    }
    throw err;
  }
}

// ─── Biomarker Reading Helpers ────────────────────────────────────────────────

export async function saveBiomarkerReading(data: {
  userId: number;
  labReportId?: number;
  biomarkerName: string;
  value: number;
  unit?: string;
  readingDate?: Date;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(biomarkerReadings).values({
    userId: data.userId,
    labReportId: data.labReportId ?? null,
    biomarkerName: data.biomarkerName,
    value: data.value,
    unit: data.unit ?? null,
    readingDate: data.readingDate ?? new Date(),
    notes: data.notes ?? null,
  });
  const insertId = (result as any).insertId;
  const [reading] = await db
    .select()
    .from(biomarkerReadings)
    .where(eq(biomarkerReadings.id, insertId))
    .limit(1);
  return reading;
}

export async function getBiomarkerHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(biomarkerReadings)
    .where(eq(biomarkerReadings.userId, userId))
    .orderBy(desc(biomarkerReadings.readingDate));
}

// ─── Health Notes Helpers ─────────────────────────────────────────────────────

export async function createHealthNote(data: {
  userId: number;
  noteDate?: Date;
  category: "symptom" | "supplement" | "lifestyle" | "medication" | "stress" | "sleep" | "other";
  title: string;
  content?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(healthNotes).values({
    userId: data.userId,
    noteDate: data.noteDate ?? new Date(),
    category: data.category,
    title: data.title,
    content: data.content ?? null,
  });
  const insertId = (result as any).insertId;
  const [note] = await db
    .select()
    .from(healthNotes)
    .where(eq(healthNotes.id, insertId))
    .limit(1);
  return note;
}

export async function getHealthNotesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(healthNotes)
    .where(eq(healthNotes.userId, userId))
    .orderBy(desc(healthNotes.noteDate));
}

export async function deleteHealthNote(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(healthNotes)
    .where(eq(healthNotes.id, id));
}

// ─── Wellness Plan Helpers ───────────────────────────────────────────────────

export async function saveWellnessPlan(data: {
  userId: number;
  title: string;
  inputs: unknown;
  planOutput: unknown;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(wellnessPlans).values({
    userId: data.userId,
    title: data.title,
    inputs: data.inputs as any,
    planOutput: data.planOutput as any,
    notes: data.notes ?? null,
  });
  const insertId = (result as any).insertId;
  const [plan] = await db
    .select()
    .from(wellnessPlans)
    .where(eq(wellnessPlans.id, insertId))
    .limit(1);
  await recordUserActivity({
    userId: data.userId,
    eventType: "wellness_plan_saved",
    title: "Wellness plan saved",
    summary: "A new wellness plan was saved to your dashboard.",
    sourceRef: String(insertId),
  });
  return plan;
}

// ─── Private User Activity Helpers ───────────────────────────────────────────

export type UserActivityEventType =
  | "lab_report_saved"
  | "wellness_plan_saved"
  | "profile_image_updated"
  | "profile_image_removed"
  | "subscription_portal_opened"
  | "content_saved"
  | "content_unsaved"
  | "certificate_saved"
  | "collection_followed"
  | "collection_unfollowed";

export async function recordUserActivity(data: {
  userId: number;
  eventType: UserActivityEventType;
  title: string;
  summary?: string;
  sourceRef?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(userActivities).values({
    userId: data.userId,
    eventType: data.eventType,
    title: data.title,
    summary: data.summary ?? null,
    sourceRef: data.sourceRef ?? null,
  });
}

export async function getUserActivities(
  userId: number,
  options: { limit?: number; eventTypes?: UserActivityEventType[]; since?: Date } = {}
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(userActivities.userId, userId)];
  if (options.eventTypes?.length) conditions.push(inArray(userActivities.eventType, options.eventTypes));
  if (options.since) conditions.push(gte(userActivities.createdAt, options.since));
  return db
    .select()
    .from(userActivities)
    .where(and(...conditions))
    .orderBy(desc(userActivities.createdAt))
    .limit(options.limit ?? 12);
}

export async function getWellnessPlansByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(wellnessPlans)
    .where(eq(wellnessPlans.userId, userId))
    .orderBy(desc(wellnessPlans.createdAt));
}

export async function getWellnessPlanById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [plan] = await db
    .select()
    .from(wellnessPlans)
    .where(and(eq(wellnessPlans.id, id), eq(wellnessPlans.userId, userId)))
    .limit(1);
  return plan ?? null;
}

export async function deleteWellnessPlan(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(wellnessPlans)
    .where(and(eq(wellnessPlans.id, id), eq(wellnessPlans.userId, userId)));
}

// ─── Waitlist Helpers ─────────────────────────────────────────────────────────

export async function getWaitlistCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ total: count() })
    .from(emailSubscribers)
    .where(eq(emailSubscribers.source, "signin_waitlist"));
  return row?.total ?? 0;
}

export async function getWaitlistEntries() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(emailSubscribers)
    .where(eq(emailSubscribers.source, "signin_waitlist"))
    .orderBy(desc(emailSubscribers.createdAt));
}
