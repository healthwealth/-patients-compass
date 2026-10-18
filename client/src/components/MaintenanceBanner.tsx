import { useState } from "react";
import { publicConfig } from "@/lib/publicConfig";
import { X, Bell, CheckCircle2, Loader2, Info, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";

const DISMISSED_KEY = "maintenance-banner-dismissed-v1";

// ─── Feature flag ─────────────────────────────────────────────────────────────
// Keep the banner hidden by default. Set VITE_SHOW_MAINTENANCE_BANNER=true only
// for a verified, time-bound account-access update.
const SHOW_BANNER = publicConfig.showMaintenanceBanner;

export default function MaintenanceBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: countData } = trpc.email.waitlistCount.useQuery(undefined, {
    staleTime: 60_000, // refresh at most once per minute
    retry: false,
  });

  const joinWaitlist = trpc.email.joinWaitlist.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // ignore storage errors
    }
    setDismissed(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    joinWaitlist.mutate({ email: email.trim() });
  };

  if (!SHOW_BANNER || dismissed) return null;

  const count = countData?.count ?? 0;
  const countLabel =
    count > 0 ? `Join ${count.toLocaleString()} other${count === 1 ? "" : "s"} waiting` : null;

  return (
    <div
      role="banner"
      aria-label="Account access update"
      className="w-full bg-[#F4F8F4] border-b border-[#D4E2D6] px-4 py-2.5 z-50 relative"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        {/* Icon + message */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Info className="w-4 h-4 text-[#7E9A85] flex-shrink-0" />
          <span className="text-xs font-semibold text-[#2C2A29]">
            We’re refining account access.
          </span>
          <span className="text-xs text-[#5C5A59] hidden sm:inline">
            Get an update:
          </span>
        </div>

        {/* Inline form or success */}
        <div className="flex-1 min-w-0">
          {submitted ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#7E9A85] flex-shrink-0" />
              <span className="text-xs font-semibold text-[#7E9A85]">
                You're on the list — we'll email you when sign-in is restored.
              </span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
            >
              <span className="text-xs text-[#5C5A59] sm:hidden">
                Get an update:
              </span>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={joinWaitlist.isPending}
                className="
                  h-7 px-3 text-xs rounded-lg border border-[#BFD2C2]
                  bg-white text-[#2C2A29] placeholder-[#9A9896]
                  focus:outline-none focus:ring-2 focus:ring-[#7E9A85] focus:border-[#7E9A85]
                  disabled:opacity-60
                  w-48 sm:w-56
                "
              />
              <button
                type="submit"
                disabled={joinWaitlist.isPending || !email.trim()}
                className="
                  h-7 px-3 text-xs font-semibold rounded-lg
                  bg-[#7E9A85] hover:bg-[#6A8571] text-white
                  flex items-center gap-1.5
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-colors duration-150
                  active:scale-[0.97]
                "
              >
                {joinWaitlist.isPending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Joining…</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3 h-3" />
                    <span>Notify Me</span>
                  </>
                )}
              </button>
              {joinWaitlist.isError && (
                <span className="text-xs text-red-600">
                  Error — please try again.
                </span>
              )}
              {/* Live social-proof count */}
              {countLabel && !joinWaitlist.isPending && (
                <span className="flex items-center gap-1 text-xs text-[#5C5A59] whitespace-nowrap">
                  <Users className="w-3 h-3" />
                  {countLabel}
                </span>
              )}
            </form>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss maintenance notice"
          className="
            flex-shrink-0 p-1 rounded-md text-[#5C5A59]
            hover:bg-[#E2EEE4] hover:text-[#2C2A29]
            transition-colors duration-150
            self-start sm:self-center
          "
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
