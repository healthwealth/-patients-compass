import { afterEach, describe, expect, it } from "vitest";
import { trackSuperKidsMobileDownloadComplete, trackSuperKidsMobilePreviewReveal, trackSuperKidsPdfDownload, trackSuperKidsPdfPreviewOpen, trackSuperKidsPdfPrintRange, trackSuperKidsPdfShare, trackSuperKidsPdfTextLinkClick } from "../client/src/lib/gtm";
import { applyRouteSeo } from "./routeSeo";

const originalWindow = globalThis.window;

afterEach(() => {
  Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
});

describe("Super Kids PDF analytics", () => {
  it("records only aggregate public download metadata", () => {
    const dataLayer: Record<string, unknown>[] = [];
    Object.defineProperty(globalThis, "window", { value: { dataLayer }, configurable: true });

    trackSuperKidsPdfDownload("hero");

    expect(dataLayer).toContainEqual({
      event: "super_kids_pdf_download",
      placement: "hero",
      asset: "healthy_habits_super_kids_free_printables",
      funnel_name: "super_kids_pdf_conversion",
      funnel_step: "download_clicked",
    });
    expect(dataLayer[0]).not.toHaveProperty("user_id");
    expect(dataLayer[0]).not.toHaveProperty("child_name");
  });

  it("separates secondary text-link clicks from primary download clicks", () => {
    const dataLayer: Record<string, unknown>[] = [];
    Object.defineProperty(globalThis, "window", { value: { dataLayer }, configurable: true });

    trackSuperKidsPdfTextLinkClick();

    expect(dataLayer).toContainEqual({ event: "super_kids_pdf_text_link_click", asset: "healthy_habits_super_kids_free_printables", funnel_name: "super_kids_pdf_conversion", funnel_step: "text_link_clicked" });
    expect(dataLayer[0]).not.toHaveProperty("user_id");
    expect(dataLayer[0]).not.toHaveProperty("child_name");
  });

  it("separates mobile preview reveals from completed second-tap downloads", () => {
    const dataLayer: Record<string, unknown>[] = [];
    Object.defineProperty(globalThis, "window", { value: { dataLayer }, configurable: true });

    trackSuperKidsMobilePreviewReveal();
    trackSuperKidsMobileDownloadComplete();

    expect(dataLayer).toContainEqual({ event: "super_kids_mobile_preview_reveal", asset: "healthy_habits_super_kids_free_printables", funnel_name: "super_kids_pdf_conversion", funnel_step: "mobile_preview_revealed" });
    expect(dataLayer).toContainEqual({ event: "super_kids_mobile_download_complete", asset: "healthy_habits_super_kids_free_printables", funnel_name: "super_kids_pdf_conversion", funnel_step: "mobile_download_completed" });
    expect(dataLayer.every((entry) => !("child_name" in entry))).toBe(true);
  });

  it("distinguishes a preview open from a download click", () => {
    const dataLayer: Record<string, unknown>[] = [];
    Object.defineProperty(globalThis, "window", { value: { dataLayer }, configurable: true });

    trackSuperKidsPdfPreviewOpen();
    trackSuperKidsPdfDownload("navigation");

    expect(dataLayer).toContainEqual({ event: "super_kids_pdf_preview_open", asset: "healthy_habits_super_kids_free_printables", funnel_name: "super_kids_pdf_conversion", funnel_step: "preview_opened" });
    expect(dataLayer).toContainEqual({ event: "super_kids_pdf_download", placement: "navigation", asset: "healthy_habits_super_kids_free_printables", funnel_name: "super_kids_pdf_conversion", funnel_step: "download_clicked" });
  });

  it("records aggregate modal share platform metadata only", () => {
    const dataLayer: Record<string, unknown>[] = [];
    Object.defineProperty(globalThis, "window", { value: { dataLayer }, configurable: true });

    trackSuperKidsPdfShare("pinterest");

    expect(dataLayer).toContainEqual({ event: "super_kids_pdf_share", platform: "pinterest", asset: "healthy_habits_super_kids_free_printables" });
    expect(dataLayer[0]).not.toHaveProperty("user_id");
    expect(dataLayer[0]).not.toHaveProperty("child_name");
  });

  it("records the selected page range and preset without personal data", () => {
    const dataLayer: Record<string, unknown>[] = [];
    Object.defineProperty(globalThis, "window", { value: { dataLayer }, configurable: true });

    trackSuperKidsPdfPrintRange(5, 9, "coloring");

    expect(dataLayer).toContainEqual({ event: "super_kids_pdf_print_range", from_page: 5, to_page: 9, page_count: 5, page_range: "5-9", preset: "coloring", asset: "healthy_habits_super_kids_free_printables" });
    expect(dataLayer[0]).not.toHaveProperty("user_id");
    expect(dataLayer[0]).not.toHaveProperty("child_name");
  });
});

describe("route-aware Super Kids SEO", () => {
  const template = `<!doctype html><html><head><title>Home</title><meta name="description" content="Home description" /><meta name="keywords" content="home" /><link rel="canonical" href="https://thepatientscompass.com/" /><meta property="og:title" content="Home" /><meta property="og:description" content="Home description" /><meta property="og:url" content="https://thepatientscompass.com/" /><meta property="og:image" content="https://thepatientscompass.com/home.png" /><meta name="twitter:title" content="Home" /><meta name="twitter:description" content="Home description" /><meta name="twitter:image" content="https://thepatientscompass.com/home.png" /></head></html>`;

  it("injects crawlable title, canonical, description, and Book structured data", () => {
    const html = applyRouteSeo(template, "/super-kids");
    expect(html).toContain("<title>Healthy Habits for Super Kids by Sonya M. | The Patient&#39;s Compass</title>");
    expect(html).toContain('href="https://thepatientscompass.com/super-kids"');
    expect(html).toContain("free 19-page Healthy Habits for Super Kids activity pack");
    expect(html).toContain('"image":"https://thepatientscompass.com/manus-storage/activity-page-01_f4d8a670.jpg"');
    expect(html).toContain('"encodingFormat":"application/pdf"');
    expect(html).toContain("Healthy_Habits_Super_Kids_Free_Printables_8b45bee6.pdf");
    expect(html).toContain('"@type":"Book"');
    expect(html).toContain('"url":"https://thepatientscompass.com/super-kids"');
  });

  it("leaves other route shells unchanged", () => {
    expect(applyRouteSeo(template, "/")).toBe(template);
  });
});
