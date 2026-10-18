export type CookieCopyVariant = "standard" | "concise";

export const COOKIE_COPY_VARIANTS: Record<CookieCopyVariant, string> = {
  standard:
    "We use essential cookies to keep the site running and optional analytics cookies to understand how visitors use our platform. No personal health data is ever shared with third parties.",
  concise:
    "Essential cookies keep the site working. Optional analytics help us improve, and we never share personal health data.",
};

export function resolveCookieCopyVariant(
  storedVariant: string | null,
  randomValue: number = Math.random()
): CookieCopyVariant {
  if (storedVariant === "standard" || storedVariant === "concise") return storedVariant;
  return randomValue < 0.5 ? "standard" : "concise";
}
