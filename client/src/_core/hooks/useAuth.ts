import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/signin" } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [sessionWarning, setSessionWarning] = useState(false);
  const extendSessionMutation = trpc.auth.extendSession.useMutation();

  useEffect(() => {
    if (!meQuery.data) {
      setSessionWarning(false);
      return;
    }
    const updateWarning = () => {
      let expiresAt = Number(localStorage.getItem("patients-compass-session-expires-at"));
      if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
        expiresAt = Date.now() + 8 * 60 * 60 * 1000;
        localStorage.setItem("patients-compass-session-expires-at", String(expiresAt));
      }
      setSessionWarning(Number.isFinite(expiresAt) && expiresAt > 0 && expiresAt - Date.now() <= 15 * 60 * 1000);
    };
    updateWarning();
    const timer = window.setInterval(updateWarning, 30_000);
    return () => window.clearInterval(timer);
  }, [meQuery.data]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
      localStorage.removeItem("patients-compass-session-expires-at");
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      localStorage.removeItem("patients-compass-session-expires-at");
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const extendSession = useCallback(async () => {
    const result = await extendSessionMutation.mutateAsync();
    localStorage.setItem("patients-compass-session-expires-at", String(Date.now() + result.sessionDuration));
    setSessionWarning(false);
    return result;
  }, [extendSessionMutation]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
      sessionWarning,
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    extendSessionMutation.isPending,
    sessionWarning,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    sessionWarning,
    extendSession,
  };
}
