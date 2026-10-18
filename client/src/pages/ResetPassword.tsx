import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

export default function ResetPassword() {
  const queryToken = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const [token, setToken] = useState(queryToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const passwordMatch = confirmation.length > 0 && password === confirmation;
  const passwordMismatch = confirmation.length > 0 && password !== confirmation;
  const strength = useMemo(() => {
    const criteria = [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "At least 12 characters", met: password.length >= 12 },
      { label: "Uppercase and lowercase letters", met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
      { label: "A number", met: /\d/.test(password) },
      { label: "A symbol", met: /[^A-Za-z0-9]/.test(password) },
    ];
    const score = criteria.filter(item => item.met).length;
    return { criteria, score, label: score <= 1 ? "Too weak" : score === 2 ? "Fair" : score === 3 ? "Good" : score === 4 ? "Strong" : "Very strong" };
  }, [password]);

  const requestReset = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: data => setMessage(data.message),
    onError: error => setMessage(error.message),
  });
  const resetPassword = trpc.auth.resetPassword.useMutation({
    onSuccess: data => { setComplete(true); setMessage(data.message); },
    onError: error => setMessage(error.message),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!token.trim()) { setMessage("Paste the reset token from your email to continue."); return; }
    if (password.length < 8) { setMessage("Password must be at least 8 characters."); return; }
    if (password !== confirmation) { setMessage("Passwords do not match."); return; }
    resetPassword.mutate({ token: token.trim(), newPassword: password });
  };

  return <main className="flex min-h-screen items-center justify-center bg-[#F7F4EF] px-4 py-16">
    <Card className="w-full max-w-md rounded-2xl border-[#EBE6DC] bg-white shadow-md">
      <CardContent className="p-8">
        <Link href="/signin"><span className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm text-[#5C5A59] hover:text-[#2C2A29]"><ArrowLeft className="h-4 w-4" />Back to sign in</span></Link>
        <div className="mb-6 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#BFD0C1] bg-[#F3F8F3] text-[#51715B]">{complete ? <CheckCircle2 className="h-7 w-7" /> : <LockKeyhole className="h-7 w-7" />}</div><h1 className="mt-4 font-serif text-2xl font-bold text-[#2C2A29]">{complete ? "Password updated" : "Reset your password"}</h1><p className="mt-2 text-sm leading-6 text-[#5C5A59]">{complete ? "Your password was changed securely. You can now sign in with the new password." : "Use the secure token from your email to choose a new password."}</p></div>
        {complete ? <Link href="/signin?status=reset"><Button className="w-full bg-[#2C2A29] text-white hover:bg-[#1A1918]">Continue to sign in</Button></Link> : <form onSubmit={handleSubmit} className="space-y-4"><div><Label htmlFor="reset-token">Reset token</Label><Input id="reset-token" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste your reset token" autoComplete="one-time-code" required /></div><div><Label htmlFor="new-password">New password</Label><div className="relative"><Input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required aria-describedby="password-strength" className="pr-11" /><button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#7E9A85]" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div><div id="password-strength" aria-live="polite" className="space-y-2"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-[#5C5A59]">Password strength</span><span className={strength.score >= 4 ? "font-semibold text-[#51715B]" : "text-[#817B74]"}>{strength.label}</span></div><div className="flex gap-1" aria-hidden="true">{[0, 1, 2, 3, 4].map(index => <span key={index} className={`h-1.5 flex-1 rounded-full transition-colors ${index < strength.score ? (strength.score >= 4 ? "bg-[#7E9A85]" : strength.score >= 3 ? "bg-amber-400" : "bg-red-400") : "bg-[#EBE6DC]"}`} />)}</div><ul className="grid grid-cols-1 gap-1 pt-1 text-[11px] text-[#817B74] sm:grid-cols-2">{strength.criteria.map(item => <li key={item.label} className={item.met ? "text-[#51715B]" : ""}>{item.met ? "✓" : "○"} {item.label}</li>)}</ul></div><div><Label htmlFor="confirm-password">Confirm new password</Label><div className="relative"><Input id="confirm-password" type={showConfirmation ? "text" : "password"} value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="new-password" required className="pr-11" /><button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#7E9A85]" aria-label={showConfirmation ? "Hide confirmation" : "Show confirmation"} onClick={() => setShowConfirmation(value => !value)}>{showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>{confirmation.length > 0 && <p className={`mt-1 text-xs ${passwordMatch ? "text-[#51715B]" : "text-red-700"}`} role="status">{passwordMatch ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4 animate-in fade-in zoom-in-95 duration-200 text-[#2F7D4A]" aria-hidden="true" />Passwords match.</span> : "Passwords do not match yet."}</p>}</div><Button type="submit" className="w-full bg-[#2C2A29] text-white hover:bg-[#1A1918]" disabled={resetPassword.isPending}>{resetPassword.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating password…</> : <><KeyRound className="mr-2 h-4 w-4" />Update password</>}</Button></form>}
        {message && <p className="mt-5 rounded-xl border border-[#BFD0C1] bg-[#F3F8F3] p-3 text-sm leading-5 text-[#45614D]" role="status">{message}</p>}
        {!complete && <div className="mt-7 border-t border-[#EBE6DC] pt-5"><p className="text-xs font-semibold uppercase tracking-widest text-[#7E9A85]">Need a new link?</p><div className="mt-3 flex gap-2"><Input aria-label="Account email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Account email" /><Button type="button" variant="outline" onClick={() => email && requestReset.mutate({ email })} disabled={!email || requestReset.isPending}>Resend</Button></div></div>}
      </CardContent>
    </Card>
  </main>;
}
