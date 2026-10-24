/**
 * Who gets Pro features.
 *
 * Paying members (subscriptionStatus "active") and site admins. Admins are the
 * owner accounts listed in ADMIN_EMAILS, so the owner never hits the free
 * daily limit or sees upgrade prompts on her own site.
 */
export function hasProAccess(
  user: { subscriptionStatus?: string | null; role?: string | null } | null | undefined,
): boolean {
  if (!user) return false;
  return user.subscriptionStatus === "active" || user.role === "admin";
}

/** True for an admin who has Pro features without a paid subscription. */
export function isOwnerAccess(
  user: { subscriptionStatus?: string | null; role?: string | null } | null | undefined,
): boolean {
  return !!user && user.role === "admin" && user.subscriptionStatus !== "active";
}
