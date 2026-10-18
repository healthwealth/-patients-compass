import { useState, useEffect } from "react";
import { publicConfig } from "@/lib/publicConfig";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { initializeGTM, trackEvent } from "@/lib/gtm";
import {
  COOKIE_COPY_VARIANTS,
  resolveCookieCopyVariant,
  type CookieCopyVariant,
} from "@/lib/cookieConsentExperiment";

const CONSENT_KEY = "patientscompass_cookie_consent";
const COPY_VARIANT_KEY = "patientscompass_cookie_copy_variant";

type ConsentState = "accepted" | "declined" | null;

export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [visible, setVisible] = useState(false);
  const [copyVariant, setCopyVariant] = useState<CookieCopyVariant>("concise");

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentState | null;
    const storedVariant = localStorage.getItem(COPY_VARIANT_KEY);
    const variant = resolveCookieCopyVariant(storedVariant);

    if (!storedVariant) localStorage.setItem(COPY_VARIANT_KEY, variant);
    setCopyVariant(variant);

    if (!stored) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
    if (stored === "accepted") {
      initializeGTM(publicConfig.gtmContainerId);
    }
    setConsent(stored);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    initializeGTM(publicConfig.gtmContainerId);
    trackEvent("cookie_consent_experiment", {
      copy_variant: copyVariant,
      decision: "accepted",
    });
    setConsent("accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    trackEvent("cookie_consent_experiment", {
      copy_variant: copyVariant,
      decision: "declined",
    });
    setConsent("declined");
    setVisible(false);
  };

  if (!visible || consent !== null) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[100] sm:inset-x-0 sm:bottom-0 sm:p-6"
      style={{
        animation: "slideUpConsent 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards",
      }}
    >
      <style>{`
        @keyframes slideUpConsent {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .cookie-banner { transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); }
        }
      `}</style>

      <div className="cookie-banner relative mx-auto w-full max-w-sm bg-[#2C2A29] text-white rounded-2xl shadow-xl shadow-[#2C2A29]/35 border border-[#3D3A39] p-4 sm:max-w-3xl sm:p-6 sm:flex sm:items-center sm:gap-4">
        <button
          onClick={handleDecline}
          className="absolute right-2.5 top-2.5 rounded-lg p-1 text-[#9E9A90] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85]"
          aria-label="Dismiss cookie banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Icon */}
        <div className="hidden bg-[#7E9A85]/20 text-[#7E9A85] p-2.5 rounded-xl shrink-0 sm:block">
          <Cookie className="w-5 h-5" />
        </div>

        {/* Text */}
        <div className="flex-1 space-y-1 pr-5 sm:pr-0">
          <p className="text-[13px] font-semibold text-white sm:text-sm">
            We use cookies to improve your experience
          </p>
          <p className="text-[11px] leading-4 text-[#C5C0B5] sm:text-xs sm:leading-relaxed">
            {COOKIE_COPY_VARIANTS[copyVariant]}{" "}
            <Link href="/privacy" className="text-[#7E9A85] hover:text-[#A3C4A8] underline underline-offset-2 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-3 flex w-full items-center gap-2 pr-5 sm:mt-0 sm:w-auto sm:pr-0 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-1 rounded-xl border-[#4E4B4A] bg-transparent text-xs font-semibold text-[#C5C0B5] hover:bg-[#3D3A39] hover:text-white sm:h-9 sm:flex-none"
            onClick={handleDecline}
          >
            Decline
          </Button>
          <Button
            size="sm"
            className="h-8 flex-1 rounded-xl bg-[#7E9A85] text-xs font-semibold text-white shadow-sm transition-transform duration-150 hover:bg-[#6A8571] active:scale-[0.97] sm:h-9 sm:flex-none"
            onClick={handleAccept}
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
