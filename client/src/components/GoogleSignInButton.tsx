import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { publicConfig } from "@/lib/publicConfig";

type Props = {
  /** Where to send the visitor after a successful sign-in. */
  returnPath?: string;
  text?: "signin_with" | "signup_with" | "continue_with";
};

/**
 * "Sign in with Google" using Google Identity Services. The ID token is
 * verified on the server (socialLogin.googleCallback), which then issues the
 * site's session cookie. Renders nothing when GOOGLE_CLIENT_ID is not set.
 */
export default function GoogleSignInButton({ returnPath = "/dashboard", text = "continue_with" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const utils = trpc.useUtils();
  const googleCallback = trpc.socialLogin.googleCallback.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      window.location.href = returnPath.startsWith("/") ? returnPath : "/dashboard";
    },
    onError: error => toast.error(error.message || "Google sign-in failed. Please try again."),
  });
  const mutateRef = useRef(googleCallback.mutate);
  mutateRef.current = googleCallback.mutate;

  useEffect(() => {
    if (!publicConfig.googleClientId) return;
    let cancelled = false;
    const render = () => {
      const google = (window as any).google;
      if (cancelled || !containerRef.current || !google?.accounts?.id) return false;
      google.accounts.id.initialize({
        client_id: publicConfig.googleClientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) mutateRef.current({ token: response.credential });
        },
      });
      google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text,
        width: Math.min(containerRef.current.offsetWidth || 320, 400),
      });
      setReady(true);
      return true;
    };
    if (render()) return;
    const timer = window.setInterval(() => {
      if (render()) window.clearInterval(timer);
    }, 150);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [text]);

  if (!publicConfig.googleClientId) return null;

  return (
    <div className="w-full">
      <div ref={containerRef} className="flex w-full justify-center" aria-busy={!ready || googleCallback.isPending} />
      {googleCallback.isPending && <p className="mt-2 text-center text-xs text-[#5C5A59]" role="status">Signing you in…</p>}
    </div>
  );
}
