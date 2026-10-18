import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { useDocumentAttachment } from "@/hooks/useDocumentAttachment";

type AttachmentController = ReturnType<typeof useDocumentAttachment>;

export function DocumentAttachmentControl({ controller, compact = false, disabled = false }: { controller: AttachmentController; compact?: boolean; disabled?: boolean }) {
  const { inputRef, attachment, preview, progress, status, sizeFeedback, choose, clear, openPicker } = controller;
  const busy = status === "reading" || status === "extracting";

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept=".txt,text/plain,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf" className="sr-only" onChange={(event) => void choose(event.target.files?.[0])} />
      <div className="flex items-center gap-2">
        <button type="button" onClick={openPicker} disabled={disabled || busy} className={`flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#F9F6F0] px-2.5 text-[#7E9A85] transition-all duration-150 hover:bg-[#EBE6DC] disabled:cursor-not-allowed disabled:opacity-40 ${compact ? "h-9" : "h-11"}`} title="Attach a PDF or DOCX document" aria-label="Attach a PDF or DOCX document">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className={compact ? "h-4 w-4" : "h-5 w-5"} />}
          <span className={`${compact ? "hidden min-[440px]:inline" : "inline"} text-xs font-medium`}>{busy ? "Processing" : compact ? "Attach file" : "Attach"}</span>
        </button>
        <span className={`text-[10px] ${status === "error" ? "text-[#B85C47]" : "text-[#7A766E]"}`}>{sizeFeedback}</span>
      </div>
      {(busy || status === "ready") && (
        <div aria-live="polite" className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#E9E4DA]">
            <div className="h-full rounded-full bg-[#7E9A85] transition-[width] duration-200" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-[#7A766E]">{status === "reading" ? `Reading file · ${progress}%` : status === "extracting" ? "Extracting readable text securely…" : "Ready to send · 100%"}</p>
        </div>
      )}
      {attachment && preview && (
        <div className="rounded-xl border border-[#D9D3C8] bg-white/90 p-3 text-left">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#7E9A85]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#2C2A29]">{attachment.fileName}</p>
              <p className="text-[10px] text-[#7A766E]">{preview.characterCount.toLocaleString()} extracted characters{preview.truncated ? " · preview truncated to the safe limit" : ""}</p>
            </div>
            <button type="button" onClick={clear} className="rounded-md p-1 text-[#9E9A90] hover:bg-[#F4F0E8] hover:text-[#B85C47]" aria-label="Remove attached document"><X className="h-3.5 w-3.5" /></button>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-[11px] font-semibold text-[#7E9A85]">Preview extracted text before sending</summary>
            <div className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap rounded-lg bg-[#F8F5EF] p-2 text-[11px] leading-relaxed text-[#4C4944]">{preview.text}</div>
          </details>
          <p className="mt-2 text-[10px] leading-relaxed text-[#7A766E]">Review this text before sending. It is used only for the current question and is not saved in chat history.</p>
        </div>
      )}
    </div>
  );
}
