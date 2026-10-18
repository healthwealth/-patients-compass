/**
 * Public (non-secret) settings delivered at runtime by the Worker through
 * /api/public-config.js, so they can be changed in the Cloudflare dashboard
 * without rebuilding. Falls back to build-time VITE_* values.
 */
type PublicConfig = {
  googleClientId?: string;
  gtmContainerId?: string;
  appleServiceId?: string;
  appleTeamId?: string;
  appleKeyId?: string;
  showMaintenanceBanner?: boolean;
};

const runtime: PublicConfig =
  (typeof window !== "undefined" && (window as unknown as { __PC_CONFIG__?: PublicConfig }).__PC_CONFIG__) || {};

export const publicConfig = {
  googleClientId: runtime.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
  gtmContainerId: runtime.gtmContainerId || import.meta.env.VITE_GTM_CONTAINER_ID || "",
  appleServiceId: runtime.appleServiceId || import.meta.env.VITE_APPLE_SERVICE_ID || "",
  appleTeamId: runtime.appleTeamId || import.meta.env.VITE_APPLE_TEAM_ID || "",
  appleKeyId: runtime.appleKeyId || import.meta.env.VITE_APPLE_KEY_ID || "",
  showMaintenanceBanner: runtime.showMaintenanceBanner ?? import.meta.env.VITE_SHOW_MAINTENANCE_BANNER === "true",
};
