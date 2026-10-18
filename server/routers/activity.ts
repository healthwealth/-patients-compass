import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getUserActivities, type UserActivityEventType } from "../db";

const activityEventTypes = [
  "lab_report_saved",
  "wellness_plan_saved",
  "profile_image_updated",
  "profile_image_removed",
  "subscription_portal_opened",
  "content_saved",
  "content_unsaved",
  "certificate_saved",
] as const satisfies readonly UserActivityEventType[];

export const activityRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(50).default(12),
      eventTypes: z.array(z.enum(activityEventTypes)).max(activityEventTypes.length).optional(),
      range: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
    }).optional())
    .query(async ({ ctx, input }) => {
      const range = input?.range ?? "30d";
      const rangeDays = range === "all" ? null : Number(range.replace("d", ""));
      const since = rangeDays ? new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000) : undefined;
      return getUserActivities(ctx.user.id, {
        limit: input?.limit ?? 12,
        eventTypes: input?.eventTypes,
        since,
      });
    }),
});
