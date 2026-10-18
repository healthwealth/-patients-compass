export const HEALTH_COMPANION_PORTRAITS = [
  {
    key: "european_executive",
    label: "Sonya M. founder portrait",
    description: "The founder’s real portrait for a consistent, human Health Companion identity.",
    url: "/manus-storage/sonya-professional-portrait_c5acc8f2.webp",
    altText: "Health Companion, Sonya M., Patients Compass founder and health educator",
  },
  {
    key: "sage_educator",
    label: "Sage educator",
    description: "Soft sage blazer with a warm, approachable education-focused presence.",
    url: "/manus-storage/health-companion-professional-portrait_2419cb90.png",
    altText: "Health Companion AI educator in a soft sage blazer",
  },
  {
    key: "black_professional",
    label: "Plum educator",
    description: "Confident Black professional with a warm editorial presence and tailored plum blazer.",
    url: "/manus-storage/health-companion-black-professional_bb3001c0.png",
    altText: "Black Health Companion AI educator in a tailored plum blazer",
  },
  {
    key: "east_asian_professional",
    label: "Teal educator",
    description: "Accomplished East Asian professional with a thoughtful presence and muted teal blazer.",
    url: "/manus-storage/health-companion-east-asian-professional_8e824bb6.png",
    altText: "East Asian Health Companion AI educator in a muted teal blazer",
  },
  {
    key: "mediterranean_professional",
    label: "Charcoal educator",
    description: "Professional Mediterranean European man with an approachable editorial presence.",
    url: "/manus-storage/health-companion-male-professional_4a5288c0.png",
    altText: "Male Health Companion AI educator in a tailored charcoal blazer",
  },
] as const;

export type HealthCompanionPortraitKey = typeof HEALTH_COMPANION_PORTRAITS[number]["key"];
export const DEFAULT_HEALTH_COMPANION_PORTRAIT_KEY: HealthCompanionPortraitKey = "european_executive";

export function getHealthCompanionPortrait(key?: string | null) {
  return HEALTH_COMPANION_PORTRAITS.find((portrait) => portrait.key === key)
    ?? HEALTH_COMPANION_PORTRAITS.find((portrait) => portrait.key === DEFAULT_HEALTH_COMPANION_PORTRAIT_KEY)!;
}
