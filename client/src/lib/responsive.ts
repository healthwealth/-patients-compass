/**
 * Mobile Responsiveness Utilities
 * Provides hooks and utilities for responsive design
 */

import { useEffect, useState } from "react";

// Breakpoints matching Tailwind CSS
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook to detect current breakpoint
 * Usage: const breakpoint = useBreakpoint(); // 'sm' | 'md' | 'lg' | etc
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("md");

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < BREAKPOINTS.sm) {
        setBreakpoint("xs");
      } else if (width < BREAKPOINTS.md) {
        setBreakpoint("sm");
      } else if (width < BREAKPOINTS.lg) {
        setBreakpoint("md");
      } else if (width < BREAKPOINTS.xl) {
        setBreakpoint("lg");
      } else if (width < BREAKPOINTS["2xl"]) {
        setBreakpoint("xl");
      } else {
        setBreakpoint("2xl");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return breakpoint;
}

/**
 * Hook to check if screen is mobile
 */
export function useIsMobile(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === "xs" || breakpoint === "sm";
}

/**
 * Hook to check if screen is tablet or larger
 */
export function useIsTablet(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === "md" || breakpoint === "lg";
}

/**
 * Hook to check if screen is desktop or larger
 */
export function useIsDesktop(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === "lg" || breakpoint === "xl" || breakpoint === "2xl";
}

/**
 * Get responsive class names based on breakpoint
 */
export function getResponsiveClasses(breakpoint: Breakpoint): Record<string, string> {
  return {
    container: "w-full px-4 sm:px-6 md:px-8 lg:px-10 mx-auto",
    heading: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold",
    subheading: "text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold",
    body: "text-base sm:text-lg md:text-base lg:text-lg",
    button: "px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3",
    input: "px-3 py-2 sm:px-4 sm:py-2.5 md:px-4 md:py-3 text-sm sm:text-base",
    gap: breakpoint === "xs" ? "gap-2" : breakpoint === "sm" ? "gap-3" : "gap-4",
    gridCols:
      breakpoint === "xs"
        ? "grid-cols-1"
        : breakpoint === "sm"
          ? "grid-cols-2"
          : breakpoint === "md"
            ? "grid-cols-2"
            : "grid-cols-3",
  };
}

/**
 * Responsive image utility
 * Generates srcset for responsive images
 */
export function getResponsiveImageSrcSet(baseUrl: string, sizes: number[] = [320, 640, 1024, 1280]): string {
  return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(", ");
}

/**
 * Mobile-first media query helper
 */
export const media = {
  sm: "@media (min-width: 640px)",
  md: "@media (min-width: 768px)",
  lg: "@media (min-width: 1024px)",
  xl: "@media (min-width: 1280px)",
  "2xl": "@media (min-width: 1536px)",
  maxSm: "@media (max-width: 639px)",
  maxMd: "@media (max-width: 767px)",
  maxLg: "@media (max-width: 1023px)",
  maxXl: "@media (max-width: 1279px)",
} as const;
