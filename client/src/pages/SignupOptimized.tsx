import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, CheckCircle2, Loader2, Eye, EyeOff, Shield, Users, Zap } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function SignupOptimized() {
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<"form" | "verification" | "success">("form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const signup = trpc.auth.signup.useMutation({
    onSuccess: () => {
      setStep("verification");
      toast.success("Account created! Check your email for verification code.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create account");
      setIsLoading(false);
    },
  });

  const verifyEmail = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStep("success");
      toast.success("Email verified successfully! Redirecting...");
      setTimeout(() => {
        window.location.href = "/signin";
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || "Invalid verification code");
      setIsLoading(false);
    },
  });

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
                      maxLength={6}
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white"
                    disabled={isLoading || verificationCode.length !== 6}
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

                  <p className="text-xs text-[#5C5A59] text-center">
                    Didn't receive the code? Check your spam folder or request a new one.
                  </p>
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
                  <p className="text-sm font-semibold text-[#2C2A29]">Secure Connection</p>
                  <p className="text-xs text-[#5C5A59]">Your information is encrypted in transit</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Users className="w-5 h-5 text-[#7E9A85] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-[#2C2A29]">Built by a Lab Scientist</p>
                  <p className="text-xs text-[#5C5A59]">20+ years of clinical lab experience</p>
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
    </div>
  );
}
