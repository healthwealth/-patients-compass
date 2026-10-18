import { z } from "zod";
import { assistantAppearanceSettings, assistantPortraitAssets, assistantPortraitCropPresets } from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  DEFAULT_HEALTH_COMPANION_PORTRAIT_KEY,
  getHealthCompanionPortrait,
  HEALTH_COMPANION_PORTRAITS,
} from "@shared/assistantAppearance";
import { eq } from "drizzle-orm";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

const portraitKeySchema = z.string().min(1).max(80).regex(/^[a-z0-9_]+$/);
const imageContentTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);
const MAX_PORTRAIT_BYTES = 3 * 1024 * 1024;

function decodePortraitImage(dataBase64: string, contentType: z.infer<typeof imageContentTypeSchema>) {
  const compact = dataBase64.replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(compact) || compact.length % 4 !== 0) throw new Error("The portrait image data is invalid.");
  const bytes = Buffer.from(compact, "base64");
  if (!bytes.length || bytes.length > MAX_PORTRAIT_BYTES) throw new Error("Portrait images must be 3 MB or smaller.");
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  const signatureMatches = contentType === "image/jpeg" ? isJpeg : contentType === "image/png" ? isPng : isWebp;
  if (!signatureMatches) throw new Error("The uploaded file is not a valid image of the selected type.");
  return bytes;
}

const builtInOptions = () => HEALTH_COMPANION_PORTRAITS.map((portrait) => ({ ...portrait, isCustom: false as const }));

async function findCustomPortrait(portraitKey: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      key: assistantPortraitAssets.portraitKey,
      label: assistantPortraitAssets.label,
      description: assistantPortraitAssets.description,
      url: assistantPortraitAssets.imageUrl,
      altText: assistantPortraitAssets.altText,
    })
    .from(assistantPortraitAssets)
    .where(eq(assistantPortraitAssets.portraitKey, portraitKey))
    .limit(1);
  return rows[0] ? { ...rows[0], isCustom: true as const } : null;
}

async function readSelectedPortrait() {
  const db = await getDb();
  if (!db) return { ...getHealthCompanionPortrait(DEFAULT_HEALTH_COMPANION_PORTRAIT_KEY), cropPositionX: 50, cropPositionY: 22, isCustom: false as const };

  const rows = await db
    .select({
      portraitKey: assistantAppearanceSettings.portraitKey,
      cropPositionX: assistantAppearanceSettings.cropPositionX,
      cropPositionY: assistantAppearanceSettings.cropPositionY,
    })
    .from(assistantAppearanceSettings)
    .where(eq(assistantAppearanceSettings.id, 1))
    .limit(1);

  const selectedKey = rows[0]?.portraitKey;
  const preset = selectedKey ? await db
    .select({ cropPositionX: assistantPortraitCropPresets.cropPositionX, cropPositionY: assistantPortraitCropPresets.cropPositionY })
    .from(assistantPortraitCropPresets)
    .where(eq(assistantPortraitCropPresets.portraitKey, selectedKey))
    .limit(1) : [];
  const cropPositionX = preset[0]?.cropPositionX ?? rows[0]?.cropPositionX ?? 50;
  const cropPositionY = preset[0]?.cropPositionY ?? rows[0]?.cropPositionY ?? 22;
  const builtIn = HEALTH_COMPANION_PORTRAITS.find((portrait) => portrait.key === selectedKey);
  if (builtIn) return { ...builtIn, cropPositionX, cropPositionY, isCustom: false as const };
  if (selectedKey) {
    const custom = await findCustomPortrait(selectedKey);
    if (custom) return { ...custom, cropPositionX, cropPositionY };
  }
  return { ...getHealthCompanionPortrait(DEFAULT_HEALTH_COMPANION_PORTRAIT_KEY), cropPositionX, cropPositionY, isCustom: false as const };
}

