import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, isNull, like, lte, or } from "drizzle-orm";
import { z } from "zod";
import { savedCertificates } from "../../drizzle/schema";
import { getDb, recordUserActivity } from "../db";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";

const MAX_CERTIFICATE_BYTES = 6 * 1024 * 1024;
const MAX_PREVIEW_BYTES = 1_500_000;

function decodePdfDataUrl(dataUrl: string): Buffer {
  const match = /^data:application\/pdf(?:;filename=[^;]+)?;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Certificate data must be a valid PDF." });
  }

  const data = Buffer.from(match[1], "base64");
  if (data.length === 0 || data.length > MAX_CERTIFICATE_BYTES || data.subarray(0, 5).toString() !== "%PDF-") {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Certificate PDFs must be valid and 6 MB or smaller." });
  }
  return data;
}

function decodePreviewDataUrl(dataUrl: string): { data: Buffer; mimeType: "image/png" | "image/jpeg"; extension: "png" | "jpg" } {
  const match = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Certificate preview must be a PNG or JPEG image." });
  }

  const mimeType = match[1] as "image/png" | "image/jpeg";
  const data = Buffer.from(match[2], "base64");
  const isPng = mimeType === "image/png" && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = mimeType === "image/jpeg" && data.subarray(0, 2).equals(Buffer.from([255, 216]));
  if (data.length === 0 || data.length > MAX_PREVIEW_BYTES || (!isPng && !isJpeg)) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Certificate previews must be valid PNG or JPEG images under 1.5 MB." });
  }
  return { data, mimeType, extension: isPng ? "png" : "jpg" };
}

const saveInput = z.object({
  childName: z.string().trim().min(1, "A child name is required.").max(40),
  pdfDataUrl: z.string().min(32).max(8_400_000),
  previewDataUrl: z.string().min(32).max(2_200_000),
});
const certificateIdInput = z.object({ id: z.number().int().positive() });
const listInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(24).default(12),
  search: z.string().trim().max(120).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  includeArchived: z.boolean().default(false),
}).optional();

export const certificatesRouter = router({
  list: protectedProcedure
    .input(listInput)
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 12;
      const search = input?.search?.trim();
      const conditions = and(
        eq(savedCertificates.userId, ctx.user.id),
        !input?.includeArchived ? isNull(savedCertificates.archivedAt) : undefined,
        search ? or(like(savedCertificates.title, `%${search}%`), like(savedCertificates.childName, `%${search}%`)) : undefined,
        input?.from ? gte(savedCertificates.createdAt, new Date(`${input.from}T00:00:00.000Z`)) : undefined,
        input?.to ? lte(savedCertificates.createdAt, new Date(`${input.to}T23:59:59.999Z`)) : undefined,
      );
      const [totalRow] = await db.select({ total: count() }).from(savedCertificates).where(conditions);
      const items = await db
        .select({
          id: savedCertificates.id,
          childName: savedCertificates.childName,
          title: savedCertificates.title,
          fileUrl: savedCertificates.fileUrl,
          previewUrl: savedCertificates.previewUrl,
          archivedAt: savedCertificates.archivedAt,
          createdAt: savedCertificates.createdAt,
        })
        .from(savedCertificates)
        .where(conditions)
        .orderBy(desc(savedCertificates.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);
      const total = Number(totalRow?.total ?? 0);
      return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)), filters: { search: search ?? "", from: input?.from ?? "", to: input?.to ?? "", includeArchived: input?.includeArchived ?? false } };
    }),

  save: protectedProcedure.input(saveInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const childName = input.childName.replace(/\s+/g, " ").trim();
    const pdfData = decodePdfDataUrl(input.pdfDataUrl);
    const preview = decodePreviewDataUrl(input.previewDataUrl);
    const assetId = randomUUID();
    const pdfUploaded = await storagePut(
      `certificates/${ctx.user.id}/${assetId}/healthy-habits-certificate.pdf`,
      pdfData,
      "application/pdf",
    );
    const previewUploaded = await storagePut(
      `certificates/${ctx.user.id}/${assetId}/healthy-habits-certificate.${preview.extension}`,
      preview.data,
      preview.mimeType,
    );
    const [result] = await db.insert(savedCertificates).values({
      userId: ctx.user.id,
      childName,
      title: `Healthy Habits certificate for ${childName}`,
      fileKey: pdfUploaded.key,
      fileUrl: pdfUploaded.url,
      previewKey: previewUploaded.key,
      previewUrl: previewUploaded.url,
    });
    const certificateId = Number((result as { insertId?: number }).insertId);

    await recordUserActivity({
      userId: ctx.user.id,
      eventType: "certificate_saved",
      title: "Completion certificate saved",
      summary: "A Super Kids completion certificate was added to your private library.",
      sourceRef: String(certificateId),
    });

    return { id: certificateId, fileUrl: pdfUploaded.url, previewUrl: previewUploaded.url, saved: true };
  }),

  archive: protectedProcedure.input(certificateIdInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    await db.update(savedCertificates).set({ archivedAt: new Date() }).where(and(
      eq(savedCertificates.id, input.id),
      eq(savedCertificates.userId, ctx.user.id),
      isNull(savedCertificates.archivedAt),
    ));
    return { id: input.id, archived: true };
  }),

  restore: protectedProcedure.input(certificateIdInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    await db.update(savedCertificates).set({ archivedAt: null }).where(and(
      eq(savedCertificates.id, input.id),
      eq(savedCertificates.userId, ctx.user.id),
    ));
    return { id: input.id, archived: false };
  }),

  delete: protectedProcedure.input(certificateIdInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    await db.delete(savedCertificates).where(and(
      eq(savedCertificates.id, input.id),
      eq(savedCertificates.userId, ctx.user.id),
    ));
    return { id: input.id, deleted: true };
  }),
});
