import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ─── Brand colors ─────────────────────────────────────────────────────────────
const BRAND = {
  green: [126, 154, 133] as [number, number, number],
  terracotta: [212, 140, 112] as [number, number, number],
  lavender: [163, 158, 186] as [number, number, number],
  dark: [44, 42, 41] as [number, number, number],
  mid: [92, 90, 89] as [number, number, number],
  light: [235, 230, 220] as [number, number, number],
  bg: [249, 246, 240] as [number, number, number],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addBrandedHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageW = doc.internal.pageSize.getWidth();

  // Top green bar
  doc.setFillColor(...BRAND.green);
  doc.rect(0, 0, pageW, 18, "F");

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("THE PATIENT'S COMPASS", 14, 11);

  // Tagline right-aligned
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Health Intelligence System", pageW - 14, 11, { align: "right" });

  // Title block
  doc.setTextColor(...BRAND.dark);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 32);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.mid);
    doc.text(subtitle, 14, 40);
  }

  // Separator line
  doc.setDrawColor(...BRAND.light);
  doc.setLineWidth(0.5);
  doc.line(14, subtitle ? 45 : 38, pageW - 14, subtitle ? 45 : 38);
}

function addBrandedFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Separator
  doc.setDrawColor(...BRAND.light);
  doc.setLineWidth(0.3);
  doc.line(14, pageH - 18, pageW - 14, pageH - 18);

  // Disclaimer
  doc.setFontSize(6.5);
  doc.setTextColor(...BRAND.mid);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Educational support only — not medical advice. Always consult your licensed healthcare provider.",
    14,
    pageH - 12
  );

  // Page number
  doc.setFont("helvetica", "normal");
  doc.text(`Page ${pageNum} of ${totalPages}`, pageW - 14, pageH - 12, {
    align: "right",
  });

  // Date
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    pageW / 2,
    pageH - 12,
    { align: "center" }
  );
}

function labelValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  valueColor?: [number, number, number]
) {
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.mid);
  doc.text(label.toUpperCase(), x, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...(valueColor ?? BRAND.dark));
  doc.text(value || "—", x, y + 6);
}

// ─── 1. Doctor's Letter PDF ───────────────────────────────────────────────────

export interface DoctorLetterData {
  patientName: string;
  biomarker: string;
  symptoms: string;
  questions?: string[];
}

export function exportDoctorLetterPDF(data: DoctorLetterData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  addBrandedHeader(
    doc,
    "Physician Consultation Prep Letter",
    `Prepared for: ${data.patientName || "Patient"}`
  );

  let y = 52;

  // Patient info box
  doc.setFillColor(...BRAND.bg);
  doc.roundedRect(14, y, pageW - 28, 28, 3, 3, "F");
  labelValue(doc, "Patient Name", data.patientName, 20, y + 8);
  labelValue(
    doc,
    "Primary Biomarker of Concern",
    data.biomarker,
    80,
    y + 8,
    BRAND.terracotta
  );
  y += 34;

  // Salutation
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.dark);
  doc.text("Dear Doctor,", 14, y);
  y += 8;

  const intro = `I am writing to prepare for our upcoming clinical consultation. To help maximize our limited time together, I have compiled my current symptoms and a specific laboratory biomarker concern based on clinical laboratory science guidelines.`;
  const introLines = doc.splitTextToSize(intro, pageW - 28);
  doc.setFontSize(9.5);
  doc.text(introLines, 14, y);
  y += introLines.length * 5.5 + 6;

  // Symptoms section
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.green);
  doc.text("REPORTED SYMPTOMS", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.dark);
  const symptomLines = doc.splitTextToSize(data.symptoms || "Not specified", pageW - 28);
  doc.setFontSize(9.5);
  doc.text(symptomLines, 14, y);
  y += symptomLines.length * 5.5 + 8;

  // Context paragraph
  const context = `Based on evidence-backed health optimization frameworks, while my upcoming lab results may fall within standard pathological "normal" reference ranges, I am interested in evaluating if they sit within the optimal functional medicine wellness zone for ${data.biomarker}.`;
  const contextLines = doc.splitTextToSize(context, pageW - 28);
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.dark);
  doc.text(contextLines, 14, y);
  y += contextLines.length * 5.5 + 8;

  // Questions
  const questions = data.questions?.length
    ? data.questions
    : [
        `Could my reported symptoms correlate with a suboptimal level of ${data.biomarker}?`,
        `What are your thoughts on tracking my levels of this marker over the next 3 to 6 months?`,
        `Are there any safe, evidence-based lifestyle or nutritional adjustments we can initiate to optimize this marker?`,
      ];

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.green);
  doc.text("KEY QUESTIONS I'D LIKE TO DISCUSS", 14, y);
  y += 6;

  questions.forEach((q, i) => {
    doc.setFillColor(...BRAND.green);
    doc.circle(17, y - 1.5, 1.5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...BRAND.dark);
    const qLines = doc.splitTextToSize(`${q}`, pageW - 34);
    doc.text(qLines, 22, y);
    y += qLines.length * 5.5 + 3;
  });

  y += 6;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.dark);
  doc.text("Thank you for your time and expertise.", 14, y);
  y += 6;
  doc.text(`Sincerely, ${data.patientName || "Patient"}`, 14, y);

  addBrandedFooter(doc, 1, 1);
  doc.save(`doctors-letter-${Date.now()}.pdf`);
}

