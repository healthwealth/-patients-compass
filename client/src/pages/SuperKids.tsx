import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Facebook,
  FileText,
  Mail,
  Heart,
  Link2,
  Loader2,
  Maximize2,
  MessageCircle,
  Minimize2,
  Smartphone,
  Printer,
  Share2,
  Sparkles,
  Star,
  Users,
  ZoomIn,
  ZoomOut,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { buildPinterestShareUrl, buildSuperKidsShareMessage, SUPER_KIDS_SHARE_TITLE } from "@/lib/superKidsSharing";
import { trackSuperKidsMobileDownloadComplete, trackSuperKidsMobilePreviewReveal, trackSuperKidsPdfDownload, trackSuperKidsPdfPreviewOpen, trackSuperKidsPdfPrintRange, trackSuperKidsPdfShare, trackSuperKidsPdfTextLinkClick } from "@/lib/gtm";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const ACTIVITY_PDF = "/manus-storage/Healthy_Habits_Super_Kids_Free_Printables_8b45bee6.pdf";
const PDF_PAGE_COUNT = 19;
const PAGE_PREVIEWS = [
  { src: "/manus-storage/activity-page-01_f4d8a670.jpg", label: "Welcome and grown-up guide" },
  { src: "/manus-storage/activity-page-02_9ace791e.jpg", label: "Healthy habits tracker" },
  { src: "/manus-storage/activity-page-03_965b44c0.jpg", label: "Playful activity page" },
  { src: "/manus-storage/activity-page-04_2ca00b2c.jpg", label: "Family reflection page" },
  ...[
    [5, "/manus-storage/page-5_709b0030.jpg"], [6, "/manus-storage/page-6_44f79c49.jpg"], [7, "/manus-storage/page-7_c261111d.jpg"],
    [8, "/manus-storage/page-8_8237e153.jpg"], [9, "/manus-storage/page-9_056a32c3.jpg"], [10, "/manus-storage/page-10_2a59c671.jpg"],
    [11, "/manus-storage/page-11_54e8cdae.jpg"], [12, "/manus-storage/page-12_daa24f97.jpg"], [13, "/manus-storage/page-13_8346b397.jpg"],
    [14, "/manus-storage/page-14_1ea7b745.jpg"], [15, "/manus-storage/page-15_2ea647a5.jpg"], [16, "/manus-storage/page-16_1a97e4e5.jpg"],
    [17, "/manus-storage/page-17_199e35e5.jpg"], [18, "/manus-storage/page-18_fb5e001e.jpg"], [19, "/manus-storage/page-19_dbf7c668.jpg"],
  ].map(([page, src]) => ({ src: src as string, label: `Activity page ${page}` })),
];

const activities = [
  { icon: Zap, title: "Move like a superhero", text: "Turn everyday movement into a playful mission with simple ideas children can try with a grown-up." },
  { icon: Heart, title: "Build a rainbow plate", text: "Explore colorful foods and practice noticing what helps your body feel ready for the day." },
  { icon: Star, title: "Make a calm-down plan", text: "Use friendly prompts to name feelings, pause, breathe, and choose a helpful next step." },
];

