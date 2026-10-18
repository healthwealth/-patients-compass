/**
 * Google Tag Manager integration
 * Initialize GTM with your container ID and track events
 */
import { SUPER_KIDS_PDF_FUNNEL } from "./superKidsFunnel";

declare global {
  interface Window {
    dataLayer: any[];
  }
}

const GTM_SCRIPT_ID = "patients-compass-gtm";

function isGTMReady() {
  return typeof window !== "undefined" && Array.isArray(window.dataLayer);
}

/**
 * Initialize Google Tag Manager
 * Call this once on app startup
 */
export function initializeGTM(containerId: string) {
  if (!/^GTM-[A-Z0-9]+$/.test(containerId) || typeof window === "undefined") {
    console.warn("Google Tag Manager container ID not configured");
    return;
  }

  if (typeof document === "undefined" || document.getElementById(GTM_SCRIPT_ID)) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.id = GTM_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  document.head.appendChild(script);
  trackPageView(`${window.location.pathname}${window.location.search}`, document.title);
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string) {
  if (!isGTMReady()) return;
  window.dataLayer.push({
    event: "page_view",
    page_path: path,
    page_title: title || document.title,
  });
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, any>
) {
  if (!isGTMReady() || !/^[a-z][a-z0-9_]{0,63}$/.test(eventName)) return;
  window.dataLayer.push({ event: eventName, ...(eventData || {}) });
}

/**
 * Track signup conversion
 */
export function trackSignup(method: "email" | "google" | "apple") {
  trackEvent("sign_up", {
    method,
  });
}

/**
 * Track subscription conversion
 */
