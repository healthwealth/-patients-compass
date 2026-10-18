import { useEffect } from "react";
import { useLocation } from "wouter";
import * as analytics from "@/lib/analytics";

/**
 * Hook to track page views and initialize analytics
 */
export function useAnalytics() {
  const [location] = useLocation();

  // Track page view on route change
  useEffect(() => {
    analytics.trackPageView(location);
  }, [location]);

  return analytics;
}

/**
 * Hook to track time on page
 */
export function useTimeOnPage(pageName: string) {
  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const timeSpent = (Date.now() - startTime) / 1000;
      analytics.trackTimeOnPage(pageName, timeSpent);
    };
  }, [pageName]);
}

/**
 * Hook to track scroll depth
 */
export function useScrollDepth() {
  useEffect(() => {
    let maxScroll = 0;

    const handleScroll = () => {
      const scrollPercentage =
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
        100;

      if (scrollPercentage > maxScroll) {
        maxScroll = scrollPercentage;

        // Track at 25%, 50%, 75%, 100%
        if (maxScroll >= 25 && maxScroll < 50) {
          analytics.trackEngagement("scroll");
        } else if (maxScroll >= 50 && maxScroll < 75) {
          analytics.trackEngagement("scroll");
        } else if (maxScroll >= 75 && maxScroll < 100) {
          analytics.trackEngagement("scroll");
        } else if (maxScroll >= 100) {
          analytics.trackEngagement("scroll");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
}