// ─── 2. Biomarker Report PDF ──────────────────────────────────────────────────

export interface BiomarkerReportItem {
  name: string;
  value: string | number;
  unit: string;
  standardRange: string;
  optimalRange: string;
  status: string;
  symptoms?: string;
  category?: string;
}

export function exportBiomarkerReportPDF(
  items: BiomarkerReportItem[],
  patientName?: string
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  addBrandedHeader(
    doc,
    "Biomarker Analysis Report",
    patientName ? `Patient: ${patientName}` : undefined
  );

  let y = 52;
  let pageNum = 1;

  const statusColor = (status: string): [number, number, number] => {
    const s = status.toLowerCase();
    if (s.includes("optimal")) return [52, 168, 83];
    if (s.includes("suboptimal") || s.includes("low")) return BRAND.terracotta;
    if (s.includes("high")) return [220, 80, 60];
    return BRAND.mid;
  };

  items.forEach((item, idx) => {
    // Page break check
    if (y > 240) {
      addBrandedFooter(doc, pageNum, -1);
      doc.addPage();
      pageNum++;
      addBrandedHeader(doc, "Biomarker Analysis Report (cont.)");
      y = 52;
    }

    // Card background
    doc.setFillColor(...BRAND.bg);
    doc.roundedRect(14, y, pageW - 28, 38, 3, 3, "F");

    // Status badge
    const sc = statusColor(item.status);
    doc.setFillColor(...sc);
    doc.roundedRect(pageW - 60, y + 4, 42, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(item.status.toUpperCase(), pageW - 39, y + 9.5, { align: "center" });

    // Biomarker name
    doc.setTextColor(...BRAND.dark);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(item.name, 20, y + 10);

    if (item.category) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.mid);
      doc.text(item.category.toUpperCase(), 20, y + 16);
    }

    // Value
    labelValue(
      doc,
      "Your Value",
      `${item.value} ${item.unit}`,
      20,
      y + 22,
      sc
    );
    labelValue(doc, "Standard Range", item.standardRange, 70, y + 22);
    labelValue(
      doc,
      "Optimal Range",
      item.optimalRange,
      130,
      y + 22,
      BRAND.green
    );

    y += 44;
  });

  // Fix total pages
  const totalPages = pageNum;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addBrandedFooter(doc, p, totalPages);
  }

  doc.save(`biomarker-report-${Date.now()}.pdf`);
}

// ─── 3. AI Recommendations PDF ───────────────────────────────────────────────

export interface RecommendationsData {
  summary: string;
  nutritionFocus?: { headline: string; items: { title: string; description: string; foods?: string[] }[] };
  lifestyleFocus?: { headline: string; items: { category: string; title: string; description: string; actionSteps?: string[] }[] };
  doctorQuestions?: string[];
  biomarkers?: { name: string; status: string }[];
}

