import ReactGA from "react-ga4";

/**
 * Initialize Google Analytics 4
 * Call this once on app startup
 */
export function initializeGA(measurementId: string) {
  if (!measurementId) {
    console.warn("Google Analytics measurement ID not configured");
    return;
  }

  ReactGA.initialize(measurementId);
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string) {
  ReactGA.send({
    hitType: "pageview",
    page: path,
    title: title || document.title,
  });
}

/**
 * Track custom event
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
) {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
}

/**
 * Track signup conversion
 */
export function trackSignup(method: "email" | "google" | "apple") {
  ReactGA.event({
    category: "conversion",
    action: "signup",
    label: method,
  });
}

/**
 * Track subscription conversion
 */
export function trackSubscription(plan: "monthly" | "yearly", amount: number) {
  ReactGA.event({
    category: "conversion",
    action: "subscription",
    label: plan,
    value: amount,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature: string, action: string) {
  ReactGA.event({
    category: "feature",
    action,
    label: feature,
  });
}

/**
 * Track user engagement
 */
export function trackEngagement(type: "scroll" | "click" | "form_submit") {
  ReactGA.event({
    category: "engagement",
    action: type,
  });
}

/**
 * Track error
 */
export function trackError(errorType: string, errorMessage: string) {
  ReactGA.event({
    category: "error",
    action: errorType,
    label: errorMessage,
  });
}

/**
 * Set user ID for cross-device tracking
 */
export function setUserId(userId: string) {
  ReactGA.set({ user_id: userId });
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>) {
  ReactGA.set(properties);
}

/**
 * Track time on page
 */
export function trackTimeOnPage(page: string, seconds: number) {
  ReactGA.event({
    category: "engagement",
    action: "time_on_page",
    label: page,
    value: Math.round(seconds),
  });
}

/**
 * Track outbound link click
 */
export function trackOutboundLink(url: string, label?: string) {
  ReactGA.event({
    category: "outbound",
    action: "click",
    label: label || url,
  });
}

/**
 * Track quiz completion
 */
export function trackQuizCompletion(quizName: string, score: number) {
  ReactGA.event({
    category: "engagement",
    action: "quiz_complete",
    label: quizName,
    value: score,
  });
}

/**
 * Track lab report upload
 */
export function trackLabReportUpload(fileType: string) {
  ReactGA.event({
    category: "feature",
    action: "lab_report_upload",
    label: fileType,
  });
}

/**
 * Track biomarker tracking
 */
export function trackBiomarkerTracking(biomarkerName: string) {
  ReactGA.event({
    category: "feature",
    action: "biomarker_tracked",
    label: biomarkerName,
  });
}

/**
 * Track AI assistant usage
 */
export function trackAIAssistantUsage(mode: "health" | "lab" | "nutrition") {
  ReactGA.event({
    category: "feature",
    action: "ai_assistant_used",
    label: mode,
  });
}

/**
 * Track PDF export
 */
export function trackPDFExport(reportType: string) {
  ReactGA.event({
    category: "feature",
    action: "pdf_export",
    label: reportType,
  });
}
