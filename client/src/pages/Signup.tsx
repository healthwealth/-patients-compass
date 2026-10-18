import { useState, useEffect, useRef } from "react";
import { publicConfig } from "@/lib/publicConfig";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, CheckCircle2, Loader2, Eye, EyeOff, Shield, Users, Zap, Chrome, Apple, HelpCircle, X, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import * as gtm from "@/lib/gtm";

export default function Signup() {
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<"form" | "verification" | "success">(() => new URLSearchParams(window.location.search).has("verificationToken") ? "verification" : "form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState(() => new URLSearchParams(window.location.search).get("verificationToken") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [supportEmailCopied, setSupportEmailCopied] = useState(false);
  const [helpSearch, setHelpSearch] = useState("");
  const [helpCategory, setHelpCategory] = useState("All topics");
  const [articleFeedback, setArticleFeedback] = useState<Record<string, "helpful" | "not-helpful">>({});
  const [feedbackNote, setFeedbackNote] = useState<Record<string, string>>({});
  const [feedbackCategory, setFeedbackCategory] = useState<Record<string, string>>({});
  const [feedbackCustomCategory, setFeedbackCustomCategory] = useState<Record<string, string>>({});
  const [feedbackUndoProgress, setFeedbackUndoProgress] = useState<Record<string, number>>({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Record<string, boolean>>({});
  const [feedbackFading, setFeedbackFading] = useState<Record<string, boolean>>({});
  const [relatedPreview, setRelatedPreview] = useState<string | null>(null);
  const previewTouchStart = useRef<{ x: number; y: number } | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [feedbackPulse, setFeedbackPulse] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const appleConfigured = Boolean(
    publicConfig.appleServiceId &&
      publicConfig.appleTeamId &&
      publicConfig.appleKeyId
  );

  const googleCallback = trpc.socialLogin.googleCallback.useMutation({
    onSuccess: () => {
      gtm.trackSignup("google");
      toast.success("Signed in with Google!");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message || "Google sign-in failed");
    },
  });

  const appleCallback = trpc.socialLogin.appleCallback.useMutation({
    onSuccess: () => {
      gtm.trackSignup("apple");
      toast.success("Signed in with Apple!");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message || "Apple sign-in failed");
    },
  });

  // Initialize Google Sign-In SDK
  useEffect(() => {
    if (!googleButtonRef.current) return;

    const initializeGoogleSignIn = () => {
      if (typeof window !== "undefined" && (window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: publicConfig.googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              try {
                await googleCallback.mutateAsync({
                  token: response.credential,
                });
              } catch (error) {
                console.error("Google callback error:", error);
              }
            }
          },
        });

        (window as any).google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signup_with",
        });
      }
    };

    // Wait for Google SDK to load
    const checkGoogleSDK = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        clearInterval(checkGoogleSDK);
        initializeGoogleSignIn();
      }
    }, 100);

    return () => clearInterval(checkGoogleSDK);
  }, [googleCallback]);

  // Initialize Apple Sign-In SDK
  useEffect(() => {
    if (!appleConfigured) return;

    const initializeAppleSignIn = () => {
      if (typeof window !== "undefined" && (window as any).AppleID) {
        (window as any).AppleID.auth.init({
          clientId: publicConfig.appleServiceId,
          teamId: publicConfig.appleTeamId,
          keyId: publicConfig.appleKeyId,
          redirectURI: `${window.location.origin}/auth/apple/callback`,
          usePopup: true,
        });
      }
    };

    const checkAppleSDK = setInterval(() => {
      if ((window as any).AppleID?.auth) {
        clearInterval(checkAppleSDK);
        initializeAppleSignIn();
      }
    }, 100);

    return () => clearInterval(checkAppleSDK);
  }, [appleCallback, appleConfigured]);

  const handleAppleSignIn = async () => {
    if (!appleConfigured) {
      toast.info("Apple sign-in will be available after Apple Developer setup is complete.");
      return;
    }

    try {
      if ((window as any).AppleID?.auth) {
        const response = await (window as any).AppleID.auth.signIn();
        if (response?.authorization?.id_token) {
          await appleCallback.mutateAsync({
            token: response.authorization.id_token,
          });
        }
      }
    } catch (error) {
      console.error("Apple sign-in error:", error);
      toast.error("Apple sign-in failed");
    }
  };

  const signup = trpc.auth.signup.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      setStep("verification");
      gtm.trackSignup("email");
      toast.success("Account created! Check your email for verification code.");
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error(error.message || "Failed to create account");
    },
  });

  const verifyEmail = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      setStep("success");
      toast.success("Email verified successfully! Redirecting...");
      setTimeout(() => {
        window.location.href = "/signin?status=verified";
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || "Invalid verification code");
      setIsLoading(false);
    },
  });

  const resendVerification = trpc.auth.resendVerificationEmail.useMutation({
    onSuccess: data => { setResendCooldown(60); toast.success(data.message); },
    onError: error => toast.error(error.message || "Unable to resend verification email"),
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleResendVerification = () => {
    if (!email.trim() || resendCooldown > 0 || resendVerification.isPending) return;
    resendVerification.mutate({ email: email.trim() });
  };

  const helpArticles = [
    { title: "Check your spam folder", category: "Email delivery", detail: "Search for Patients Compass and allow messages from our support address." },
    { title: "Request a fresh verification code", category: "Email delivery", detail: "Confirm your email address, then use Resend Email after the cooldown ends." },
    { title: "Use the newest code", category: "Verification code", detail: "Older codes may expire when a newer message is requested." },
    { title: "Code is not accepted", category: "Verification code", detail: "Enter the newest code exactly as shown and check that no spaces were added." },
    { title: "Verification link expired", category: "Account access", detail: "Return to sign up and request a new verification email to restart the process." },
    { title: "Email address needs correction", category: "Account access", detail: "Use Back to Sign Up to correct the address before requesting another code." },
    { title: "Still cannot receive email", category: "Contact support", detail: "Contact support with the email address you used; never send your password." },
  ];
  const helpCategories = ["All topics", ...Array.from(new Set(helpArticles.map(article => article.category)))];
  const relatedArticles = (article: typeof helpArticles[number]) => helpArticles.filter(candidate => candidate.category === article.category && candidate.title !== article.title).slice(0, 2);
  const highlightTerms = (text: string) => {
    const term = helpSearch.trim();
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
    return parts.map((part, index) => part.toLowerCase() === term.toLowerCase() ? <mark key={index} className="rounded bg-[#F6DFA7] px-0.5 text-[#2C2A29]">{part}</mark> : part);
  };

  const filteredHelpArticles = helpArticles.filter(article => {
    const matchesCategory = helpCategory === "All topics" || article.category === helpCategory;
    const matchesSearch = `${article.title} ${article.detail} ${article.category}`.toLowerCase().includes(helpSearch.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const copySupportEmail = async () => {
    try {
      await navigator.clipboard.writeText("support@thepatientscompass.com");
      setSupportEmailCopied(true);
      window.setTimeout(() => setSupportEmailCopied(false), 2000);
    } catch {
      toast.error("Copy was unavailable. Please select the email address manually.");
    }
  };

  const submitFeedback = (articleTitle: string) => {
    setFeedbackSubmitted(value => ({ ...value, [articleTitle]: true }));
    setFeedbackUndoProgress(value => ({ ...value, [articleTitle]: 100 }));
    const startedAt = Date.now();
    const countdown = window.setInterval(() => {
      const progress = Math.max(0, 100 - ((Date.now() - startedAt) / 1600) * 100);
      setFeedbackUndoProgress(value => ({ ...value, [articleTitle]: progress }));
      if (progress <= 0) window.clearInterval(countdown);
    }, 50);
    window.setTimeout(() => setFeedbackFading(value => ({ ...value, [articleTitle]: true })), 1100);
    window.setTimeout(() => {
      setFeedbackSubmitted(value => ({ ...value, [articleTitle]: false }));
      setFeedbackFading(value => ({ ...value, [articleTitle]: false }));
      setFeedbackUndoProgress(value => ({ ...value, [articleTitle]: 0 }));
    }, 1600);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    await signup.mutateAsync({
      email,
      name,
      password,
    });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    setIsLoading(true);
    await verifyEmail.mutateAsync({
      token: verificationCode,
    });
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] py-12 px-4 flex items-center justify-center">
        <Card className="border-[#EBE6DC] shadow-lg max-w-md w-full">
          <CardHeader className="bg-gradient-to-r from-[#7E9A85] to-[#6A8571] text-white rounded-t-lg text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
            <CardTitle>Already Signed In</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <p className="text-[#5C5A59] mb-4">You're already logged in. Redirecting to dashboard...</p>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-[#7E9A85] hover:bg-[#6A8571] text-white"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] py-12 px-4 flex items-center justify-center">
        <Card className="border-[#EBE6DC] shadow-lg max-w-md w-full">
          <CardHeader className="bg-gradient-to-r from-[#7E9A85] to-[#6A8571] text-white rounded-t-lg text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
            <CardTitle>Email Verified!</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <p className="text-[#5C5A59] mb-4">Your account has been verified and is ready to use.</p>
            <p className="text-sm text-[#7E9A85] font-semibold">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] py-12 px-4">
      <div className="max-w-2xl mx-auto grid md:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2 text-[#7E9A85] hover:text-[#6A8571] mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <Card className="border-[#EBE6DC] shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#7E9A85] to-[#6A8571] text-white rounded-t-lg">
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription className="text-[#FFF5F0]">
                {step === "form" ? "Step 1 of 2: Your Information" : "Step 2 of 2: Verify Your Email"}
              </CardDescription>
            </CardHeader>

            {/* Progress Bar */}
            <div className="h-1 bg-[#EBE6DC]">
              <div 
                className="h-full bg-[#7E9A85] transition-all duration-300"
                style={{ width: step === "form" ? "50%" : "100%" }}
              />
            </div>

            <CardContent className="pt-6">
              <div className="mb-6" aria-label="Account setup progress">
                <div className="flex items-start justify-between">
                  {[{ key: "form", label: "Account" }, { key: "verification", label: "Verify" }, { key: "success", label: "Ready" }].map((item, index) => {
                    const activeIndex = step === "form" ? 0 : step === "verification" ? 1 : 2;
                    const completeStep = index < activeIndex;
                    const activeStep = index === activeIndex;
                    return <div key={item.key} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${completeStep || activeStep ? "bg-[#7E9A85] text-white" : "bg-[#EBE6DC] text-[#817B74]"}`} aria-current={activeStep ? "step" : undefined}>{completeStep ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span>
                        <span className={`mt-1 text-[11px] font-semibold ${activeStep ? "text-[#51715B]" : "text-[#817B74]"}`}>{item.label}</span>
                      </div>
                      {index < 2 && <span className={`mx-2 mt-4 h-0.5 flex-1 ${index < activeIndex ? "bg-[#7E9A85]" : "bg-[#EBE6DC]"}`} aria-hidden="true" />}
                    </div>;
                  })}
                </div>
              </div>
              {step === "form" ? (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#2C2A29] mb-2">Full Name</label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-[#EBE6DC] focus:border-[#7E9A85]"
                      disabled={isLoading}
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2C2A29] mb-2">Email Address</label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-[#EBE6DC] focus:border-[#7E9A85]"
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2C2A29] mb-2">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-[#EBE6DC] focus:border-[#7E9A85] pr-10"
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E9A85] hover:text-[#6A8571]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-[#7E9A85] mt-1">Use uppercase, lowercase, numbers, and symbols for strength</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2C2A29] mb-2">Confirm Password</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="border-[#EBE6DC] focus:border-[#7E9A85] pr-10"
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E9A85] hover:text-[#6A8571]"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Continue
                      </>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-[#EBE6DC]"></div>
                    <span className="text-xs text-[#7E9A85] font-semibold">OR</span>
                    <div className="flex-1 h-px bg-[#EBE6DC]"></div>
                  </div>

                  {/* Social Login Buttons */}
                  <div className="space-y-3">
                    <div ref={googleButtonRef} className="w-full" />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-[#EBE6DC] hover:bg-[#F9F6F0] text-[#2C2A29] disabled:cursor-not-allowed disabled:bg-[#F4F1EB] disabled:text-[#8D8983]"
                      disabled={isLoading || appleCallback.isPending || !appleConfigured}
                      onClick={handleAppleSignIn}
                      title={appleConfigured ? "Sign in with Apple" : "Requires Apple Developer Program configuration"}
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 13.5c-.91 0-1.82.55-2.25 1.51.5.89 1.86 1.51 3.37 1.51 1.9 0 3.44-1.54 3.44-3.44S19.95 9.14 18.05 9.14c-1.51 0-2.87.62-3.37 1.51.43.96 1.34 1.51 2.25 1.51 1.1 0 2-1.01 2-2.11s-.9-2.11-2-2.11c-.91 0-1.82.55-2.25 1.51-.5-.89-1.86-1.51-3.37-1.51-1.9 0-3.44 1.54-3.44 3.44s1.54 3.44 3.44 3.44c1.51 0 2.87-.62 3.37-1.51-.43-.96-1.34-1.51-2.25-1.51-1.1 0-2 1.01-2 2.11s.9 2.11 2 2.11z"/>
                      </svg>
                      {appleConfigured ? "Sign in with Apple" : "Apple sign-in unavailable"}
                    </Button>
                    {!appleConfigured && (
                      <p className="text-center text-[11px] leading-relaxed text-[#8D8983]">
                        Requires an Apple Developer Program account and configured Services ID.
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-[#5C5A59] text-center">
                    Already have an account?{" "}
                    <Link href="/signin" className="text-[#7E9A85] hover:text-[#6A8571] font-semibold">
                      Sign In
                    </Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="bg-[#F9F6F0] border border-[#EBE6DC] rounded-lg p-4 mb-4">
                    <p className="text-sm text-[#5C5A59]">
                      We've sent a verification code to <strong>{email}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2C2A29] mb-2">Verification Code</label>
                    <Input
                      type="text"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                      className="border-[#EBE6DC] focus:border-[#7E9A85] text-center text-lg tracking-widest font-mono"
                      maxLength={64}
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white"
                    disabled={isLoading || verificationCode.length < 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Verify Email
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setStep("form")}
                    disabled={isLoading}
                  >
                    Back to Sign Up
                  </Button>

                  {!email && <Input type="email" placeholder="Account email for resend" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" aria-label="Account email for resend" />}
                  <Button type="button" variant="ghost" className="w-full text-[#51715B]" onClick={handleResendVerification} disabled={!email.trim() || resendCooldown > 0 || resendVerification.isPending}>
                    {resendVerification.isPending ? "Sending…" : resendCooldown > 0 ? `Resend Email in ${resendCooldown}s` : "Resend Email"}
                  </Button>

                  <p className="text-xs text-[#5C5A59] text-center">
                    Didn't receive the email? Check your spam folder or use Resend Email. You can request another message once per minute.
                  </p>
                  <div className="mt-5 rounded-lg border border-[#EBE6DC] bg-[#F9F6F0] p-4 text-left">
                    <p className="text-sm font-semibold text-[#2C2A29]">Having trouble?</p>
                    <details className="mt-2 text-xs text-[#5C5A59]"><summary className="cursor-pointer font-semibold text-[#51715B]">Troubleshooting FAQ</summary><div className="mt-2 space-y-2 leading-5"><p><strong>Check spam:</strong> Search for “Patients Compass” and allow messages from our support address.</p><p><strong>Still waiting?</strong> Confirm the email address is correct, then use Resend Email after the cooldown ends.</p><p><strong>Code not accepted?</strong> Enter the newest six-character code; older codes may expire when a new message is requested.</p></div></details>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><a className="font-semibold text-[#51715B] underline-offset-2 hover:underline" href="mailto:support@thepatientscompass.com?subject=Verification%20email%20help">Contact Support</a><span className="text-[#817B74]">support@thepatientscompass.com</span><button type="button" onClick={copySupportEmail} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-[#51715B] hover:bg-white" aria-label="Copy support email">{supportEmailCopied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}{supportEmailCopied ? "Copied!" : "Copy"}</button></div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trust Badges & Social Proof */}
        <div className="md:col-span-1 space-y-4">
          {/* Trust Badges */}
          <Card className="border-[#EBE6DC] bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Why Join Us?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-[#7E9A85] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-[#2C2A29]">HIPAA Compliant</p>
                  <p className="text-xs text-[#5C5A59]">Your health data is secure</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Users className="w-5 h-5 text-[#7E9A85] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-[#2C2A29]">10,000+ Users</p>
                  <p className="text-xs text-[#5C5A59]">Join our growing community</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Zap className="w-5 h-5 text-[#7E9A85] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-[#2C2A29]">AI-Powered</p>
                  <p className="text-xs text-[#5C5A59]">Advanced lab analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Proof */}
          <Card className="border-[#EBE6DC] bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#7E9A85]">+47</p>
              <p className="text-xs text-[#5C5A59]">joined this week</p>
            </CardContent>
          </Card>

          {/* CTA Card */}
          <Card className="border-[#7E9A85] bg-gradient-to-br from-[#7E9A85] to-[#6A8571] text-white">
            <CardContent className="pt-6">
              <p className="text-sm font-semibold mb-2">Get Started Free</p>
              <p className="text-xs opacity-90">No credit card required. Full access to free tier.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* EDUCATIONAL CONTENT ONLY Footer */}
      <div className="text-center mt-12 text-xs text-[#7E9A85]">
        <p>EDUCATIONAL CONTENT ONLY - Not medical advice</p>
      </div>

      {step === "verification" && <div className="fixed bottom-24 right-5 z-40">
        {helpOpen && <div className="mb-3 w-72 rounded-2xl border border-[#EBE6DC] bg-white p-4 text-left shadow-xl" role="dialog" aria-label="Verification help">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#2C2A29]">Need help finishing?</p><p className="mt-1 text-xs leading-5 text-[#5C5A59]">Check spam, confirm the email address, or request a fresh code after the cooldown.</p></div><button type="button" onClick={() => setHelpOpen(false)} aria-label="Close verification help" className="rounded p-1 text-[#817B74] hover:bg-[#F9F6F0]"><X className="h-4 w-4" /></button></div>
          <label className="mt-3 block"><span className="sr-only">Search verification help</span><input value={helpSearch} onChange={event => setHelpSearch(event.target.value)} placeholder="Search help articles" className="h-9 w-full rounded-md border border-[#EBE6DC] bg-[#F9F6F0] px-3 text-xs text-[#2C2A29] outline-none focus:border-[#7E9A85]" /></label>
          <label className="mt-2 block"><span className="sr-only">Filter help category</span><select aria-label="Filter help category" value={helpCategory} onChange={event => setHelpCategory(event.target.value)} className="h-8 w-full rounded-md border border-[#EBE6DC] bg-white px-2 text-xs text-[#2C2A29] outline-none focus:border-[#7E9A85]">{helpCategories.map(category => <option key={category}>{category}</option>)}</select></label>
          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1 text-xs text-[#5C5A59]" role="list" aria-label="Verification help articles">
            {filteredHelpArticles.length > 0 ? filteredHelpArticles.map(article => (
              <div
                key={article.title}
                className={`rounded-lg border border-[#EBE6DC] bg-[#F9F6F0] p-2 transition-shadow ${expandedArticle === article.title ? "shadow-md ring-1 ring-[#BFD0C1]" : ""}`}
                role="listitem"
                tabIndex={0}
                aria-label={`${article.category}: ${article.title}`}
                onClick={() => setExpandedArticle(article.title)}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setExpandedArticle(article.title);
                  }
                }}
              >
                <p><span className="font-semibold uppercase tracking-wide text-[10px] text-[#7E9A85]">{article.category}</span><br /><strong>{highlightTerms(article.title)}:</strong> {highlightTerms(article.detail)}</p>
                {expandedArticle === article.title && (
                  <div className="mt-2 border-t border-[#E8E0D4] pt-2">
                    <button type="button" className="mb-2 text-[11px] font-semibold text-[#51715B] hover:underline" onClick={event => { event.stopPropagation(); setExpandedArticle(null); }}>← Back to search results</button>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7E9A85]">Related Articles</p>
                    <div className="mt-1 space-y-1">
                      {relatedArticles(article).length > 0 ? relatedArticles(article).map(related => (
                        <button key={related.title} type="button" title={related.detail} className="block text-left text-[11px] font-semibold text-[#51715B] hover:underline" onTouchStart={() => setRelatedPreview(related.detail)} onClick={event => { event.stopPropagation(); setRelatedPreview(related.detail); setExpandedArticle(related.title); }}>{related.title}<span aria-hidden="true" className="ml-1 inline-flex items-center gap-1 text-[10px] font-normal text-[#7E9A85] sm:hidden"><Eye className="h-3 w-3" />Preview</span></button>
                      )) : <p className="text-[11px]">Explore another category for more help.</p>}
                    </div>
                    {relatedPreview && <p role="tooltip" aria-live="polite" aria-label="Related article preview; swipe to dismiss" onTouchStart={event => { previewTouchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }} onTouchEnd={event => { const start = previewTouchStart.current; if (start) { const dx = Math.abs(event.changedTouches[0].clientX - start.x); const dy = Math.abs(event.changedTouches[0].clientY - start.y); if (Math.max(dx, dy) > 60) setRelatedPreview(null); } previewTouchStart.current = null; }} className="mt-2 touch-pan-y rounded-md bg-[#FFF8E8] p-2 text-[11px] text-[#5C5A59]">Preview: {relatedPreview}<span className="ml-1 text-[10px] text-[#817B74] sm:hidden">Swipe to dismiss</span></p>}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2" role="group" aria-label={`Was ${article.title} helpful?`}>
                  <span className="text-[10px] text-[#817B74]">Helpful?</span>
                  <button type="button" onClick={event => { event.stopPropagation(); setArticleFeedback(value => ({ ...value, [article.title]: "helpful" })); setFeedbackPulse(`${article.title}-helpful`); window.setTimeout(() => setFeedbackPulse(null), 300); }} aria-label={`Mark ${article.title} helpful`} aria-pressed={articleFeedback[article.title] === "helpful"} className={`rounded p-1 transition-transform ${feedbackPulse === `${article.title}-helpful` ? "scale-125" : ""} ${articleFeedback[article.title] === "helpful" ? "bg-[#DDEBDD] text-[#2F7D4A]" : "text-[#817B74] hover:bg-white"}`}><ThumbsUp className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={event => { event.stopPropagation(); setArticleFeedback(value => ({ ...value, [article.title]: "not-helpful" })); setFeedbackPulse(`${article.title}-not-helpful`); window.setTimeout(() => setFeedbackPulse(null), 300); }} aria-label={`Mark ${article.title} not helpful`} aria-pressed={articleFeedback[article.title] === "not-helpful"} className={`rounded p-1 transition-transform ${feedbackPulse === `${article.title}-not-helpful` ? "scale-125" : ""} ${articleFeedback[article.title] === "not-helpful" ? "bg-[#F6E2DE] text-red-700" : "text-[#817B74] hover:bg-white"}`}><ThumbsDown className="h-3.5 w-3.5" /></button>
                  {articleFeedback[article.title] && <span className="text-[10px] text-[#51715B]" role="status">Thanks for your feedback.</span>}
                </div>
                {articleFeedback[article.title] === "not-helpful" && (feedbackSubmitted[article.title] ? <div role="status" className={`mt-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-[#2F7D4A] transition-opacity duration-500 ${feedbackFading[article.title] ? "opacity-0" : "opacity-100"}`}><span>Feedback submitted — thank you.</span><button type="button" aria-label="Undo" onClick={event => { event.stopPropagation(); setFeedbackSubmitted(value => ({ ...value, [article.title]: false })); setFeedbackFading(value => ({ ...value, [article.title]: false })); setFeedbackUndoProgress(value => ({ ...value, [article.title]: 0 })); }} className="relative overflow-hidden rounded-md border border-[#7E9A85] px-2 py-1 text-[10px] text-[#51715B] hover:bg-[#F0F6F0]"><span className="relative z-10">Undo</span><span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[#7E9A85] transition-transform duration-75" style={{ transform: `scaleX(${(feedbackUndoProgress[article.title] || 0) / 100})` }} /></button></div> : <div className="mt-2"><label className="block"><span className="sr-only">Improvement category for {article.title}</span><select aria-label="Improvement category" value={feedbackCategory[article.title] || ""} onChange={event => setFeedbackCategory(value => ({ ...value, [article.title]: event.target.value }))} onClick={event => event.stopPropagation()} className="mb-2 h-8 w-full rounded-md border border-[#EBE6DC] bg-white px-2 text-[11px] text-[#2C2A29] outline-none focus:border-[#7E9A85]"><option value="">Choose a category</option><option>Email delivery</option><option>Instructions</option><option>Accessibility</option><option>Other</option></select>{feedbackCategory[article.title] === "Other" && <input aria-label="Custom improvement category" value={feedbackCustomCategory[article.title] || ""} onChange={event => setFeedbackCustomCategory(value => ({ ...value, [article.title]: event.target.value }))} onClick={event => event.stopPropagation()} placeholder="Specify your category" maxLength={80} className="mb-2 h-8 w-full rounded-md border border-[#EBE6DC] bg-white px-2 text-[11px] text-[#2C2A29] outline-none focus:border-[#7E9A85]" />}</label><label className="block"><span className="sr-only">What could we improve? for {article.title}</span><input value={feedbackNote[article.title] || ""} onChange={event => setFeedbackNote(value => ({ ...value, [article.title]: event.target.value }))} onClick={event => event.stopPropagation()} placeholder="What could we improve? (optional)" maxLength={240} className="h-8 w-full rounded-md border border-[#EBE6DC] bg-white px-2 text-[11px] text-[#2C2A29] outline-none focus:border-[#7E9A85]" /></label><div className="mt-1 flex items-center justify-between"><span className="text-[10px] text-[#817B74]">{(feedbackNote[article.title] || "").length}/240</span><button type="button" onClick={event => { event.stopPropagation(); submitFeedback(article.title); }} className="rounded-md bg-[#51715B] px-2 py-1 text-[10px] font-semibold text-white hover:bg-[#3F6048]">Send feedback</button></div></div>)}
              </div>
            )) : <p tabIndex={0}>No matching article. Contact support for help.</p>}
          </div>
          <a className="mt-3 inline-block text-xs font-semibold text-[#51715B] hover:underline" href="mailto:support@thepatientscompass.com?subject=Verification%20help">Email support</a>
        </div>}
        <button type="button" onClick={() => setHelpOpen(value => !value)} className="flex items-center gap-2 rounded-full bg-[#51715B] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105" aria-expanded={helpOpen} aria-label={helpOpen ? "Close verification help" : "Open verification help"}><HelpCircle className="h-5 w-5" aria-hidden="true" />Help</button>
      </div>}
    </div>
  );
}
