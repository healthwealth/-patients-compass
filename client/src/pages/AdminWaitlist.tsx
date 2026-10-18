import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { Link } from "wouter";
import { Download, Users, Mail, Clock, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

function exportToCsv(entries: { email: string; name: string | null; createdAt: Date }[]) {
  const header = "Email,Name,Signed Up At\n";
  const rows = entries
    .map((e) => {
      const email = `"${e.email.replace(/"/g, '""')}"`;
      const name = e.name ? `"${e.name.replace(/"/g, '""')}"` : "";
      const date = new Date(e.createdAt).toISOString();
      return `${email},${name},${date}`;
    })
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminWaitlist() {
  // ── useAdminGuard handles auth loading + role check + redirect ──
  const { loading: adminLoading, isAdmin } = useAdminGuard();

  const {
    data: entries,
    isLoading,
    error,
  } = trpc.email.waitlistEntries.useQuery(undefined, {
    enabled: isAdmin,
    retry: false,
  });

  const notifyAll = trpc.email.notifyAllWaitlist.useMutation({
    onSuccess: (data) => {
      if (data.sent) {
        toast.success(
          `Re-engagement notification sent! ${data.count} email${data.count === 1 ? "" : "s"} sent successfully.`
        );
      } else {
        toast.warning(data.message + " Use CSV export instead.");
      }
    },
    onError: () => toast.error("Failed to send notification. Try CSV export."),
  });

  // ── Show spinner while auth resolves or data loads ──
  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#6B6560]">
          <div className="w-8 h-8 border-2 border-[#7E9A85] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading waitlist…</span>
        </div>
      </div>
    );
  }

  // useAdminGuard already redirects non-admins; this is a safety fallback
  if (!isAdmin) return null;

  const count = entries?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#F8F6F1] py-10 px-4">
      <SEO
        title="Admin — Waitlist"
        description="Admin waitlist management."
        path="/admin/waitlist"
        noIndex={true}
      />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="p-2 rounded-lg hover:bg-[#EDE9E0] text-[#6B6560] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#2C2A29]">Sign-In Waitlist</h1>
            <p className="text-sm text-[#6B6560]">
              Users who want to be notified when authentication is restored
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => notifyAll.mutate()}
              disabled={count === 0 || notifyAll.isPending}
              variant="outline"
              className="gap-2 border-[#7E9A85] text-[#7E9A85] hover:bg-[#7E9A85]/10"
            >
              {notifyAll.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#7E9A85] border-t-transparent rounded-full animate-spin" />
                  Sending…
                </>
              ) : notifyAll.isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Notified!
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Notify Me (Re-engage)
                </>
              )}
            </Button>
            <Button
              onClick={() => entries && exportToCsv(entries)}
              disabled={!entries || entries.length === 0}
              className="gap-2 bg-[#7E9A85] hover:bg-[#6A8571] text-white"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#7E9A85]/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#7E9A85]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#2C2A29]">{count}</p>
                  <p className="text-xs text-[#6B6560]">Total subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#2C2A29]">
                    {entries && entries.length > 0
                      ? new Date(entries[0].createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                  <p className="text-xs text-[#6B6560]">Latest sign-up</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#2C2A29]">
                    {entries && entries.length > 0
                      ? new Date(entries[entries.length - 1].createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                  <p className="text-xs text-[#6B6560]">First sign-up</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Subscribers</CardTitle>
            <CardDescription>
              All users who submitted their email via the maintenance banner or sign-in page.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {error ? (
              <div className="px-6 py-8 text-center text-sm text-red-600">
                Failed to load waitlist entries. Please try again.
              </div>
            ) : count === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users className="w-10 h-10 text-[#C5BFB5] mx-auto mb-3" />
                <p className="text-sm text-[#6B6560]">No subscribers yet.</p>
                <p className="text-xs text-[#9A9896] mt-1">
                  Entries will appear here once users submit the waitlist form.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#EDE9E0] bg-[#F8F6F1]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B6560] uppercase tracking-wide">
                        #
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B6560] uppercase tracking-wide">
                        Email
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B6560] uppercase tracking-wide">
                        Name
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B6560] uppercase tracking-wide">
                        Signed Up
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries!.map((entry, i) => (
                      <tr
                        key={entry.id}
                        className="border-b border-[#EDE9E0] last:border-0 hover:bg-[#F8F6F1] transition-colors"
                      >
                        <td className="px-6 py-3 text-[#9A9896]">{i + 1}</td>
                        <td className="px-6 py-3 font-medium text-[#2C2A29]">{entry.email}</td>
                        <td className="px-6 py-3 text-[#6B6560]">
                          {entry.name ?? (
                            <span className="text-[#C5BFB5] italic">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-[#6B6560]">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {count > 0 && (
          <p className="text-xs text-center text-[#9A9896]">
            Use "Export CSV" to download all {count} email{count === 1 ? "" : "s"} for your
            re-engagement campaign when sign-in is restored.
          </p>
        )}
      </div>
    </div>
  );
}
