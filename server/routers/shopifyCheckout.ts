import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { createShopifyCart } from "../shopify/storefront";

export const shopifyCheckoutRouter = router({
  createCart: publicProcedure
    .input(z.object({
      plan: z.enum(["monthly", "yearly"]),
      origin: z.string().url(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => createShopifyCart({
      plan: input.plan,
      origin: input.origin,
      userId: ctx.user?.id,
      email: ctx.user?.email ?? input.email,
    })),
});
