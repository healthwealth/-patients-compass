import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  BookOpen,
  FlaskConical,
  Stethoscope,
  Bell,
  CheckCircle2,
  Loader2,
  LogIn,
  AlertTriangle,
  X,
  KeyRound,
  MailCheck,
  Info,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { decrementCooldown, EMAIL_LINK_COOLDOWN_SECONDS } from "@/lib/authFlow";
import EmailLinkCooldownIndicator from "@/components/EmailLinkCooldownIndicator";
import { useAuth } from "@/_core/hooks/useAuth";

/** Read ?returnPath from the URL so we can forward it into the OAuth state. */
function useReturnPath(): string {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("returnPath");
  if (raw) {
    try {
      const decoded = decodeURIComponent(raw);
      // Only allow relative paths to prevent open-redirect attacks
      if (decoded.startsWith("/")) return decoded;
    } catch {
      // ignore
    }
  }
  return "/";
}

function rememberSession(rememberMe: boolean) {
  const duration = rememberMe ? 365 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
  localStorage.setItem("patients-compass-session-expires-at", String(Date.now() + duration));
}

export default function SignIn() {
  const returnPath = useReturnPath();
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [isDevSigningIn, setIsDevSigningIn] = useState(false);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [authStatus, setAuthStatus] = useState<"verified" | "reset" | "expired" | "error" | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false);
  const [oauthError, setOAuthError] = useState("");
  const [oauthStep, setOAuthStep] = useState<"preparing" | "redirecting" | "completing">("preparing");
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [emailLinkCooldown, setEmailLinkCooldown] = useState(0);
  const oauthButtonRef = useRef<HTMLButtonElement>(null);
  const emailFallbackInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status === "verified" || status === "reset" || status === "expired" || status === "error") {
      setAuthStatus(status);
      setAuthMessage(params.get("message") || "");
    }
    const reason = params.get("reason");
    if (reason === "provider" || reason === "callback") {
      setOAuthError(reason === "callback" ? "The provider returned an incomplete callback. Check that cookies are enabled, then retry or use email sign-in." : "The OAuth provider may be temporarily unavailable or blocked by a browser extension. Check your connection and retry, or use email sign-in.");
    }
  }, []);

  useEffect(() => {
    if (!isOAuthRedirecting) return;
    setOAuthStep("preparing");
    const redirectStep = window.setTimeout(() => setOAuthStep("redirecting"), 700);
    const completingStep = window.setTimeout(() => setOAuthStep("completing"), 2500);
    const timeout = window.setTimeout(() => {
      setIsOAuthRedirecting(false);
      setOAuthError("Sign-in is taking longer than expected. Please retry or use email sign-in instead.");
    }, 15000);
    return () => {
      window.clearTimeout(redirectStep);
      window.clearTimeout(completingStep);
      window.clearTimeout(timeout);
    };
  }, [isOAuthRedirecting]);

  useEffect(() => {
    if (emailLinkCooldown <= 0) return;
    const timer = window.setInterval(() => setEmailLinkCooldown(decrementCooldown), 1000);
    return () => window.clearInterval(timer);
  }, [emailLinkCooldown]);

  useEffect(() => {
    if (!oauthError || Number(sessionStorage.getItem("patients-compass-oauth-retry-count") || "0") < 2) return;
    const focusTimer = window.setTimeout(() => emailFallbackInputRef.current?.focus(), 50);
    return () => window.clearTimeout(focusTimer);
  }, [oauthError]);

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    window.location.href = returnPath;
    return null;
  }

  const joinWaitlist = trpc.email.joinWaitlist.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setAlreadyJoined(data.alreadySubscribed);
    },
  });

  const emailSignIn = trpc.auth.signin.useMutation({
    onSuccess: () => { rememberSession(rememberMe); window.location.href = returnPath; },
    onError: (error) => {
      setAuthStatus("error");
      setAuthMessage(error.data?.code === "FORBIDDEN" ? "Your email is not verified yet. Use the button below to resend the verification message." : error.message || "We couldn't sign you in. Check your email and password.");
    },
  });

  const resetRequest = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => { setAuthStatus("reset"); setAuthMessage(data.message); },
    onError: (error) => { setAuthStatus("error"); setAuthMessage(error.message || "Unable to request a password reset."); },
  });

  const resendVerification = trpc.auth.resendVerificationEmail.useMutation({
    onSuccess: (data) => { setAuthStatus("verified"); setAuthMessage(data.message); },
    onError: (error) => { setAuthStatus("error"); setAuthMessage(error.message || "Unable to resend verification email."); },
  });

  const emailLinkRequest = trpc.auth.requestEmailLoginLink.useMutation({
    onSuccess: (data) => { setEmailLinkSent(true); setEmailLinkCooldown(EMAIL_LINK_COOLDOWN_SECONDS); setAuthStatus("reset"); setAuthMessage(data.message); },
    onError: (error) => { const wait = error.message.match(/wait (\d+) seconds/i); if (wait) setEmailLinkCooldown(Number(wait[1])); setAuthStatus("error"); setAuthMessage(error.message || "Unable to send a sign-in link."); },
  });

  const emailLinkSignIn = trpc.auth.loginWithEmailLink.useMutation({
    onSuccess: () => { rememberSession(rememberMe); window.location.href = returnPath; },
    onError: (error) => { setAuthStatus("error"); setAuthMessage(error.message || "This sign-in link is invalid or expired."); },
  });

  const emailToken = new URLSearchParams(window.location.search).get("emailToken");
  useEffect(() => {
    if (emailToken && !emailLinkSignIn.isPending) emailLinkSignIn.mutate({ token: emailToken });
  }, [emailToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    joinWaitlist.mutate({ email: email.trim() });
  };

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    emailSignIn.mutate({ email: email.trim(), password, rememberMe });
  };

  const startOAuthRedirect = () => {
    setIsOAuthRedirecting(true);
    setOAuthStep("preparing");
    setOAuthError("");
    sessionStorage.setItem("patients-compass-oauth-pending", "1");
    sessionStorage.setItem("patients-compass-oauth-remember-me", rememberMe ? "1" : "0");
    window.location.href = getLoginUrl(returnPath, rememberMe);
  };

  const handleDevSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    setIsDevSigningIn(true);
    try {
      const response = await fetch("/api/dev/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });

      if (response.ok) {
        // Redirect to returnPath after successful sign-in
        window.location.href = returnPath;
      } else {
        const error = await response.json();
        alert(`Sign-in failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Dev sign-in error:", error);
      alert("Sign-in failed. Please try again.");
    } finally {
      setIsDevSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col items-center justify-center px-4 py-16">
      {oauthError && <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md rounded-2xl border border-amber-200 bg-white p-4 text-left shadow-xl" role="alertdialog" aria-label="Sign-in error"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#2C2A29]">Sign-in needs another try</p><p className="mt-1 text-xs leading-5 text-[#5C5A59]">{oauthError}</p><button type="button" className="mt-2 text-xs font-semibold text-[#51715B] underline" onClick={() => { setOAuthError(""); startOAuthRedirect(); }}>Retry sign-in</button>{Number(sessionStorage.getItem("patients-compass-oauth-retry-count") || "0") >= 2 && <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-[#EBE6DC] pt-3"><p className="text-xs font-semibold text-[#2C2A29]">Use an email sign-in link instead</p><Input className="mt-2 h-8 text-xs" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email for sign-in link" ref={emailFallbackInputRef} />{emailLinkSent && <div className="mt-2 flex animate-in fade-in zoom-in-95 items-center gap-2 rounded-lg bg-[#F3F8F3] px-3 py-2 text-xs font-semibold text-[#51715B]" role="status"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Email sent. Check your inbox.</div>}<Button type="button" size="sm" className="mt-2 w-full bg-[#7E9A85] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6F8C76] hover:shadow-md active:translate-y-0 active:scale-[0.98]" disabled={emailLinkRequest.isPending || emailLinkCooldown > 0 || !email.trim()} onClick={() => emailLinkRequest.mutate({ email: email.trim() })}>{emailLinkRequest.isPending ? "Sending link…" : emailLinkCooldown > 0 ? `Resend link in ${emailLinkCooldown}s` : emailLinkSent ? "Send another email link" : "Send email sign-in link"}</Button><EmailLinkCooldownIndicator seconds={emailLinkCooldown} sent={emailLinkSent} /><p className="mt-1 text-center text-[11px] text-[#817B74]" aria-live="polite" aria-atomic="true">{emailLinkCooldown > 0 ? `For your security, you can request another link in ${emailLinkCooldown} seconds.` : emailLinkSent ? "Resend available — request a new link if needed." : "Links expire after 15 minutes."}</p><span className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#817B74]" title="Email sign-in links expire after 15 minutes and can be used only once. Never share your link with anyone." aria-label="Security information: links expire after 15 minutes and can be used only once."><Info className="h-3.5 w-3.5" aria-hidden="true" />Security details</span><button type="button" className="mt-2 w-full text-center text-xs font-semibold text-[#5C5A59] underline-offset-4 transition-colors hover:text-[#2C2A29] hover:underline active:scale-[0.98]" onClick={() => { setOAuthError(""); setEmailLinkSent(false); setEmailLinkCooldown(0); window.setTimeout(() => oauthButtonRef.current?.focus(), 50); }}>Back to OAuth</button></div>}</div><button type="button" aria-label="Close sign-in error" onClick={() => setOAuthError("")} className="rounded p-1 text-[#817B74] hover:bg-[#F9F6F0]"><X className="h-4 w-4" /></button></div></div>}
      {/* Back link */}
      <div className="w-full max-w-md mb-6">
        <Link href="/">
          <button className="flex items-center gap-2 text-sm text-[#5C5A59] hover:text-[#2C2A29] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </Link>
      </div>

      {/* Main card */}
      <Card className="w-full max-w-md border border-[#EBE6DC] shadow-md bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-8">
          {/* Icon + heading */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-[#7E9A85]/10 border border-[#BFD0C1] flex items-center justify-center mb-4">
              <LogIn className="w-7 h-7 text-[#7E9A85]" />
            </div>
            <h1 className="text-xl font-serif font-bold text-[#2C2A29] mb-2">
              Welcome back to Patients Compass
            </h1>
            <p className="text-sm text-[#5C5A59] leading-relaxed">
              Sign in securely to access your saved educational content, Health Companion conversations, and dashboard tools.
            </p>
          </div>

          <Button
            ref={oauthButtonRef}
            className="mb-6 w-full bg-[#2C2A29] hover:bg-[#1A1918] text-white rounded-xl font-semibold"
            disabled={isOAuthRedirecting}
            onClick={startOAuthRedirect}
          >
            {isOAuthRedirecting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{oauthStep === "preparing" ? "Preparing secure sign-in…" : oauthStep === "redirecting" ? "Redirecting securely…" : "Completing sign-in…"}</> : "Continue with Patients Compass"}
          </Button>
          {isOAuthRedirecting && <div className="mb-6 rounded-xl border border-[#BFD0C1] bg-[#F3F8F3] p-3" role="status" aria-live="polite" aria-atomic="true" aria-label="OAuth progress"><div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-[#51715B]"><span className={oauthStep === "preparing" ? "text-[#2C2A29]" : ""}>1. Preparing</span><span className={oauthStep === "redirecting" ? "text-[#2C2A29]" : ""}>2. Redirecting</span><span className={oauthStep === "completing" ? "text-[#2C2A29]" : ""}>3. Completing</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#DDE9DE]"><div className="h-full rounded-full bg-[#7E9A85] transition-all duration-500" style={{ width: oauthStep === "preparing" ? "33%" : oauthStep === "redirecting" ? "66%" : "92%" }} /></div></div>}
          <label className="mb-6 flex items-center justify-center gap-2 text-xs text-[#5C5A59]"><Checkbox checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />Remember me on this device <span className="inline-flex items-center gap-1 text-[#817B74]" title="If enabled, this device stays signed in for up to one year. The preference is stored only after authentication succeeds."><Info className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">Saved for up to one year after successful sign-in</span></span></label>

          <form onSubmit={handleEmailSignIn} className="mb-6 space-y-3 rounded-xl border border-[#EBE6DC] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7E9A85]">Email sign-in</p>
            <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            <Button type="submit" variant="outline" className="w-full border-[#7E9A85] text-[#51715B]" disabled={emailSignIn.isPending || !email.trim() || !password}>{emailSignIn.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : "Sign in with email"}</Button>
            <div className="flex flex-wrap justify-between gap-2 text-xs"><button type="button" className="text-[#51715B] underline-offset-2 hover:underline" onClick={() => email.trim() && resetRequest.mutate({ email: email.trim() })} disabled={resetRequest.isPending}><KeyRound className="mr-1 inline h-3.5 w-3.5" />Forgot password?</button><button type="button" className="text-[#51715B] underline-offset-2 hover:underline" onClick={() => email.trim() && resendVerification.mutate({ email: email.trim() })} disabled={resendVerification.isPending}><MailCheck className="mr-1 inline h-3.5 w-3.5" />Resend verification</button></div>
          </form>

          {authStatus && <div className={`mb-6 rounded-xl border p-3 text-xs leading-5 ${authStatus === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-[#BFD0C1] bg-[#F3F8F3] text-[#45614D]"}`} role="status"><p className="font-semibold">{authStatus === "verified" ? "Verification update" : authStatus === "reset" ? "Password reset update" : authStatus === "expired" ? "Session expired" : "Sign-in update"}</p><p>{authMessage || (authStatus === "expired" ? "Your session expired for security. Please sign in again." : "Please follow the next step shown here.")}</p></div>}

          {/* Waitlist form */}
          <div className="bg-[#F7F4EF] rounded-xl p-4 mb-6 border border-[#EBE6DC]">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-[#7E9A85]" />
              <p className="text-xs font-semibold uppercase tracking-widest text-[#7E9A85]">
                Need sign-in updates?
              </p>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center gap-2 py-3 text-center">
                <CheckCircle2 className="w-8 h-8 text-[#7E9A85]" />
                <p className="text-sm font-semibold text-[#2C2A29]">
                  {alreadyJoined ? "You're already on the list!" : "You're on the list!"}
                </p>
                <p className="text-xs text-[#5C5A59]">
                  {alreadyJoined
                      ? "We already have your email. We'll send sign-in help and service updates when available."
                      : "We'll send an email with sign-in help and service updates."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-[#D9D4CB] rounded-xl text-sm focus-visible:ring-[#7E9A85] focus-visible:border-[#7E9A85]"
                  disabled={joinWaitlist.isPending}
                />
                <Button
                  type="submit"
                  className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl font-semibold text-sm"
                  disabled={joinWaitlist.isPending || !email.trim()}
                >
                  {joinWaitlist.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining…
                    </span>
                  ) : (
                    "Notify Me"
                  )}
                </Button>
                {joinWaitlist.isError && (
                  <p className="text-xs text-red-500 text-center">
                    Something went wrong. Please try again.
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Dev Sign-In (Testing Only) */}
          {typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname.includes("manus.computer") || window.location.hostname.includes("manus.space")) && (
            <>
              <div className="border-t border-[#EBE6DC] my-5" />
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <LogIn className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                    Dev Testing Mode
                  </p>
                </div>
                <form onSubmit={handleDevSignIn} className="flex flex-col gap-2">
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-white border-blue-200 rounded-xl text-sm focus-visible:ring-blue-600 focus-visible:border-blue-600"
                    disabled={isDevSigningIn}
                  />
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white border-blue-200 rounded-xl text-sm focus-visible:ring-blue-600 focus-visible:border-blue-600"
                    disabled={isDevSigningIn}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm"
                    disabled={isDevSigningIn || !email.trim() || !name.trim()}
                  >
                    {isDevSigningIn ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in…
                      </span>
                    ) : (
                      "Sign In (Dev Mode)"
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="border-t border-[#EBE6DC] my-5" />

          {/* What you can still do */}
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7E9A85] mb-3">
              Available right now — no sign-in needed
            </p>
            <div className="space-y-2">
              <Link href="/biomarkers">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-[#EBE6DC] hover:border-[#7E9A85] hover:bg-[#F7F4EF] transition-all cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-[#7E9A85]/10 flex items-center justify-center flex-shrink-0">
                    <FlaskConical className="w-4 h-4 text-[#7E9A85]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2A29] group-hover:text-[#7E9A85] transition-colors">Biomarker Directory</p>
                    <p className="text-xs text-[#5C5A59]">Explore 25+ lab markers with optimal ranges</p>
                  </div>
                </div>
              </Link>
              <Link href="/lifestyle">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-[#EBE6DC] hover:border-[#7E9A85] hover:bg-[#F7F4EF] transition-all cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-[#7E9A85]/10 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-4 h-4 text-[#7E9A85]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2A29] group-hover:text-[#7E9A85] transition-colors">Lifestyle AI</p>
                    <p className="text-xs text-[#5C5A59]">Get personalised wellness recommendations</p>
                  </div>
                </div>
              </Link>
              <Link href="/books">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-[#EBE6DC] hover:border-[#7E9A85] hover:bg-[#F7F4EF] transition-all cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-[#7E9A85]/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-[#7E9A85]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2A29] group-hover:text-[#7E9A85] transition-colors">Books & Sample Chapters</p>
                    <p className="text-xs text-[#5C5A59]">Read excerpts from our published lab guides</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#EBE6DC] my-5" />

          {/* OAuth fallback + upgrade */}
          <div className="space-y-3">
            <Button
              className="w-full bg-[#2C2A29] hover:bg-[#1A1918] text-white rounded-xl font-semibold"
              onClick={() => {
                rememberSession(rememberMe); window.location.href = getLoginUrl(returnPath, rememberMe);
              }}
            >
              Continue with Patients Compass
            </Button>
            <Link href="/pricing">
              <Button
                variant="outline"
                className="w-full border-[#D48C70] text-[#D48C70] hover:bg-[#D48C70]/5 rounded-xl font-semibold bg-transparent"
              >
                Upgrade to Pro — No Account Needed
              </Button>
            </Link>
          </div>

          <p className="text-center text-xs text-[#9A9896] mt-4">
            Pro access via Shopify Payments works independently of sign-in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
