import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

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
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    const parser = new PDFParse({ data: buffer });
    try {
      text = (await parser.getText()).text;
    } finally {
      await parser.destroy();
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