export const assistantAppearanceRouter = router({
  get: publicProcedure.query(async () => readSelectedPortrait()),

  options: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return builtInOptions();
    const custom = await db
      .select({
        key: assistantPortraitAssets.portraitKey,
        label: assistantPortraitAssets.label,
        description: assistantPortraitAssets.description,
        url: assistantPortraitAssets.imageUrl,
        altText: assistantPortraitAssets.altText,
      })
      .from(assistantPortraitAssets);
    const presets = await db.select({ portraitKey: assistantPortraitCropPresets.portraitKey, cropPositionX: assistantPortraitCropPresets.cropPositionX, cropPositionY: assistantPortraitCropPresets.cropPositionY }).from(assistantPortraitCropPresets);
    const presetMap = new Map(presets.map((preset) => [preset.portraitKey, preset]));
    return [...builtInOptions(), ...custom.map((portrait) => ({ ...portrait, isCustom: true as const }))].map((portrait) => ({
      ...portrait,
      cropPositionX: presetMap.get(portrait.key)?.cropPositionX ?? 50,
      cropPositionY: presetMap.get(portrait.key)?.cropPositionY ?? 22,
    }));
  }),

  uploadCustomPortrait: adminProcedure
    .input(z.object({
      label: z.string().trim().min(2).max(120),
      description: z.string().trim().min(10).max(255),
      altText: z.string().trim().min(8).max(255),
      fileName: z.string().min(1).max(180),
      contentType: imageContentTypeSchema,
      dataBase64: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is unavailable");
      const extension = input.contentType === "image/jpeg" ? "jpg" : input.contentType === "image/png" ? "png" : "webp";
      const declaredExtension = input.fileName.toLowerCase().split(".").pop();
      if (!declaredExtension || ![extension, ...(extension === "jpg" ? ["jpeg"] : [])].includes(declaredExtension)) {
        throw new Error("The file extension must match the selected image type.");
      }
      const bytes = decodePortraitImage(input.dataBase64, input.contentType);
      const key = `custom_${nanoid(12).toLowerCase()}`;
      const stored = await storagePut(`assistant-portraits/${key}.${extension}`, bytes, input.contentType);
      await db.insert(assistantPortraitAssets).values({
        portraitKey: key,
        label: input.label,
        description: input.description,
        imageUrl: stored.url,
        altText: input.altText,
        createdBy: ctx.user.id,
      });
      return { key, label: input.label, description: input.description, url: stored.url, altText: input.altText, isCustom: true as const };
    }),

  setPortrait: adminProcedure
    .input(z.object({ portraitKey: portraitKeySchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is unavailable");
      const isBuiltIn = HEALTH_COMPANION_PORTRAITS.some((portrait) => portrait.key === input.portraitKey);
      if (!isBuiltIn && !(await findCustomPortrait(input.portraitKey))) {
        throw new Error("Select an available portrait from the administrator library.");
      }

      await db
        .insert(assistantAppearanceSettings)
        .values({ id: 1, portraitKey: input.portraitKey, updatedBy: ctx.user.id })
        .onDuplicateKeyUpdate({
          set: { portraitKey: input.portraitKey, updatedBy: ctx.user.id },
        });

      return readSelectedPortrait();
    }),

  setCropPosition: adminProcedure
    .input(z.object({ portraitKey: portraitKeySchema.optional(), cropPositionX: z.number().int().min(0).max(100), cropPositionY: z.number().int().min(0).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is unavailable");
      const existing = await db
        .select({ portraitKey: assistantAppearanceSettings.portraitKey })
        .from(assistantAppearanceSettings)
        .where(eq(assistantAppearanceSettings.id, 1))
        .limit(1);
      const portraitKey = input.portraitKey ?? existing[0]?.portraitKey ?? DEFAULT_HEALTH_COMPANION_PORTRAIT_KEY;
      await db
        .insert(assistantPortraitCropPresets)
        .values({ portraitKey, cropPositionX: input.cropPositionX, cropPositionY: input.cropPositionY, updatedBy: ctx.user.id })
        .onDuplicateKeyUpdate({ set: { cropPositionX: input.cropPositionX, cropPositionY: input.cropPositionY, updatedBy: ctx.user.id } });
      await db
        .insert(assistantAppearanceSettings)
        .values({
          id: 1,
          portraitKey,
          cropPositionX: input.cropPositionX,
          cropPositionY: input.cropPositionY,
          updatedBy: ctx.user.id,
        })
        .onDuplicateKeyUpdate({
          set: { cropPositionX: input.cropPositionX, cropPositionY: input.cropPositionY, updatedBy: ctx.user.id },
        });
      return readSelectedPortrait();
    }),
});
