import { trpc } from "@/lib/trpc";
import { useRef, useState } from "react";
import { toast } from "sonner";

export type DocumentAttachment = {
  fileName: string;
  contentType: "text/plain" | "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  dataBase64: string;
};

export type DocumentPreview = {
  fileName: string;
  text: string;
  truncated: boolean;
  characterCount: number;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["text/plain", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileWithProgress(file: File, onProgress: (value: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.max(5, Math.round((event.loaded / event.total) * 65)));
    };
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read this document."));
    reader.readAsDataURL(file);
  });
}

export function useDocumentAttachment(isAuthenticated: boolean) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<DocumentAttachment | null>(null);
  const [preview, setPreview] = useState<DocumentPreview | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "reading" | "extracting" | "ready" | "error">("idle");
  const [sizeFeedback, setSizeFeedback] = useState("PDF, DOCX, or TXT · maximum 5 MB");
  const previewMutation = trpc.medicalAssistant.previewDocument.useMutation();

  const clear = () => {
    setAttachment(null);
    setPreview(null);
    setProgress(0);
    setStatus("idle");
    setSizeFeedback("PDF, DOCX, or TXT · maximum 5 MB");
    if (inputRef.current) inputRef.current.value = "";
  };

  const openPicker = () => {
    if (!isAuthenticated) {
      toast.error("Sign in to attach a document securely.");
      return;
    }
    inputRef.current?.click();
  };

  const choose = async (file?: File) => {
    if (!file) return;
    if (!isAuthenticated) {
      toast.error("Sign in to attach a document securely.");
      return;
    }
    clear();
    const extension = file.name.toLowerCase().split(".").pop();
    const inferredType = extension === "txt" ? "text/plain" : extension === "pdf" ? "application/pdf" : extension === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "";
    const contentType = file.type || inferredType;
    setSizeFeedback(`${formatBytes(file.size)} selected · 5 MB maximum`);
    if (!ALLOWED.includes(contentType as (typeof ALLOWED)[number])) {
      setStatus("error");
      toast.error("Choose a TXT, DOCX, or PDF document.");
      return;
    }
    if (!file.size || file.size > MAX_BYTES) {
      setStatus("error");
      toast.error(`This file is ${formatBytes(file.size)}. Choose a document no larger than 5 MB.`);
      return;
    }

    try {
      setStatus("reading");
      setProgress(5);
      const dataBase64 = await readFileWithProgress(file, setProgress);
      const nextAttachment: DocumentAttachment = {
        fileName: file.name.slice(0, 180),
        contentType: contentType as DocumentAttachment["contentType"],
        dataBase64,
      };
      setStatus("extracting");
      setProgress(78);
      const extracted = await previewMutation.mutateAsync(nextAttachment);
      setAttachment(nextAttachment);
      setPreview(extracted);
      setProgress(100);
      setStatus("ready");
      toast.success("Document processed. Review the extracted text before sending.");
    } catch (error) {
      setStatus("error");
      setProgress(0);
      toast.error(error instanceof Error ? error.message : "Could not read this document.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return { inputRef, attachment, preview, progress, status, sizeFeedback, choose, clear, openPicker };
}
