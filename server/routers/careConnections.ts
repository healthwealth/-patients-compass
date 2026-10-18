import { TRPCError } from "@trpc/server";
import { and, eq, gt, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { telehealthPartnerConsents, telehealthPartnerSpecialties, telehealthPartnerStates, telehealthPartners } from "../../drizzle/schema";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Directory database unavailable" });
  return db;
}

const status = z.enum(["pending", "verified", "expired", "suspended"]);
const partnerFields = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().min(10).max(600),
  websiteUrl: z.string().url().refine((value) => value.startsWith("https://"), "Partner URL must use HTTPS"),
  logoUrl: z.string().url().optional().nullable(),
  licensingAuthority: z.string().trim().max(180).optional().nullable(),
  licenseNumber: z.string().trim().max(120).optional().nullable(),
  licenseUrl: z.string().url().optional().nullable(),
  licenseStatus: status,
  licenseExpiresAt: z.coerce.date().optional().nullable(),
  verificationNote: z.string().trim().max(255).optional().nullable(),
  verifiedAt: z.coerce.date().optional().nullable(),
  published: z.boolean(),
  states: z.array(z.string().trim().length(2).toUpperCase()).max(60),
  specialties: z.array(z.string().trim().min(1).max(120)).max(30),
});

async function hydratePartners(db: Awaited<ReturnType<typeof getDb>>, partners: typeof telehealthPartners["$inferSelect"][]) {
  if (!db || !partners.length) return [];
  const ids = partners.map((partner) => partner.id);
  const [states, specialties] = await Promise.all([
    db.select().from(telehealthPartnerStates).where(inArray(telehealthPartnerStates.partnerId, ids)),
    db.select().from(telehealthPartnerSpecialties).where(inArray(telehealthPartnerSpecialties.partnerId, ids)),
  ]);
  return partners.map((partner) => ({
    ...partner,
    states: states.filter((item) => item.partnerId === partner.id).map((item) => item.stateCode),
    specialties: specialties.filter((item) => item.partnerId === partner.id).map((item) => item.specialty),
  }));
}

export const careConnectionsRouter = router({
  list: publicProcedure.input(z.object({ state: z.string().length(2).optional(), specialty: z.string().trim().min(1).max(120).optional() }).optional()).query(async ({ input }) => {
    const db = await requireDb();
    const partners = await db.select().from(telehealthPartners).where(and(eq(telehealthPartners.published, 1), isNotNull(telehealthPartners.verifiedAt), eq(telehealthPartners.licenseStatus, "verified"), or(isNull(telehealthPartners.licenseExpiresAt), gt(telehealthPartners.licenseExpiresAt, new Date()))));
    const hydrated = await hydratePartners(db, partners);
    return hydrated.filter((partner) => (!input?.state || partner.states.includes(input.state)) && (!input?.specialty || partner.specialties.includes(input.specialty)));
  }),

  recordConsent: publicProcedure.input(z.object({ partnerId: z.number().int().positive(), consentVersion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [partner] = await db.select({ id: telehealthPartners.id }).from(telehealthPartners).where(and(eq(telehealthPartners.id, input.partnerId), eq(telehealthPartners.published, 1), isNotNull(telehealthPartners.verifiedAt), eq(telehealthPartners.licenseStatus, "verified"), or(isNull(telehealthPartners.licenseExpiresAt), gt(telehealthPartners.licenseExpiresAt, new Date())))).limit(1);
    if (!partner) throw new TRPCError({ code: "NOT_FOUND", message: "Partner is unavailable" });
    await db.insert(telehealthPartnerConsents).values({ userId: ctx.user?.id ?? null, partnerId: input.partnerId, consentVersion: input.consentVersion });
    return { recorded: true };
  }),

  admin: router({
    list: adminProcedure.query(async () => {
      const db = await requireDb();
      return hydratePartners(db, await db.select().from(telehealthPartners));
    }),
    create: adminProcedure.input(partnerFields).mutation(async ({ input }) => {
      const db = await requireDb();
      const [result] = await db.insert(telehealthPartners).values({ ...input, logoUrl: input.logoUrl ?? null, licensingAuthority: input.licensingAuthority ?? null, licenseNumber: input.licenseNumber ?? null, licenseUrl: input.licenseUrl ?? null, licenseExpiresAt: input.licenseExpiresAt ?? null, verificationNote: input.verificationNote ?? null, verifiedAt: input.verifiedAt ?? null, published: input.published ? 1 : 0 });
      const id = Number((result as { insertId: number }).insertId);
      if (input.states.length) await db.insert(telehealthPartnerStates).values(input.states.map((stateCode) => ({ partnerId: id, stateCode })));
      if (input.specialties.length) await db.insert(telehealthPartnerSpecialties).values(input.specialties.map((specialty) => ({ partnerId: id, specialty })));
      return { id };
    }),
    update: adminProcedure.input(partnerFields.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await requireDb();
      const { id, states, specialties, ...fields } = input;
      await db.update(telehealthPartners).set({ ...fields, logoUrl: fields.logoUrl ?? null, licensingAuthority: fields.licensingAuthority ?? null, licenseNumber: fields.licenseNumber ?? null, licenseUrl: fields.licenseUrl ?? null, licenseExpiresAt: fields.licenseExpiresAt ?? null, verificationNote: fields.verificationNote ?? null, verifiedAt: fields.verifiedAt ?? null, published: fields.published ? 1 : 0 }).where(eq(telehealthPartners.id, id));
      await db.delete(telehealthPartnerStates).where(eq(telehealthPartnerStates.partnerId, id));
      await db.delete(telehealthPartnerSpecialties).where(eq(telehealthPartnerSpecialties.partnerId, id));
      if (states.length) await db.insert(telehealthPartnerStates).values(states.map((stateCode) => ({ partnerId: id, stateCode })));
      if (specialties.length) await db.insert(telehealthPartnerSpecialties).values(specialties.map((specialty) => ({ partnerId: id, specialty })));
      return { updated: true };
    }),
    remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await requireDb();
      await db.update(telehealthPartners).set({ published: 0, licenseStatus: "suspended", verificationNote: "Archived by an administrator." }).where(eq(telehealthPartners.id, input.id));
      return { archived: true };
    }),
  }),
});
