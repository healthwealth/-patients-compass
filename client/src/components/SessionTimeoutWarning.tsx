import { CheckCircle2, Clock3, RefreshCw, ShieldAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function SessionTimeoutWarning() {
  const { sessionWarning, extendSession } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [isExtending, setIsExtending] = useState(false);
  const [extensionError, setExtensionError] = useState("");
  const [extensionSuccess, setExtensionSuccess] = useState(false);

  useEffect(() => {
    if (!sessionWarning) return;
    const update = () => {
      const expiresAt = Number(localStorage.getItem("patients-compass-session-expires-at"));
      setSecondsRemaining(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [sessionWarning]);

  const handleExtend = async () => {
    setIsExtending(true);
    setExtensionError("");
    try {
      await extendSession();
      setExtensionSuccess(true);
      window.setTimeout(() => setDismissed(true), 3500);
    } catch {
      setExtensionError("We couldn't extend the session. Please sign in again.");
    } finally {
      setIsExtending(false);
    }
  };

  if ((!sessionWarning && !extensionSuccess) || dismissed) return null;
  const minutes = Math.floor(secondsRemaining / 60).toString().padStart(2, "0");
  const seconds = (secondsRemaining % 60).toString().padStart(2, "0");

  return (
    <div className={`fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-xl rounded-2xl border bg-white p-4 shadow-xl ${extensionSuccess ? "border-[#BFD0C1]" : "border-amber-200"}`} role="alert">
      <div className="flex items-start gap-3">
        <div className={`rounded-full p-2 ${extensionSuccess ? "bg-[#F3F8F3] text-[#51715B]" : "bg-amber-50 text-amber-700"}`}>
          {extensionSuccess ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          {extensionSuccess ? <>
            <p className="font-semibold text-[#2C2A29]">Session extended successfully</p>
            <p className="mt-1 text-sm leading-5 text-[#45614D]">Your session is active for several more hours. You can continue without losing work.</p>
          </> : <>
            <p className="font-semibold text-[#2C2A29]">Your session will expire soon</p>
            <p className="mt-1 text-sm leading-5 text-[#5C5A59]">Save your work and sign in again to continue securely.</p>
            <div className="mt-3 flex items-center gap-2"><span className="rounded-md bg-amber-50 px-2.5 py-1 font-mono text-sm font-bold tabular-nums text-amber-800" aria-label={`${minutes} minutes and ${seconds} seconds remaining`}>{minutes}:{seconds}</span><span className="text-xs text-[#817B74]">remaining</span></div>
            <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" className="bg-[#7E9A85] text-white hover:bg-[#6A8571]" onClick={handleExtend} disabled={isExtending}>{isExtending ? <><RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />Extending…</> : <><RefreshCw className="mr-1.5 h-4 w-4" />Extend session</>}</Button><Button size="sm" className="bg-[#2C2A29] text-white hover:bg-[#1A1918]" onClick={() => { window.location.href = "/signin?status=expired" }}><Clock3 className="mr-1.5 h-4 w-4" />Sign in again</Button><Button size="sm" variant="ghost" className="text-[#5C5A59]" onClick={() => setDismissed(true)}>Dismiss</Button></div>
            {extensionError && <p className="mt-2 text-xs text-red-700" role="status">{extensionError}</p>}
          </>}
        </div>
        <button type="button" aria-label="Dismiss session warning" className="rounded-md p-1 text-[#817B74] hover:bg-[#F7F4EF]" onClick={() => setDismissed(true)}><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
