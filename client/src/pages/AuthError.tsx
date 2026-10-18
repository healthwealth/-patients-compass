import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { nextOAuthRetryCount, retryStatus, shouldAutoRetry } from "@/lib/authFlow";

export default function AuthError() {
  const params = new URLSearchParams(window.location.search);
  const reason = params.get("reason");
  const isCallback = reason === "callback" || reason === "provider";
  const signInHref = isCallback ? `/signin?reason=${encodeURIComponent(reason || "provider")}` : "/signin";
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(() => Number(sessionStorage.getItem("patients-compass-oauth-retry-count") || "0"));
  const troubleshootingTips = reason === "callback"
    ? ["Allow cookies for the sign-in provider and disable strict tracking protection for this attempt.", "Check that your device clock is set automatically; an incorrect clock can invalidate OAuth callbacks."]
    : ["Check your internet connection and try again in a minute.", "If you use an ad blocker or privacy extension, temporarily allow the sign-in provider."];

  useEffect(() => {
    if (!shouldAutoRetry(reason, retryCount)) return;
    const timer = window.setTimeout(() => {
      const nextAttempt = nextOAuthRetryCount(retryCount);
      sessionStorage.setItem("patients-compass-oauth-retry-count", String(nextAttempt));
      sessionStorage.setItem("patients-compass-oauth-pending", "1");
      setRetryCount(nextAttempt);
      setRetrying(true);
      window.location.href = getLoginUrl("/", false);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [reason, retryCount]);

  const manualRetry = () => {
    sessionStorage.setItem("patients-compass-oauth-retry-count", "0");
    sessionStorage.setItem("patients-compass-oauth-pending", "1");
    window.location.href = getLoginUrl("/", false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F4EF] px-4 py-16">
      <Card className="w-full max-w-lg overflow-hidden rounded-2xl border-[#EBE6DC] bg-white shadow-md">
        <CardContent className="p-8 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
            {isCallback ? <ShieldAlert className="h-7 w-7 text-amber-600" /> : <AlertTriangle className="h-7 w-7 text-amber-600" />}
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#7E9A85]">Authentication help</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#2C2A29]">
            {isCallback ? "We couldn't complete sign-in" : "Sign-in is temporarily unavailable"}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#5C5A59]">
            {isCallback
              ? "The authentication provider returned an incomplete response. No account changes were made. Please retry, or use email sign-in if you already have a verified account."
              : "The authentication provider may be busy or undergoing maintenance. Please wait a moment and try again."}
          </p>
          {reason === "provider" && <p className="mt-3 text-xs font-semibold text-[#51715B]" role="status" aria-live="polite" aria-atomic="true">{retryStatus(retryCount, retrying)}</p>}
          <div className="mt-4 rounded-xl bg-[#F9F6F0] p-3 text-left" aria-live="polite"><p className="text-xs font-semibold text-[#2C2A29]">Try these steps</p><ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-[#5C5A59]">{troubleshootingTips.map((tip) => <li key={tip}>{tip}</li>)}</ul></div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button className="bg-[#2C2A29] text-white hover:bg-[#1A1918]" onClick={manualRetry} disabled={retrying}>
              {retrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} {retrying ? "Retrying…" : "Retry sign-in"}
            </Button>
            <Link href={signInHref}><Button variant="outline" className="w-full border-[#DCD3C7] text-[#51715B]"><ArrowLeft className="mr-2 h-4 w-4" /> Use email sign-in</Button></Link>
          </div>
          <p className="mt-6 text-xs text-[#817B74]">If the problem continues, return later or contact support with the time of the failed attempt. Never share your password or verification code.</p>
        </CardContent>
      </Card>
    </main>
  );
}
