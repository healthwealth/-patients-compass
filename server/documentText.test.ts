import { describe, expect, it } from "vitest";
import { extractDocumentText } from "./lib/documentText";

describe("document text extraction", () => {
  it("extracts and normalizes bounded plain text", async () => {
    const result = await extractDocumentText({ fileName: "visit notes.txt", contentType: "text/plain", dataBase64: Buffer.from("Line one.\r\nLine two.").toString("base64") });
    expect(result).toMatchObject({ fileName: "visit notes.txt", text: "Line one.\nLine two.", truncated: false });
  });

  it("rejects empty or invalid base64 content", async () => {
    await expect(extractDocumentText({ fileName: "notes.txt", contentType: "text/plain", dataBase64: "%%%" })).rejects.toThrow("base64");
  });
});
