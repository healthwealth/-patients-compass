import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AdminSignup() {
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<"form" | "verification" | "success">("form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendVerificationEmail = trpc.admin.sendVerificationEmail.useMutation({
    onSuccess: () => {
      setStep("verification");
      toast.success("Verification email sent! Check your inbox.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send verification email");
      setIsLoading(false);
    },
  });

  const verifyEmail = trpc.admin.verifyAdminEmail.useMutation({
    onSuccess: () => {
      setStep("success");
      toast.success("Admin account verified successfully!");
      setTimeout(() => {
        window.location.href = "/admin/control";
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || "Invalid verification code");
      setIsLoading(false);
    },
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    await sendVerificationEmail.mutateAsync({
      email,
      name,
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
      email,
      code: verificationCode,
    });
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] py-12 px-4 flex items-center justify-center">
        <Card className="border-[#EBE6DC] shadow-lg max-w-md w-full">
          <CardHeader className="bg-gradient-to-r from-[#7E9A85] to-[#6A8571] text-white rounded-t-lg text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
            <CardTitle>Admin Account Created!</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <p className="text-[#5C5A59] mb-4">Your admin account has been verified and is ready to use.</p>
            <p className="text-sm text-[#7E9A85] font-semibold">Redirecting to Admin Control Panel...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] py-12 px-4">
      <div className="max-w-md mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#7E9A85] hover:text-[#6A8571] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card className="border-[#EBE6DC] shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#7E9A85] to-[#6A8571] text-white rounded-t-lg">
            <CardTitle>Admin Sign Up</CardTitle>
            <CardDescription className="text-[#FFF5F0]">
              {step === "form" ? "Create your admin account" : "Verify your email address"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {step === "form" ? (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2C2A29] mb-2">Full Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-[#EBE6DC] focus:border-[#7E9A85]"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2C2A29] mb-2">Email Address</label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-[#EBE6DC] focus:border-[#7E9A85]"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Verification Email
                    </>
                  )}
                </Button>

                <p className="text-xs text-[#5C5A59] text-center">
                  A verification code will be sent to your email address.
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
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                    className="border-[#EBE6DC] focus:border-[#7E9A85] text-center text-lg tracking-widest"
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
    </div>
  );
}
