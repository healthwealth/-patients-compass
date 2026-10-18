import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

interface UseAdminGuardOptions {
  /**
   * Where to redirect non-admin authenticated users.
   * Defaults to "/dashboard".
   */
  redirectTo?: string;
}

interface UseAdminGuardResult {
  /** True while the auth check is still in-flight. */
  loading: boolean;
  /** True when the current user is confirmed as an admin. */
  isAdmin: boolean;
}

/**
 * useAdminGuard — imperative admin access guard for components that need
 * programmatic control (e.g. showing/hiding UI elements, redirecting on action).
 *
 * For route-level protection prefer `<ProtectedRoute adminOnly>` in App.tsx.
 * Use this hook when you need the `isAdmin` flag inside a component's logic.
 *
 * Example:
 * ```tsx
 * const { loading, isAdmin } = useAdminGuard();
 * if (loading) return <Spinner />;
 * if (!isAdmin) return null; // or show a 403 message
 * ```
 *
 * With auto-redirect (mirrors ProtectedRoute behaviour):
 * ```tsx
 * useAdminGuard({ redirectTo: "/dashboard" }); // redirects automatically
 * ```
 */
export function useAdminGuard(options?: UseAdminGuardOptions): UseAdminGuardResult {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const redirectTo = options?.redirectTo ?? "/dashboard";

  useEffect(() => {
    if (loading) return;

    // Not logged in at all → send to sign-in
    if (!isAuthenticated || !user) {
      setLocation("/signin");
      return;
    }

    // Logged in but not admin → send to fallback
    if (user.role !== "admin") {
      setLocation(redirectTo);
    }
  }, [loading, isAuthenticated, user, redirectTo, setLocation]);

  const isAdmin = !loading && isAuthenticated && user?.role === "admin";

  return { loading, isAdmin };
}