export function trackSubscription(plan: string, amount: number) {
  trackEvent("purchase", {
    currency: "USD",
    value: amount,
    items: [
      {
        item_id: plan,
        item_name: plan,
        price: amount,
        quantity: 1,
      },
    ],
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature: string, action: string) {
  trackEvent("feature_usage", {
    feature,
    action,
  });
}

/** Track a directory view without paths, identifiers, location, search, or health information. */
export function trackCareConnectionsDirectoryView() {
  trackEvent("care_connections_directory_view");
}

/** Track the external-partner notice completion without partner or account identifiers. */
export function trackCareConnectionsConsentCompleted() {
  trackEvent("care_connections_consent_completed");
}

/**
 * Track user engagement
 */
export function trackEngagement(type: "scroll" | "click" | "form_submit") {
  trackEvent("engagement", {
    type,
  });
}

/**
 * Track error
 */
export function trackError(errorType: string, errorMessage: string) {
  trackEvent("error", {
    error_type: errorType,
  });
}

/**
 * Set user ID for cross-device tracking
 */
export function setUserId(userId: string) {
  // Deliberately do not send account identifiers to analytics.
  void userId;
}

/**
 * Track lab report upload
 */
export function trackLabReportUpload(fileType: string) {
  trackEvent("lab_report_upload", {
    file_type: fileType,
  });
}

/**
 * Track biomarker tracking
 */
export function trackBiomarkerTracking(biomarkerName: string) {
  void biomarkerName;
  trackEvent("biomarker_tracked", { category: "lab" });
}

/**
 * Track AI assistant usage
 */
export function trackAIAssistantUsage(mode: "health" | "lab" | "nutrition") {
  trackEvent("ai_assistant_used", {
    mode,
  });
}

/**
 * Track PDF export
 */
export function trackPDFExport(reportType: string) {
  trackEvent("pdf_export", {
    report_type: reportType,
  });
}

/** Track public Super Kids PDF download clicks without sending user or child data. */
export function trackSuperKidsPdfDownload(placement: "hero" | "footer" | "modal" | "navigation") {
  trackEvent("super_kids_pdf_download", {
    placement,
    asset: "healthy_habits_super_kids_free_printables",
    funnel_name: SUPER_KIDS_PDF_FUNNEL.name,
    funnel_step: "download_clicked",
  });
}

/** Track clicks on the secondary text-link download separately from primary CTA downloads. */
export function trackSuperKidsPdfTextLinkClick() {
  trackEvent("super_kids_pdf_text_link_click", {
    asset: "healthy_habits_super_kids_free_printables",
    funnel_name: SUPER_KIDS_PDF_FUNNEL.name,
    funnel_step: "text_link_clicked",
  });
}

/** Track the first touch that reveals the mobile footer preview without recording user data. */
export function trackSuperKidsMobilePreviewReveal() {
  trackEvent("super_kids_mobile_preview_reveal", {
    asset: "healthy_habits_super_kids_free_printables",
    funnel_name: SUPER_KIDS_PDF_FUNNEL.name,
    funnel_step: "mobile_preview_revealed",
  });
}

/** Track a completed second-tap mobile download separately from preview reveals. */
export function trackSuperKidsMobileDownloadComplete() {
  trackEvent("super_kids_mobile_download_complete", {
    asset: "healthy_habits_super_kids_free_printables",
    funnel_name: SUPER_KIDS_PDF_FUNNEL.name,
    funnel_step: "mobile_download_completed",
  });
}

/** Track opening the public Super Kids PDF preview without sending user or child data. */
export function trackSuperKidsPdfPreviewOpen() {
  trackEvent("super_kids_pdf_preview_open", {
    asset: "healthy_habits_super_kids_free_printables",
    funnel_name: SUPER_KIDS_PDF_FUNNEL.name,
    funnel_step: "preview_opened",
  });
}

/** Track modal share clicks without sending user or child data. */
export function trackSuperKidsPdfShare(platform: "facebook" | "pinterest" | "whatsapp" | "email" | "copy" | "native") {
  trackEvent("super_kids_pdf_share", {
    platform,
    asset: "healthy_habits_super_kids_free_printables",
  });
}

/** Track the selected public PDF print range without sending user or child data. */
export function trackSuperKidsPdfPrintRange(fromPage: number, toPage: number, preset: "cover" | "coloring" | "all" | "custom") {
  trackEvent("super_kids_pdf_print_range", {
    from_page: fromPage,
    to_page: toPage,
    page_count: toPage - fromPage + 1,
    page_range: `${fromPage}-${toPage}`,
    preset,
    asset: "healthy_habits_super_kids_free_printables",
  });
}

/**
 * Track email unsubscribe
 */
export function trackEmailUnsubscribe(reason?: string) {
  trackEvent("email_unsubscribe", {
    reason: reason || "user_requested",
  });
}

/**
 * Track content view
 */
export function trackContentView(contentType: string, contentId: string) {
  trackEvent("view_item", {
    content_type: contentType,
    content_id: contentId,
  });
}

/**
 * Track search
 */
export function trackSearch(searchTerm: string, resultsCount: number) {
  void searchTerm;
  trackEvent("search", {
    results_count: resultsCount,
  });
}

/**
 * Track a header search session that produced no results without sending query text,
 * user identifiers, health information, or recent-search history.
 */
export function trackHeaderSearchZeroResults(surface: "desktop" | "mobile") {
  trackEvent("header_search_zero_results", { surface });
}

/**
 * Track relevance feedback without sending query text, destination details, user IDs, or health data.
 */
export function trackHeaderSearchFeedback(
  feedback: "helpful" | "not_helpful",
  surface: "desktop" | "mobile",
  resultCount: number
) {
  trackEvent("header_search_feedback", { feedback, surface, result_count: resultCount });
}

/**
 * Track a guided 404 recovery selection without sending the entered query,
 * missing path, destination URL, user ID, or health information.
 */
export function trackNotFoundRecoverySelection(
  selectionSource: "search_result" | "popular_resource",
  destinationCategory: string
) {
  trackEvent("not_found_recovery_selection", {
    selection_source: selectionSource,
    destination_category: destinationCategory,
  });
}

/**
 * Track referral share button clicks with platform as a GA4 event-scoped custom dimension.
 *
 * GA4 setup required (one-time, in Google Analytics UI):
 *   Admin → Custom definitions → Custom dimensions → Create
 *     Name: Share Platform
 *     Scope: Event
 *     Event parameter: platform
 *   This lets you break down "referral_share" events by platform in the
 *   standard Explorations report without writing a custom query.
 *
 * @param platform - one of: "twitter" | "whatsapp" | "linkedin" | "facebook" | "email"
 */
export function trackShareClick(platform: "twitter" | "whatsapp" | "linkedin" | "facebook" | "email") {
  trackEvent("referral_share", {
    // GA4 event-scoped custom dimension — register "platform" in Admin → Custom definitions
    platform,
    // Also send as event_label for backwards-compat with UA-style reporting
    event_label: platform,
  });
}