export default function SuperKids() {
  const [previewIndex, setPreviewIndex] = useState(0);
  const [childName, setChildName] = useState("");
  const [copied, setCopied] = useState(false);
  const [certificateGenerating, setCertificateGenerating] = useState(false);
  const [certificateExportKind, setCertificateExportKind] = useState<"pdf" | "png" | "jpeg" | null>(null);
  const [certificateStatus, setCertificateStatus] = useState<{ kind: "progress" | "success" | "warning"; message: string } | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [newsletterError, setNewsletterError] = useState("");
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [footerPreviewOpen, setFooterPreviewOpen] = useState(false);
  const [footerDownloadStarting, setFooterDownloadStarting] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewPage, setPdfPreviewPage] = useState(1);
  const [pdfZoom, setPdfZoom] = useState(1);
  const [printInitializing, setPrintInitializing] = useState(false);
  const [pdfFullscreen, setPdfFullscreen] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const shareUrl = useMemo(() => `${window.location.origin}/super-kids`, []);
  const shareImageUrl = useMemo(() => new URL(PAGE_PREVIEWS[0].src, window.location.origin).toString(), []);
  const preview = PAGE_PREVIEWS[previewIndex];
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const changePreview = (direction: number) => {
    setPreviewIndex((current) => (current + direction + PAGE_PREVIEWS.length) % PAGE_PREVIEWS.length);
  };

  const copyShareLink = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
      return true;
    } catch {
      window.prompt("Copy this link to share the activity pack:", shareUrl);
      return true;
    }
  };

  const newsletter = trpc.email.joinWaitlist.useMutation({
    onSuccess: () => { setNewsletterSubmitted(true); setNewsletterError(""); },
    onError: (error) => setNewsletterError(error.message || "Please try again."),
  });
  const saveCertificate = trpc.certificates.save.useMutation({
    onSuccess: () => {
      setCertificateStatus({ kind: "success", message: "Your certificate was downloaded and saved to your private library." });
      utils.certificates.list.invalidate();
    },
    onError: () => setCertificateStatus({ kind: "warning", message: "Your PDF was downloaded, but we could not save a library copy. Please try again while signed in." }),
  });
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const shareMessage = useMemo(() => buildSuperKidsShareMessage(childName), [childName]);
  const shareData: ShareData = { title: SUPER_KIDS_SHARE_TITLE, text: shareMessage, url: shareUrl };
  const handleActivityPdfDownload = (placement: "hero" | "footer" | "modal") => {
    trackSuperKidsPdfDownload(placement);
    toast.success("Download started", { description: "Your free Super Kids activity pack is opening now.", duration: 2400 });
  };
  const openPdfPreview = () => {
    setPdfPreviewPage(1);
    setPdfZoom(1);
    setPdfFullscreen(false);
    setPdfPreviewOpen(true);
    trackSuperKidsPdfPreviewOpen();
  };
  useEffect(() => {
    if (!pdfPreviewOpen) return undefined;
    const handlePdfKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPdfPreviewPage((page) => Math.max(1, page - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setPdfPreviewPage((page) => Math.min(PDF_PAGE_COUNT, page + 1));
      }
    };
    window.addEventListener("keydown", handlePdfKeyDown);
    return () => window.removeEventListener("keydown", handlePdfKeyDown);
  }, [pdfPreviewOpen]);
  useEffect(() => {
    if (!pdfPreviewOpen) return undefined;
    const handlePrintRangeMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "super-kids-print-range") return;
      trackSuperKidsPdfPrintRange(event.data.fromPage, event.data.toPage, event.data.preset);
    };
    window.addEventListener("message", handlePrintRangeMessage);
    return () => window.removeEventListener("message", handlePrintRangeMessage);
  }, [pdfPreviewOpen]);
  const printActivityPack = () => {
    setPrintInitializing(true);
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      setPrintInitializing(false);
      toast.error("Please allow pop-ups to print the activity pack.");
      return;
    }
    const printReady = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || (event.data !== "super-kids-print-ready" && event.data?.type !== "super-kids-print-range")) return;
      window.removeEventListener("message", printReady);
      setPrintInitializing(false);
    };
    window.addEventListener("message", printReady);
    window.setTimeout(() => {
      window.removeEventListener("message", printReady);
      setPrintInitializing(false);
    }, 15000);
    printWindow.document.write(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Print Preview · Healthy Habits for Super Kids</title><style>
      :root{font-family:system-ui,sans-serif;color:#304536;background:#fff9f0}*{box-sizing:border-box}body{margin:0}.toolbar{position:sticky;top:0;z-index:2;padding:18px 24px;background:#fffdf8;border-bottom:1px solid #eadfcb;box-shadow:0 2px 12px rgba(73,99,79,.08)}h1{margin:0 0 12px;font:600 26px Georgia,serif}label{font-size:13px;font-weight:700;color:#58705e}input{width:70px;margin:4px 12px 0 6px;padding:9px;border:1px solid #bfd0c0;border-radius:8px;font-size:16px}button{border:0;border-radius:999px;padding:10px 16px;margin:4px 6px 0 0;font-weight:700;cursor:pointer;background:#6f8d78;color:white}button.secondary,button.preset{background:white;color:#58705e;border:1px solid #bfd0c0}button:focus-visible,input:focus-visible{outline:3px solid #bfd0c0;outline-offset:2px}.preset-row{margin-bottom:8px}.status{display:inline-block;margin-left:8px;font-size:13px;color:#7a857c}.pages{max-width:1000px;margin:24px auto;padding:0 18px}.page{margin:0 auto 24px;max-width:850px;background:white;border:1px solid #eadfcb;box-shadow:0 8px 28px rgba(91,91,65,.1);page-break-after:always}.page-label{padding:8px 12px;font-size:12px;font-weight:700;color:#7a857c;border-bottom:1px solid #f0e8da}.page iframe{display:block;width:100%;height:980px;border:0}@media print{.toolbar{display:none}.pages{margin:0;padding:0}.page{border:0;box-shadow:none;margin:0;max-width:none}.page-label{display:none}.page iframe{height:100vh}}
    </style></head><body><section class="toolbar"><h1>Print preview · Healthy Habits for Super Kids</h1><div class="preset-row" role="group" aria-label="Page range presets"><button id="cover" class="preset" type="button">Cover only</button><button id="coloring" class="preset" type="button">Coloring pages (5–9)</button><button id="all" class="preset" type="button">All pages</button></div><div><label>From page <input id="from" type="number" min="1" max="19" value="1"></label><label>To page <input id="to" type="number" min="1" max="19" value="19"></label><button id="print" type="button">Print selected pages</button><button id="close" class="secondary" type="button">Close preview</button><span id="status" class="status" aria-live="polite">19 pages selected</span></div></section><main id="pages" class="pages"></main><script>
      const pdf=${JSON.stringify(ACTIVITY_PDF)}, total=${PDF_PAGE_COUNT}, from=document.getElementById('from'), to=document.getElementById('to'), pages=document.getElementById('pages'), status=document.getElementById('status'); let selectedPreset='all';
      function render(){let start=Math.max(1,Math.min(total,Number(from.value)||1)),end=Math.max(1,Math.min(total,Number(to.value)||total));if(start>end)[start,end]=[end,start];from.value=start;to.value=end;pages.innerHTML=Array.from({length:end-start+1},(_,i)=>{const n=start+i;return '<section class="page"><div class="page-label">Page '+n+' of '+total+'</div><iframe title="Activity pack page '+n+'" src="'+pdf+'#page='+n+'&view=FitH"></iframe></section>'}).join('');status.textContent=(end-start+1)+' page'+(end-start===0?'':'s')+' selected';}
      function choose(preset,start,end){selectedPreset=preset;from.value=start;to.value=end;render();from.focus();}
      document.getElementById('cover').addEventListener('click',()=>choose('cover',1,1));document.getElementById('coloring').addEventListener('click',()=>choose('coloring',5,9));document.getElementById('all').addEventListener('click',()=>choose('all',1,total));from.addEventListener('input',()=>{selectedPreset='custom';render()});to.addEventListener('input',()=>{selectedPreset='custom';render()});document.getElementById('print').addEventListener('click',()=>{const start=Number(from.value),end=Number(to.value);window.opener?.postMessage({type:'super-kids-print-range',fromPage:start,toPage:end,preset:selectedPreset},window.location.origin);window.focus();window.print()});document.getElementById('close').addEventListener('click',()=>window.close());render();setTimeout(()=>{from.focus();window.opener?.postMessage('super-kids-print-ready',window.location.origin)},350);
    </script></body></html>`);
    printWindow.document.close();
  };
  const trackPreviewShare = (platform: "facebook" | "pinterest" | "whatsapp" | "email" | "copy" | "native") => trackSuperKidsPdfShare(platform);
  const showShareToast = (message: string) => {
    setShareToast(message);
    window.setTimeout(() => setShareToast(null), 2600);
  };
  const handlePreviewShare = (platform: "facebook" | "pinterest" | "whatsapp" | "email") => {
    trackPreviewShare(platform);
    toast.success("Share ready", { description: `Your ${platform} share link is ready.`, duration: 2200 });
    showShareToast(`${platform[0].toUpperCase()}${platform.slice(1)} share link ready`);
  };

  const downloadCertificate = async (format: "pdf" | "png" | "jpeg") => {
    if (!certificateRef.current || certificateGenerating || saveCertificate.isPending) return;
    setCertificateGenerating(true);
    setCertificateExportKind(format);
    const formatLabel = format === "pdf" ? "PDF" : format.toUpperCase();
    setCertificateStatus({ kind: "progress", message: isAuthenticated && format === "pdf" ? "Creating your PDF and saving a preview to your library…" : `Creating your personalized ${formatLabel}…` });
    try {
      const canvas = await html2canvas(certificateRef.current, { scale: 2, backgroundColor: "#FFF9F0", useCORS: true });
      const certificateName = childName.trim() || "Your Super Kid";
      const safeName = certificateName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const previewDataUrl = canvas.toDataURL("image/jpeg", 0.82);
      if (format === "pdf") {
        const image = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
        const margin = 36;
        const width = pdf.internal.pageSize.getWidth() - margin * 2;
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(image, "PNG", margin, Math.max(margin, (pdf.internal.pageSize.getHeight() - height) / 2), width, height);
        const pdfDataUrl = pdf.output("datauristring");
        pdf.save(`healthy-habits-certificate-${safeName}.pdf`);
        if (isAuthenticated) {
          saveCertificate.mutate({ childName: certificateName, pdfDataUrl, previewDataUrl });
          return;
        }
        setCertificateStatus({ kind: "warning", message: "Your PDF was downloaded. Sign in to save future certificates and previews to your private library." });
        return;
      } else {
        const mimeType = format === "png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, format === "jpeg" ? 0.92 : undefined);
        const downloadLink = document.createElement("a");
        downloadLink.href = dataUrl;
        downloadLink.download = `healthy-habits-certificate-${safeName}.${format === "png" ? "png" : "jpg"}`;
        downloadLink.click();
      }
      setCertificateStatus({ kind: "success", message: `Your personalized ${formatLabel} is ready to share or print.` });
    } catch {
      setCertificateStatus({ kind: "warning", message: `We could not create the ${formatLabel}. Please try again.` });
    } finally {
      setCertificateGenerating(false);
      setCertificateExportKind(null);
    }
  };

  const downloadCertificatePdf = () => downloadCertificate("pdf");

  const nativeShare = async () => {
    if (!canNativeShare) return;
    trackPreviewShare("native");
    const data: ShareData = { ...shareData };
    try {
      const response = await fetch(shareImageUrl, { cache: "force-cache" });
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], "healthy-habits-preview.jpg", { type: blob.type || "image/jpeg" });
        if (navigator.canShare?.({ files: [file] })) data.files = [file];
      }
    } catch {
      // Some browsers block fetching managed preview images; share the text and URL instead.
    }
    try {
      await navigator.share(data);
      toast.success("Share ready", { description: "The activity pack is ready to share from your device.", duration: 2200 });
      showShareToast("Device share ready");
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") setNewsletterError("Sharing was not completed. You can use another share option instead.");
    }
  };
  const copyPreviewShareLink = async () => {
    trackPreviewShare("copy");
    void copyShareLink();
    toast.success("Link copied", { description: "The activity pack link is ready to share.", duration: 2200 });
    showShareToast("Link copied");
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#FFF9F0] text-[#25342F]">
      <SEO
        title="Healthy Habits for Super Kids by Sonya M."
        description="Download Sonya M.'s free 19-page Healthy Habits for Super Kids activity pack for playful family learning at home. No registration required."
        path="/super-kids"
        keywords={["Healthy Habits for Super Kids", "Sonya M.", "free kids activity PDF", "family wellness activities"]}
        structuredData={{ "@context": "https://schema.org", "@type": "Book", name: "Healthy Habits for Super Kids", author: { "@type": "Person", name: "Sonya M." }, description: "A free printable family activity pack for ages 3–8.", image: shareImageUrl, isAccessibleForFree: true, educationalUse: "Family activity", encoding: { "@type": "MediaObject", name: "Healthy Habits for Super Kids — Free Printable Activity Pack", contentUrl: new URL(ACTIVITY_PDF, window.location.origin).toString(), encodingFormat: "application/pdf", contentSize: "29.9 KB", description: "Downloadable 19-page printable activity pack for children ages 3–8." } }}
      />

      <header className="print:hidden border-b border-[#EADFCB] bg-[#FFFDF8]/90 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F8D78]"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#87A88C] text-white shadow-sm"><Heart className="h-5 w-5 fill-current" /></span><span className="hidden text-sm font-semibold tracking-wide text-[#49634F] sm:inline">The Patient's Compass</span></Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#5D7462] transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F8D78]"><ArrowLeft className="h-4 w-4" /> Back home</Link>
        </div>
      </header>

      <main>
        <section className="print:hidden relative px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <div className="absolute -left-16 top-12 h-56 w-56 rounded-full bg-[#F6D5B8]/45 blur-3xl" aria-hidden="true" />
          <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-[#D7E9C8]/60 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E6C899] bg-[#FFF6E6] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#A36E43]"><Sparkles className="h-4 w-4" /> A free family activity pack</div>
              <h1 className="max-w-3xl font-serif text-5xl font-semibold leading-[1.04] tracking-tight text-[#26372F] sm:text-6xl lg:text-7xl">Healthy habits can feel like <em className="text-[#D88969]">superpowers.</em></h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5B6B61] sm:text-xl">Meet <strong className="font-semibold text-[#405B48]">Healthy Habits for Super Kids</strong> by Sonya M.—a playful printable companion for curious children and the grown-ups cheering them on.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href={ACTIVITY_PDF} download="Healthy-Habits-for-Super-Kids-Free-Printables.pdf" onClick={() => handleActivityPdfDownload("hero")} className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#6F8D78] px-6 py-3 text-base font-bold text-white shadow-[0_10px_25px_rgba(111,141,120,.22)] transition hover:-translate-y-0.5 hover:bg-[#5E7D67] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#AFC7B2] active:translate-y-0"><Download className="h-5 w-5" /> Download the free PDF <span className="sr-only">without registration</span></a>
                <button type="button" onClick={openPdfPreview} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#BFD0C0] bg-white/75 px-5 py-3 text-sm font-semibold text-[#58705E] transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><ExternalLink className="h-4 w-4" /> Preview full PDF</button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1"><a href={ACTIVITY_PDF} download="Healthy-Habits-for-Super-Kids-Free-Printables.pdf" onClick={trackSuperKidsPdfTextLinkClick} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#58705E] underline decoration-[#AFC7B2] decoration-2 underline-offset-4 transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><FileText className="h-4 w-4" aria-hidden="true" /> <span>Your Super Kid Activity Pack</span></a><span className="text-xs font-medium text-[#728075]">19 pages · completely free</span></div>
              <p className="mt-4 flex items-center gap-2 text-sm text-[#728075]"><CheckCircle2 className="h-4 w-4 text-[#6F8D78]" /> Free, no email, no registration. Print at home or use on screen.</p>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:justify-self-end">
              <div className="absolute -right-2 -top-5 z-10 rotate-6 rounded-2xl border-2 border-[#E5B77F] bg-[#FFF6E6] px-4 py-3 text-center shadow-sm sm:-right-8"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#A36E43]">For ages</p><p className="font-serif text-2xl font-bold text-[#D27F5D]">3–8</p></div>
              <div className="rotate-[-2deg] rounded-[2rem] border-8 border-white bg-[#F6DDBD] p-3 shadow-[0_25px_60px_rgba(91,91,65,.16)] sm:p-5"><div className="rounded-[1.3rem] bg-[#FFF9F0] p-6 sm:p-8"><div className="mb-8 flex items-center justify-between"><span className="rounded-full bg-[#DDEBCF] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#58705E]">Activity pack</span><span className="text-2xl" aria-hidden="true">★</span></div><h2 className="font-serif text-4xl font-bold leading-tight text-[#304536] sm:text-5xl">Healthy<br /><span className="text-[#D88467]">Habits</span><br />for Super Kids</h2><div className="mt-8 grid grid-cols-3 gap-3"><div className="h-20 rounded-2xl bg-[#F3C7A7]" /><div className="h-20 rounded-2xl bg-[#CFE2C4]" /><div className="h-20 rounded-2xl bg-[#F5DEA5]" /></div><p className="mt-6 text-sm font-semibold text-[#68776B]">Play • learn • grow</p><p className="mt-1 text-xs text-[#8A958A]">with Sonya M.</p></div></div>
              <div className="absolute -bottom-7 -left-5 flex items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-lg sm:-left-10"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#DDEBCF] text-[#58705E]"><Users className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-wide text-[#6C7E70]">Family-friendly</p><p className="text-sm text-[#59695E]">19 printable pages</p></div></div>
            </div>
          </div>
        </section>

        <section className="print:hidden border-y border-[#EADFCB] bg-[#FFFDF8] px-5 py-16 sm:px-8 sm:py-20"><div className="mx-auto max-w-6xl"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#A36E43]">Preview the pack</p><h2 className="mt-3 font-serif text-4xl font-semibold text-[#2F4035] sm:text-5xl">A peek before you print.</h2><p className="mt-4 text-base leading-7 text-[#66736A]">Browse a few sample pages from the 19-page activity pack. The full PDF is free to download with no registration.</p></div><div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_210px] lg:items-start"><div className="relative overflow-hidden rounded-3xl border border-[#EADFCB] bg-[#F6EBD8] p-3 shadow-sm"><div className="flex min-h-[420px] items-center justify-center rounded-2xl bg-[#E9D7BB] p-4 sm:min-h-[540px]"><img src={preview.src} alt={`Preview: ${preview.label}`} className="max-h-[520px] w-auto max-w-full rounded-lg bg-white object-contain shadow-lg" /></div><button type="button" onClick={() => changePreview(-1)} aria-label="Previous preview page" className="absolute left-5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#58705E] shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><ArrowLeft className="h-5 w-5" /></button><button type="button" onClick={() => changePreview(1)} aria-label="Next preview page" className="absolute right-5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#58705E] shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><ArrowRight className="h-5 w-5" /></button><p className="mt-3 text-center text-sm font-semibold text-[#607166]" aria-live="polite">Page {previewIndex + 1} preview · {preview.label}</p></div><div className="grid grid-cols-4 gap-3 lg:grid-cols-1">{PAGE_PREVIEWS.map((page, index) => <button key={page.src} type="button" onClick={() => setPreviewIndex(index)} aria-label={`Show ${page.label}`} aria-current={index === previewIndex} className={`group overflow-hidden rounded-2xl border-2 bg-white p-1 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4] ${index === previewIndex ? "border-[#6F8D78] shadow-md" : "border-transparent hover:border-[#BFD0C0]"}`}><img src={page.src} alt="" className="aspect-[3/4] w-full rounded-xl object-cover object-top" /><span className="hidden px-2 pb-1 pt-2 text-xs font-semibold text-[#607166] lg:block">Page {index + 1}</span></button>)}</div></div></div></section>

        <section className="print:hidden border-b border-[#EADFCB] bg-[#FFF9F0] px-5 py-16 sm:px-8 sm:py-20"><div className="mx-auto max-w-6xl"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#A36E43]">Inside the pack</p><h2 className="mt-3 font-serif text-4xl font-semibold text-[#2F4035] sm:text-5xl">Small activities, big conversations.</h2><p className="mt-4 text-base leading-7 text-[#66736A]">Each page is designed to help families talk, move, notice, and make healthy choices together—without turning wellness into homework.</p></div><div className="mt-10 grid gap-5 md:grid-cols-3">{activities.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-3xl border border-[#EADFCB] bg-[#FFFDF8] p-6 transition hover:-translate-y-1 hover:shadow-md"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#DDEBCF] text-[#58705E]"><Icon className="h-6 w-6" /></div><h3 className="mt-5 text-xl font-bold text-[#344B39]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#68766C]">{text}</p></article>)}</div></div></section>

        <section className="border-b border-[#EADFCB] bg-[#FFFDF8] px-5 py-16 sm:px-8 sm:py-20"><div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div className="print:hidden"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#A36E43]">Celebrate the effort</p><h2 className="mt-3 font-serif text-4xl font-semibold text-[#2F4035] sm:text-5xl">Make a certificate for your Super Kid.</h2><p className="mt-4 text-base leading-7 text-[#66736A]">Type a name, then print or save a keepsake after completing the activities together.</p><label htmlFor="child-name" className="mt-7 block text-sm font-bold text-[#405B48]">Child's name</label><Input id="child-name" value={childName} onChange={(event) => setChildName(event.target.value)} placeholder="Type a name" maxLength={40} className="mt-2 h-12 max-w-md rounded-xl border-[#D8CDBA] bg-[#FFF9F0]" /><div className="mt-4 flex flex-wrap gap-3"><Button type="button" onClick={downloadCertificatePdf} disabled={certificateGenerating || saveCertificate.isPending} className="min-h-11 rounded-full bg-[#D27F5D] px-5 hover:bg-[#B9684D]"><Download className="mr-2 h-4 w-4" /> {certificateGenerating && certificateExportKind === "pdf" ? "Creating PDF…" : "Download PDF"}</Button><Button type="button" onClick={() => downloadCertificate("png")} disabled={certificateGenerating || saveCertificate.isPending} variant="outline" className="min-h-11 rounded-full border-[#D8CDBA] bg-white px-5 text-[#A46446] hover:bg-[#FFF0E5]"><Download className="mr-2 h-4 w-4" /> {certificateGenerating && certificateExportKind === "png" ? "Creating PNG…" : "Download PNG"}</Button><Button type="button" onClick={() => downloadCertificate("jpeg")} disabled={certificateGenerating || saveCertificate.isPending} variant="outline" className="min-h-11 rounded-full border-[#D8CDBA] bg-white px-5 text-[#A46446] hover:bg-[#FFF0E5]"><Download className="mr-2 h-4 w-4" /> {certificateGenerating && certificateExportKind === "jpeg" ? "Creating JPEG…" : "Download JPEG"}</Button><Button type="button" onClick={() => window.print()} variant="outline" className="min-h-11 rounded-full border-[#BFD0C0] bg-white px-5 text-[#58705E] hover:bg-[#F3EBDD]"><Printer className="mr-2 h-4 w-4" /> Print</Button></div><p className="mt-3 text-xs text-[#7A857C]">PDF, PNG, and JPEG downloads create one-page keepsakes; Print opens your browser print dialog.</p>{certificateStatus && <div role="status" aria-live="polite" className={`mt-4 flex max-w-md items-start gap-2 rounded-xl px-3 py-2 text-sm ${certificateStatus.kind === "success" ? "bg-[#DDEBCF] text-[#405B48]" : certificateStatus.kind === "warning" ? "bg-[#FFF0D9] text-[#895F3E]" : "bg-[#E7F0EA] text-[#58705E]"}`}>{certificateStatus.kind === "progress" ? <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}<span>{certificateStatus.message}</span>{certificateStatus.kind === "success" && isAuthenticated && <Link href="/favorites" className="shrink-0 font-semibold underline underline-offset-2">Open library</Link>}</div>}</div><div ref={certificateRef} className="print-certificate mx-auto w-full max-w-xl rounded-[2rem] border-[10px] border-[#F3D39D] bg-[#FFF9F0] p-5 shadow-[0_20px_50px_rgba(91,91,65,.12)] sm:p-8"><div className="rounded-[1.25rem] border-2 border-dashed border-[#A9BE9D] px-5 py-10 text-center sm:px-10 sm:py-14"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#DDEBCF] text-[#58705E]"><Star className="h-8 w-8 fill-current" /></div><p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[#A36E43]">Super Kid achievement</p><h3 className="mt-3 font-serif text-4xl font-semibold text-[#304536] sm:text-5xl">Certificate of<br /><span className="text-[#D88467]">Healthy Habits</span></h3><p className="mt-7 text-sm text-[#6A786B]">This certificate celebrates</p><p className="mt-2 min-h-10 break-words font-serif text-3xl font-semibold text-[#405B48]">{childName.trim() || "Your Super Kid"}</p><div className="mx-auto mt-2 h-px max-w-xs bg-[#BFD0C0]" /><p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-[#6A786B]">for learning, trying, and practicing healthy habits with a trusted grown-up.</p><p className="mt-8 text-xs font-semibold uppercase tracking-widest text-[#A36E43]">Healthy Habits for Super Kids · Sonya M.</p></div></div></div></section>

        <section className="print:hidden border-b border-[#EADFCB] bg-[#FFF9F0] px-5 py-14 sm:px-8"><div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#DDEBCF] text-[#58705E]"><Share2 className="h-6 w-6" /></div><div className="flex flex-col items-center gap-4 sm:flex-row sm:text-left"><img src={PAGE_PREVIEWS[0].src} alt="Preview of the Healthy Habits for Super Kids activity pack" className="h-24 w-20 rounded-xl border-4 border-white object-cover object-top shadow-md" /><div><h2 className="font-serif text-3xl font-semibold text-[#304536]">Know a family who would enjoy this?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#68766C]">{shareMessage}</p><p className="mt-1 text-xs text-[#879188]">The shared link opens the free activity pack; no personal information is added to it.</p></div></div><div className="flex flex-wrap items-center justify-center gap-3"><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" aria-label="Share on Facebook" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D8CDBA] bg-white px-4 py-2 text-sm font-semibold text-[#49634F] transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><Facebook className="h-4 w-4" /> Facebook</a><a href={buildPinterestShareUrl({ pageUrl: shareUrl, imageUrl: shareImageUrl, message: shareMessage })} target="_blank" rel="noreferrer" aria-label="Share on Pinterest" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D8CDBA] bg-white px-4 py-2 text-sm font-semibold text-[#49634F] transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><Heart className="h-4 w-4" /> Pinterest</a><a href={`https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${shareUrl}`)}`} target="_blank" rel="noreferrer" aria-label="Share on WhatsApp" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D8CDBA] bg-white px-4 py-2 text-sm font-semibold text-[#49634F] transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><MessageCircle className="h-4 w-4" /> WhatsApp</a><button type="button" onClick={copyShareLink} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D8CDBA] bg-white px-4 py-2 text-sm font-semibold text-[#49634F] transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied!" : "Copy link"}</button><a href={`mailto:?subject=${encodeURIComponent(SUPER_KIDS_SHARE_TITLE)}&body=${encodeURIComponent(`${shareMessage}\n\n${shareUrl}`)}`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D8CDBA] bg-white px-4 py-2 text-sm font-semibold text-[#49634F] transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><Link2 className="h-4 w-4" /> Email</a>{canNativeShare && <button type="button" onClick={nativeShare} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D8CDBA] bg-white px-4 py-2 text-sm font-semibold text-[#49634F] transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><Smartphone className="h-4 w-4" /> Share on device</button>}</div></div></section>


        <section className="print:hidden border-b border-[#EADFCB] bg-[#FFFDF8] px-5 py-14 sm:px-8"><div className="mx-auto max-w-3xl rounded-[2rem] border border-[#EADFCB] bg-[#FFF9F0] p-6 sm:p-10"><div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#A36E43]">More family activities</p><h2 className="mt-3 font-serif text-3xl font-semibold text-[#304536]">Get future printables by email.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#68766C]">Optional updates only—occasional activity ideas from The Patient’s Compass. Unsubscribe anytime.</p></div><Mail className="hidden h-8 w-8 shrink-0 text-[#6F8D78] sm:block" /></div>{newsletterSubmitted ? <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#DDEBCF] p-4 text-sm font-semibold text-[#405B48]" role="status"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> You’re on the list for future family activities.</div> : <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); if (newsletterEmail.trim()) newsletter.mutate({ email: newsletterEmail.trim() }); }}><label htmlFor="activity-newsletter-email" className="sr-only">Email address for future activities</label><Input id="activity-newsletter-email" type="email" required value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} placeholder="you@example.com" className="h-12 rounded-xl border-[#D8CDBA] bg-white" /><Button type="submit" disabled={newsletter.isPending} className="h-12 shrink-0 rounded-xl bg-[#6F8D78] px-5 hover:bg-[#5E7D67]">{newsletter.isPending ? "Joining…" : "Send me future activities"}</Button></form>}{newsletterError && <p className="mt-2 text-sm text-[#A34F43]" role="alert">{newsletterError}</p>}<p className="mt-3 text-xs text-[#7A857C]">We use your email only for this optional activity list.</p></div></section>
        <section className="print:hidden px-5 py-16 sm:px-8 sm:py-20"><div className="mx-auto max-w-4xl rounded-[2rem] bg-[#48644F] px-6 py-10 text-center text-white shadow-xl sm:px-12 sm:py-14"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#DDEBCF]">Ready for a super-powered afternoon?</p><h2 className="mx-auto mt-3 max-w-2xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">Download the activity pack and start exploring together.</h2><p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#E5F0E4]">No account. No sign-up. Just a free, printable resource for your family.</p><a href={ACTIVITY_PDF} download="Healthy-Habits-for-Super-Kids-Free-Printables.pdf" onClick={() => handleActivityPdfDownload("footer")} className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#F3C995] px-7 py-3 font-bold text-[#4B5E4D] transition hover:bg-[#F7D9AD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"><ArrowDownToLine className="h-5 w-5" /> Get the free printable PDF</a></div></section>
      </main>

      {shareToast && <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-[#BFD0C0] bg-[#304536] px-5 py-3 text-sm font-semibold text-white shadow-xl">{shareToast}</div>}

      <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
        <DialogContent className={`${pdfFullscreen ? "h-[100vh] max-h-[100vh] max-w-none rounded-none" : "max-h-[90vh] max-w-5xl"} overflow-y-auto border-[#EADFCB] bg-[#FFFDF8] p-4 sm:p-6`}>
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-8"><DialogTitle className="font-serif text-2xl text-[#304536]">Preview the full activity pack</DialogTitle><Button type="button" variant="outline" size="icon" onClick={() => setPdfFullscreen((fullscreen) => !fullscreen)} aria-label={pdfFullscreen ? "Exit fullscreen preview" : "Enter fullscreen preview"} className="h-9 w-9 shrink-0 border-[#BFD0C0] text-[#58705E]">{pdfFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</Button></div>
            <DialogDescription className="text-[#66736A]">Review all 19 pages in your browser before downloading. The PDF is free and requires no registration.</DialogDescription>
          </DialogHeader>
          <div className="relative h-[62vh] min-h-[360px] overflow-auto rounded-xl border border-[#EADFCB] bg-[#F6EBD8]">
            <iframe title={`Healthy Habits for Super Kids activity pack preview, page ${pdfPreviewPage} of ${PDF_PAGE_COUNT}`} src={`${ACTIVITY_PDF}#page=${pdfPreviewPage}&view=FitH`} className="block transition-[width,height] duration-200" style={{ width: `${pdfZoom * 100}%`, height: `${pdfZoom * 100}%`, minHeight: `${62 * pdfZoom}vh` }} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EADFCB] bg-[#FFF9F0] px-3 py-2" aria-label="PDF zoom controls">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7A857C]">Zoom</span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => setPdfZoom((zoom) => Math.max(1, +(zoom - 0.25).toFixed(2)))} disabled={pdfZoom === 1} aria-label="Zoom out" className="h-9 w-9 border-[#D8CDBA] text-[#58705E]"><ZoomOut className="h-4 w-4" /></Button>
              <span className="min-w-14 text-center text-sm font-semibold text-[#58705E]" aria-live="polite">{Math.round(pdfZoom * 100)}%</span>
              <Button type="button" variant="outline" size="icon" onClick={() => setPdfZoom((zoom) => Math.min(2, +(zoom + 0.25).toFixed(2)))} disabled={pdfZoom === 2} aria-label="Zoom in" className="h-9 w-9 border-[#D8CDBA] text-[#58705E]"><ZoomIn className="h-4 w-4" /></Button>
              {pdfZoom !== 1 && <Button type="button" variant="ghost" onClick={() => setPdfZoom(1)} className="h-9 text-xs text-[#58705E]">Reset</Button>}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="PDF thumbnail navigation">
            {PAGE_PREVIEWS.map((page, index) => {
              const pageNumber = index + 1;
              const active = pdfPreviewPage === pageNumber;
              return <button key={page.src} type="button" onClick={() => setPdfPreviewPage(pageNumber)} aria-label={`Jump to page ${pageNumber}: ${page.label}`} aria-current={active ? "page" : undefined} className={`w-16 shrink-0 rounded-lg border-2 bg-white p-1 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4] ${active ? "border-[#6F8D78] shadow-sm" : "border-transparent hover:border-[#BFD0C0]"}`}><img src={page.src} alt="" className="h-20 w-full rounded-md object-cover object-top" /><span className="mt-1 block truncate px-0.5 text-[10px] font-semibold text-[#607166]">Page {pageNumber}</span></button>;
            })}
          </div>
          <div className="flex items-center justify-between gap-3" aria-label="PDF page navigation">
            <Button type="button" variant="outline" disabled={pdfPreviewPage === 1} onClick={() => setPdfPreviewPage((page) => Math.max(1, page - 1))} className="border-[#D8CDBA] text-[#58705E]"><ArrowLeft className="mr-2 h-4 w-4" /> Previous page</Button>
            <p className="text-sm font-semibold text-[#607166]" aria-live="polite">Page {pdfPreviewPage} of {PDF_PAGE_COUNT}</p>
            <Button type="button" variant="outline" disabled={pdfPreviewPage === PDF_PAGE_COUNT} onClick={() => setPdfPreviewPage((page) => Math.min(PDF_PAGE_COUNT, page + 1))} className="border-[#D8CDBA] text-[#58705E]">Next page <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#EADFCB] bg-[#FFF9F0] p-3" aria-label="Share activity pack">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-[#7A857C]">Share</span>
            <a href={`mailto:?subject=${encodeURIComponent(SUPER_KIDS_SHARE_TITLE)}&body=${encodeURIComponent(`${shareMessage}\n\n${shareUrl}`)}`} onClick={() => handlePreviewShare("email")} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#D8CDBA] bg-white px-3 py-1.5 text-xs font-semibold text-[#49634F] transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><Mail className="h-3.5 w-3.5" /> Email</a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" onClick={() => handlePreviewShare("facebook")} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#D8CDBA] bg-white px-3 py-1.5 text-xs font-semibold text-[#49634F] transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><Facebook className="h-3.5 w-3.5" /> Facebook</a>
            <a href={buildPinterestShareUrl({ pageUrl: shareUrl, imageUrl: shareImageUrl, message: shareMessage })} target="_blank" rel="noreferrer" onClick={() => handlePreviewShare("pinterest")} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#D8CDBA] bg-white px-3 py-1.5 text-xs font-semibold text-[#49634F] transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><Heart className="h-3.5 w-3.5" /> Pinterest</a>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${shareUrl}`)}`} target="_blank" rel="noreferrer" onClick={() => handlePreviewShare("whatsapp")} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#D8CDBA] bg-white px-3 py-1.5 text-xs font-semibold text-[#49634F] transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
            <button type="button" onClick={copyPreviewShareLink} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#D8CDBA] bg-white px-3 py-1.5 text-xs font-semibold text-[#49634F] transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><Copy className="h-3.5 w-3.5" /> {copied ? "Copied!" : "Copy link"}</button>
            {canNativeShare && <button type="button" onClick={nativeShare} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#D8CDBA] bg-white px-3 py-1.5 text-xs font-semibold text-[#49634F] transition hover:bg-[#F3EBDD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><Smartphone className="h-3.5 w-3.5" /> Share</button>}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-[#7A857C]">19 pages · PDF · 29.9 KB · Use ←/→ to navigate</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={printActivityPack} disabled={printInitializing} aria-live="polite" className="border-[#BFD0C0] text-[#58705E]">{printInitializing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing print…</> : <><Printer className="mr-2 h-4 w-4" /> Print directly</>}</Button>
              <Button type="button" variant="outline" onClick={() => setPdfPreviewOpen(false)} className="border-[#D8CDBA] text-[#58705E]">Close</Button>
              <a href={ACTIVITY_PDF} download="Healthy-Habits-for-Super-Kids-Free-Printables.pdf" onClick={() => handleActivityPdfDownload("modal")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#6F8D78] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5E7D67] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#AFC7B2]"><Download className="h-4 w-4" /> Download PDF</a>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <footer className="print:hidden border-t border-[#EADFCB] px-5 py-8 text-center text-sm text-[#7A857C] sm:px-8"><p>Healthy Habits for Super Kids · A free resource by Sonya M.</p><p className="mt-1">Educational activities only—not medical advice. Children should participate with a trusted adult.</p><div className="mt-4 flex justify-center"><a href={ACTIVITY_PDF} download="Healthy-Habits-for-Super-Kids-Free-Printables.pdf" onClick={(event) => { const touchDevice = window.matchMedia("(hover: none)").matches || navigator.maxTouchPoints > 0; if (touchDevice && !footerPreviewOpen) { event.preventDefault(); setFooterPreviewOpen(true); trackSuperKidsMobilePreviewReveal(); window.setTimeout(() => setFooterPreviewOpen(false), 5000); return; } if (touchDevice) { setFooterDownloadStarting(true); window.setTimeout(() => setFooterDownloadStarting(false), 1800); trackSuperKidsMobileDownloadComplete(); } trackSuperKidsPdfTextLinkClick(); }} aria-expanded={footerPreviewOpen} aria-describedby="footer-activity-pack-preview" className="group relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#58705E] underline decoration-[#AFC7B2] decoration-2 underline-offset-4 transition-colors hover:bg-[#F3EBDD] hover:text-[#D27F5D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D3E2D4]"><FileText className="h-4 w-4 text-[#6F8D78] transition-colors group-hover:text-[#D27F5D]" aria-hidden="true" /><span className="transition-colors group-hover:text-[#D27F5D]">Your Super Kid Activity Pack</span><span className="text-xs font-medium no-underline text-[#8A978D] transition-colors group-hover:text-[#A36E43]">19 pages · completely free</span><span id="footer-activity-pack-preview" role="tooltip" className={`${footerPreviewOpen ? "block" : "hidden group-hover:block group-focus-within:block"} pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 w-44 -translate-x-1/2 rounded-xl border border-[#EADFCB] bg-white p-2 text-left text-xs font-normal text-[#58705E] shadow-[0_12px_30px_rgba(73,99,79,.18)]`}><img src={PAGE_PREVIEWS[0].src} alt="Preview of the first page of the Super Kid Activity Pack" className="mb-2 h-28 w-full rounded-lg object-cover object-top" />{footerDownloadStarting ? <span className="mt-1 flex items-center justify-center gap-2 font-semibold text-[#58705E]" role="status"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Starting download…</span> : <><span className="block">Preview the first page</span>{footerPreviewOpen && <span className="mt-1 block motion-safe:animate-pulse font-semibold text-[#D27F5D]">Tap again to download</span>}</>}</span></a></div></footer>
    </div>
  );
}
