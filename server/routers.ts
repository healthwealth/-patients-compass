import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { labRouter, emailRouter } from "./routers/lab";
import { lifestyleRouter, healthNotesRouter, wellnessPlanRouter } from "./routers/lifestyle";
import { medicalAssistantRouter } from "./routers/medicalAssistant";
import { subscriptionRouter, publicSubscriptionRouter, publicCheckoutRouter } from "./routers/subscription";
import { emailSequenceRouter } from "./routers/emailSequence";
import { supportChatRouter } from "./routers/supportChat";
import { faqRouter } from "./routers/faq";
import { adminRouter } from "./routers/admin";
import { blogRouter } from "./routers/blog";
import { emailAuthRouter } from "./routers/auth";
import { profileRouter } from "./routers/profile";
import { trialRouter } from "./routers/trial";
import { referralRouter } from "./routers/referral";
import { analyticsRouter } from "./routers/analytics";
import { socialLoginRouter } from "./routers/socialLogin";
import { emailPreferencesRouter } from "./routers/emailPreferences";
import { adminAnalyticsRouter } from "./routers/adminAnalytics";
import { contentManagementRouter } from "./routers/contentManagement";
import { stripeSubscriptionsRouter } from "./routers/stripeSubscriptions";
import { activityRouter } from "./routers/activity";
import { favoritesRouter } from "./routers/favorites";
import { collectionsRouter } from "./routers/collections";
import { assistantAppearanceRouter } from "./routers/assistantAppearance";
import { careConnectionsRouter } from "./routers/careConnections";
import { certificatesRouter } from "./routers/certificates";
import { shopifyCheckoutRouter } from "./routers/shopifyCheckout";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    ...emailAuthRouter._def.procedures,
    ...socialLoginRouter._def.procedures,
  }),

  lab: labRouter,
  email: emailRouter,
  emailSequence: emailSequenceRouter,
  lifestyle: lifestyleRouter,
  healthNotes: healthNotesRouter,
  wellnessPlans: wellnessPlanRouter,
  medicalAssistant: medicalAssistantRouter,
  supportChat: supportChatRouter,
  faq: faqRouter,
  subscription: subscriptionRouter,
  stripe: subscriptionRouter,
  plans: publicSubscriptionRouter,
  checkout: publicCheckoutRouter,
  admin: adminRouter,
  blog: blogRouter,
  profile: profileRouter,
  trial: trialRouter,
  referral: referralRouter,
  analytics: analyticsRouter,
  socialLogin: socialLoginRouter,
  emailPreferences: emailPreferencesRouter,
  adminAnalytics: adminAnalyticsRouter,
  contentManagement: contentManagementRouter,
  stripeSubscriptions: stripeSubscriptionsRouter,
  activity: activityRouter,
  favorites: favoritesRouter,
  collections: collectionsRouter,
  assistantAppearance: assistantAppearanceRouter,
  careConnections: careConnectionsRouter,
  certificates: certificatesRouter,
  shopifyCheckout: shopifyCheckoutRouter,
});

export type AppRouter = typeof appRouter;
