import { Timer } from "lucide-react";
import { EMAIL_LINK_COOLDOWN_SECONDS } from "@/lib/authFlow";

interface EmailLinkCooldownIndicatorProps {
  seconds: number;
  sent: boolean;
}

export default function EmailLinkCooldownIndicator({ seconds, sent }: EmailLinkCooldownIndicatorProps) {
  if (!sent && seconds <= 0) return null;
  const remaining = Math.max(0, Math.min(EMAIL_LINK_COOLDOWN_SECONDS, seconds));
  const progress = Math.round((remaining / EMAIL_LINK_COOLDOWN_SECONDS) * 100);
  const announcement = remaining > 0
    ? `Email link resend available in ${remaining} seconds.`
    : "Email link resend is now available.";

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite" aria-atomic="true">
      <div className="flex items-center justify-between gap-2 text-[11px] text-[#817B74]">
        <span className="inline-flex items-center gap-1">
          <Timer className="h-3.5 w-3.5" aria-hidden="true" />
          {remaining > 0 ? `Resend available in ${remaining}s` : "Resend available"}
        </span>
        <span>{progress}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-[#DDE9DE]"
        role="progressbar"
        aria-label="Email-link resend cooldown"
        aria-valuemin={0}
        aria-valuemax={EMAIL_LINK_COOLDOWN_SECONDS}
        aria-valuenow={remaining}
      >
        <div
          className="h-full rounded-full bg-[#7E9A85] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="sr-only">{announcement}</span>
    </div>
  );
}
