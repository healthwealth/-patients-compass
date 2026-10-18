import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Copy, Database, ImageDown, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminGuard } from "@/hooks/useAdminGuard";

type FileImportResult = {
  ok: boolean;
  total: number;
  alreadyInR2: number;
  copied: string[];
  failed: string[];
  remaining: number;
  done: boolean;
  error?: string;
};

type TableResult = {
  table: string;
  skipped: boolean;
  reason?: string;
  received?: number;
  inserted: number;
  matchedExisting?: number;
  errors: string[];
};

const MANUS_EXPORT_PROMPT = `Export every table in this project's database to ONE JSON file named patients-compass-export.json.
Shape it exactly like this: { "tables": { "<table_name>": [ { "<column>": value, ... }, ... ] } }
Include every row and every column, use the real table and column names, write dates as ISO 8601 UTC strings, and keep JSON columns as JSON. Then give me the file to download.`;

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: body === undefined ? "{}" : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: string }).error || `Request failed (${response.status})`);
  return data as T;
}

export default function AdminMigration() {
  const { loading, isAdmin } = useAdminGuard();
  const [fileRun, setFileRun] = useState<{ running: boolean; copied: number; failed: string[]; total: number; done: boolean } | null>(null);
  const [dataRun, setDataRun] = useState<{ running: boolean; results: TableResult[] } | null>(null);

  const copyFiles = async () => {
    setFileRun({ running: true, copied: 0, failed: [], total: 0, done: false });
    let copied = 0;
    try {
      for (let round = 0; round < 20; round++) {
        const result = await postJson<FileImportResult>("/api/admin/migration/import-files");
        copied += result.copied.length;
        setFileRun({ running: !result.done && result.remaining > 0, copied, failed: result.failed, total: result.total, done: result.remaining === 0 });
        if (result.remaining === 0) break;
      }
      toast.success("File copy finished");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "File copy failed");
      setFileRun(current => (current ? { ...current, running: false } : current));
    }
  };

  const importData = async (file: File) => {
    setDataRun({ running: true, results: [] });
    try {
      const parsed = JSON.parse(await file.text());
      const tables = parsed?.tables ?? parsed;
      const result = await postJson<{ ok: boolean; results: TableResult[] }>("/api/admin/migration/import-data", { tables });
      setDataRun({ running: false, results: result.results });
      toast.success("Import finished");
    } catch (error) {
      setDataRun({ running: false, results: [] });
      toast.error(error instanceof Error ? error.message : "Import failed — is this the JSON export file?");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F4EF]">
        <Loader2 className="h-6 w-6 animate-spin text-[#7E9A85]" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#F7F4EF] px-4 py-10">
      <SEO title="Move from Manus | Admin" description="Copy files and data from the old Manus site." noIndex />
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-[#5C5A59] hover:text-[#2C2A29]">
          <ArrowLeft className="h-4 w-4" /> Admin dashboard
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#2C2A29]">Move from Manus</h1>
          <p className="mt-2 text-sm leading-6 text-[#5C5A59]">
            Two one-time steps to bring everything over from the old Manus site. Both are safe to run more than once — anything already copied is skipped.
          </p>
        </div>

        <Card className="border-[#EBE6DC]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><ImageDown className="h-5 w-5 text-[#7E9A85]" /> 1. Copy images, PDFs and videos</CardTitle>
            <CardDescription>
              Copies every file the site uses from the old Manus address into Cloudflare storage. This also happens automatically every hour, so this button just speeds it up.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={copyFiles} disabled={fileRun?.running} className="bg-[#7E9A85] text-white hover:bg-[#6F8C76]">
              {fileRun?.running ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Copying…</> : "Copy files now"}
            </Button>
            {fileRun && (
              <div className="rounded-lg border border-[#EBE6DC] bg-white p-3 text-sm text-[#2C2A29]" role="status">
                <p>{fileRun.done ? <CheckCircle2 className="mr-1 inline h-4 w-4 text-[#51715B]" /> : null}Files known: {fileRun.total} · copied this run: {fileRun.copied}{fileRun.done ? " · all done" : ""}</p>
                {fileRun.failed.length > 0 && (
                  <details className="mt-2 text-xs text-[#9A4B32]">
                    <summary>{fileRun.failed.length} could not be copied (usually test images that never existed)</summary>
                    <ul className="mt-1 list-disc pl-5">{fileRun.failed.map(item => <li key={item}>{item}</li>)}</ul>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#EBE6DC]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Database className="h-5 w-5 text-[#7E9A85]" /> 2. Import members, blog posts and other data</CardTitle>
            <CardDescription>
              In Manus, open this project and paste the request below. Manus will give you a JSON file — upload it here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative rounded-lg border border-[#EBE6DC] bg-white p-3 pr-12 text-xs leading-5 text-[#2C2A29]">
              <pre className="whitespace-pre-wrap font-sans">{MANUS_EXPORT_PROMPT}</pre>
              <button
                type="button"
                aria-label="Copy the request for Manus"
                className="absolute right-2 top-2 rounded p-1.5 text-[#5C5A59] hover:bg-[#F7F4EF]"
                onClick={() => navigator.clipboard.writeText(MANUS_EXPORT_PROMPT).then(() => toast.success("Copied"))}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#7E9A85] px-4 py-2 text-sm font-semibold text-[#51715B] hover:bg-[#7E9A85]/10">
              {dataRun?.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {dataRun?.running ? "Importing…" : "Upload export file (.json)"}
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                disabled={dataRun?.running}
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) void importData(file);
                  event.target.value = "";
                }}
              />
            </label>
            {dataRun && dataRun.results.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-[#EBE6DC] bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FBFAF8] text-[#5C5A59]">
                    <tr><th className="p-2">Table</th><th className="p-2">Rows in file</th><th className="p-2">Added</th><th className="p-2">Notes</th></tr>
                  </thead>
                  <tbody>
                    {dataRun.results.map(result => (
                      <tr key={result.table} className="border-t border-[#EBE6DC] align-top">
                        <td className="p-2 font-medium">{result.table}</td>
                        <td className="p-2">{result.received ?? "—"}</td>
                        <td className="p-2">{result.inserted}</td>
                        <td className="p-2 text-[#5C5A59]">
                          {result.skipped
                            ? `Skipped: ${result.reason}`
                            : [
                                result.matchedExisting ? `${result.matchedExisting} matched an account already on the new site (merged by email)` : "",
                                result.errors.length ? result.errors.join("; ") : "",
                                !result.errors.length && result.received && result.inserted + (result.matchedExisting ?? 0) < result.received ? "Others were already here" : "",
                              ].filter(Boolean).join(" · ") || "OK"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
