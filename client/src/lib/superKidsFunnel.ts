export const SUPER_KIDS_PDF_FUNNEL = {
  name: "super_kids_pdf_conversion",
  asset: "healthy_habits_super_kids_free_printables",
  steps: [
    { key: "preview_opened", event: "super_kids_pdf_preview_open", label: "Preview modal opened" },
    { key: "download_clicked", event: "super_kids_pdf_download", label: "PDF download clicked" },
  ],
} as const;

export type SuperKidsPdfFunnelStep = (typeof SUPER_KIDS_PDF_FUNNEL.steps)[number]["key"];