export function exportRecommendationsPDF(data: RecommendationsData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  addBrandedHeader(doc, "Personalized Wellness Recommendations");

  let y = 52;
  let pageNum = 1;

  const checkPageBreak = (needed = 20) => {
    if (y + needed > 265) {
      addBrandedFooter(doc, pageNum, -1);
      doc.addPage();
      pageNum++;
      addBrandedHeader(doc, "Wellness Recommendations (cont.)");
      y = 52;
    }
  };

  // Summary
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.green);
  doc.text("SUMMARY", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.dark);
  const summaryLines = doc.splitTextToSize(data.summary, pageW - 28);
  doc.text(summaryLines, 14, y);
  y += summaryLines.length * 5.5 + 10;

  // Nutrition Focus
  if (data.nutritionFocus) {
    checkPageBreak(30);
    doc.setFillColor(...BRAND.green);
    doc.rect(14, y, 4, 14, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.dark);
    doc.text(data.nutritionFocus.headline, 22, y + 8);
    y += 18;

    data.nutritionFocus.items.forEach((item) => {
      checkPageBreak(25);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.dark);
      doc.text(`• ${item.title}`, 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.mid);
      const descLines = doc.splitTextToSize(item.description, pageW - 32);
      doc.text(descLines, 18, y);
      y += descLines.length * 4.8;
      if (item.foods?.length) {
        doc.setFontSize(8.5);
        doc.setTextColor(...BRAND.green);
        doc.text(`Foods: ${item.foods.join(", ")}`, 18, y + 3);
        y += 8;
      }
      y += 4;
    });
    y += 4;
  }

  // Lifestyle Focus
  if (data.lifestyleFocus) {
    checkPageBreak(30);
    doc.setFillColor(...BRAND.terracotta);
    doc.rect(14, y, 4, 14, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.dark);
    doc.text(data.lifestyleFocus.headline, 22, y + 8);
    y += 18;

    data.lifestyleFocus.items.forEach((item) => {
      checkPageBreak(30);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.dark);
      doc.text(`• ${item.title}`, 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.mid);
      const descLines = doc.splitTextToSize(item.description, pageW - 32);
      doc.text(descLines, 18, y);
      y += descLines.length * 4.8 + 2;
      if (item.actionSteps?.length) {
        item.actionSteps.forEach((step) => {
          doc.setFontSize(8.5);
          doc.setTextColor(...BRAND.dark);
          doc.text(`→ ${step}`, 22, y);
          y += 5;
        });
      }
      y += 4;
    });
  }

  // Doctor Questions
  if (data.doctorQuestions?.length) {
    checkPageBreak(30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.lavender);
    doc.text("QUESTIONS TO ASK YOUR DOCTOR", 14, y);
    y += 6;
    data.doctorQuestions.forEach((q) => {
      checkPageBreak(12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.dark);
      const qLines = doc.splitTextToSize(`• ${q}`, pageW - 28);
      doc.text(qLines, 14, y);
      y += qLines.length * 5 + 2;
    });
  }

  const totalPages = pageNum;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addBrandedFooter(doc, p, totalPages);
  }

  doc.save(`wellness-recommendations-${Date.now()}.pdf`);
}

// ─── 4. Export a DOM element as PDF (for charts / trend summaries) ────────────

export async function exportElementAsPDF(
  elementId: string,
  filename: string,
  title: string,
  subtitle?: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#F9F6F0",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  addBrandedHeader(doc, title, subtitle);

  const imgY = subtitle ? 52 : 46;
  const availableW = pageW - 28;
  const imgH = (canvas.height / canvas.width) * availableW;

  doc.addImage(imgData, "PNG", 14, imgY, availableW, imgH);

  addBrandedFooter(doc, 1, 1);
  doc.save(`${filename}-${Date.now()}.pdf`);
}

// ─── 5. Chat Transcript / Session Summary PDF ─────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function exportChatTranscriptPDF(
  messages: ChatMessage[],
  mode: string,
  stats?: { totalMessages: number; thumbsUp: number; thumbsDown: number }
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentW = pageW - marginX * 2;
  let y = 0;
  let pageNum = 1;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageH - 24) {
      addBrandedFooter(doc, pageNum, pageNum);
      doc.addPage();
      pageNum++;
      y = 24;
      // Minimal header on continuation pages
      doc.setFillColor(...BRAND.green);
      doc.rect(0, 0, pageW, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("THE PATIENT'S COMPASS — Health Companion Session Transcript", marginX, 7);
    }
  };

  addBrandedHeader(doc, "Health Companion Session Transcript", `Mode: ${mode} · ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
  y = 52;

  // Stats row
  if (stats) {
    doc.setFillColor(...BRAND.bg);
    doc.roundedRect(marginX, y, contentW, 14, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.mid);
    doc.text(`${stats.totalMessages} messages`, marginX + 5, y + 9);
    doc.setTextColor(126, 154, 133);
    doc.text(`👍 ${stats.thumbsUp} helpful`, marginX + 45, y + 9);
    doc.setTextColor(212, 140, 112);
    doc.text(`👎 ${stats.thumbsDown} not helpful`, marginX + 80, y + 9);
    y += 20;
  }

  // Messages
  for (const msg of messages) {
    const isUser = msg.role === "user";
    const label = isUser ? "You" : "Health Companion";
    const labelColor: [number, number, number] = isUser ? BRAND.dark : BRAND.green;
    const bgColor: [number, number, number] = isUser ? [235, 230, 220] : [240, 245, 241];

    // Strip markdown for PDF
    const plainText = msg.content
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .trim();

    const lines = doc.splitTextToSize(plainText, contentW - 10);
    const blockH = lines.length * 4.5 + 12;

    checkPageBreak(blockH + 4);

    // Label
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...labelColor);
    doc.text(label.toUpperCase(), marginX, y + 5);

    // Message bubble
    doc.setFillColor(...bgColor);
    doc.roundedRect(marginX, y + 7, contentW, blockH - 7, 2, 2, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.dark);
    doc.text(lines, marginX + 4, y + 14);

    y += blockH + 4;
  }

  addBrandedFooter(doc, pageNum, pageNum);
  doc.save(`dr-compass-session-${Date.now()}.pdf`);
}
