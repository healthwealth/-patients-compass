import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** When true, only users with role="admin" may access this route. */
  adminOnly?: boolean;
}

/**
 * ProtectedRoute wraps a page component and enforces authentication (and
 * optionally admin-only access) using the real Manus auth context.
 *
 * Behaviour:
 *  - While auth state is loading  → show a skeleton loader (avoids flash of redirect)
 *  - Not authenticated            → redirect to /signin?returnPath=<current path>
 *  - Authenticated but not admin  → redirect to /dashboard (when adminOnly=true)
 *  - Authenticated (and admin if required) → render children
 */
export default function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  // While the auth check is in-flight, show a neutral skeleton to avoid
  // a jarring flash of the redirect or the protected content.
  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  // Not logged in → send to sign-in page, encoding the current path so the
  // OAuth callback can redirect back here after a successful login.
  if (!isAuthenticated || !user) {
    const returnPath = encodeURIComponent(location);
    return <Redirect to={`/signin?returnPath=${returnPath}`} />;
  }

  // Admin-only guard
  if (adminOnly && user.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}
