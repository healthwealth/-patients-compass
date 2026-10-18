import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export const supportedDocumentTypes = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type SupportedDocumentType = (typeof supportedDocumentTypes)[number];

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_EXTRACTED_CHARACTERS = 15_000;

export async function extractDocumentText(input: {
  fileName: string;
  contentType: SupportedDocumentType;
  dataBase64: string;
}) {
  if (!/^[A-Za-z0-9+/=]+$/.test(input.dataBase64)) throw new Error("Document data is not valid base64.");
  const buffer = Buffer.from(input.dataBase64, "base64");
  if (!buffer.length) throw new Error("The selected document is empty.");
  if (buffer.length > MAX_FILE_BYTES) throw new Error("Documents must be 5 MB or smaller.");

  let text = "";
  if (input.contentType === "text/plain") {
    text = buffer.toString("utf8");
  } else if (input.contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    // Node builds of mammoth read `buffer`; the Workers (browser) build reads `arrayBuffer`.
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const result = await mammoth.extractRawText({ buffer, arrayBuffer } as Parameters<typeof mammoth.extractRawText>[0]);
    text = result.value;
  } else {
    // unpdf bundles a serverless build of PDF.js that runs on Cloudflare Workers.
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    try {
      const result = await extractText(pdf, { mergePages: true });
      text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
    } finally {
      await (pdf as unknown as { destroy?: () => Promise<void> }).destroy?.().catch(() => undefined);
    }
  }

  const normalized = text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  if (!normalized) throw new Error("No readable text was found in this document.");
  return {
    fileName: input.fileName.replace(/[^A-Za-z0-9._ -]/g, "").slice(0, 120) || "document",
    text: normalized.slice(0, MAX_EXTRACTED_CHARACTERS),
    truncated: normalized.length > MAX_EXTRACTED_CHARACTERS,
  };
}
