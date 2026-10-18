import { useState } from "react";
import { Activity, Apple, CheckCircle2, Clock3, ExternalLink, HeartPulse, Info, Link2, Loader2, ShieldCheck, Watch } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type SourceStatus = "active" | "not-connected";

type Source = {
  name: string;
  description: string;
  status: SourceStatus;
  icon: typeof Apple;
  category: string;
  lastSyncedAt: string | null;
  supportsManualSync: boolean;
};

const SOURCES: Source[] = [
  { name: "Apple Health", description: "Import selected activity, sleep, and wellness data from the Apple Health permission flow.", status: "not-connected", icon: Apple, category: "Mobile health", lastSyncedAt: null, supportsManualSync: false },
  { name: "Fitbit", description: "Connect wearable activity and sleep summaries through an explicit OAuth permission review.", status: "not-connected", icon: Activity, category: "Wearable", lastSyncedAt: null, supportsManualSync: false },
  { name: "Oura Ring", description: "Connect readiness, sleep, and recovery summaries through an authorized Oura account.", status: "not-connected", icon: HeartPulse, category: "Wearable", lastSyncedAt: null, supportsManualSync: false },
  { name: "Garmin", description: "Connect selected activity and wellness summaries from a Garmin account.", status: "not-connected", icon: Watch, category: "Wearable", lastSyncedAt: null, supportsManualSync: false },
];

const FITBIT_AUTHORIZATION_URL = import.meta.env.VITE_FITBIT_AUTHORIZATION_URL as string | undefined;
const FITBIT_SCOPES = [
  { name: "profile", explanation: "Basic Fitbit account profile needed to associate the connection." },
  { name: "activity", explanation: "Activity summaries such as steps and active minutes." },
  { name: "sleep", explanation: "Sleep summaries needed for the wellness overview." },
];

function formatLastSynced(timestamp: string | null) {
  return timestamp ? new Date(timestamp).toLocaleString() : "Never synced";
}

export default function IntegrationHub() {
  const [fitbitOpen, setFitbitOpen] = useState(false);
  const [scopeAccepted, setScopeAccepted] = useState(false);
  const [syncingSource, setSyncingSource] = useState<string | null>(null);
  const connectedCount = SOURCES.filter((source) => source.status === "active").length;

  const openFitbitAuthorization = () => {
    if (!scopeAccepted) return;
    if (!FITBIT_AUTHORIZATION_URL) {
      toast.info("Fitbit authorization is not configured for this environment yet.");
      return;
    }
    window.location.assign(FITBIT_AUTHORIZATION_URL);
  };

  const syncNow = (source: Source) => {
    if (!source.supportsManualSync || source.status !== "active") return;
    setSyncingSource(source.name);
    window.setTimeout(() => {
      setSyncingSource(null);
      toast.info(`${source.name} sync is queued.`);
    }, 500);
  };

  return (
    <main className="min-h-screen bg-[#F7F4EE] px-4 py-10 text-[#2F332F] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#7E9A85]/30 bg-[#7E9A85]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#687D6D]"><Link2 className="h-3.5 w-3.5" /> Integration Hub</div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Your connected health sources</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#697069]">Review which external health data sources are connected to Patients Compass. No external source is connected in this environment yet.</p>
          </div>
          <Link href="/dashboard"><Button variant="outline" className="w-fit border-[#BFCFBE] text-[#58705E] hover:bg-[#F1F6F1]">Back to dashboard</Button></Link>
        </div>

        <Card className="mb-8 overflow-hidden border-[#C9D8CB] bg-gradient-to-br from-[#F0F6F0] to-white shadow-sm">
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4"><div className="rounded-2xl bg-[#6F8D78]/15 p-3 text-[#6F8D78]"><ShieldCheck className="h-6 w-6" /></div><div><p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#687D6D]">Connection status</p><p className="mt-1 text-2xl font-semibold text-[#2F332F]">{connectedCount} of {SOURCES.length} external sources connected</p><p className="mt-1 text-sm text-[#697069]">Last-sync timestamps and manual sync controls appear after an authorized provider setup.</p></div></div>
            <div className="flex items-center gap-2 rounded-full border border-[#D8E4D9] bg-white px-4 py-2 text-sm font-semibold text-[#687D6D]"><span className="h-2.5 w-2.5 rounded-full bg-[#A6B3A8]" /> No active external sync</div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl font-semibold text-[#2F332F]">Available sources</h2><p className="mt-1 text-sm text-[#697069]">Statuses are limited to connection state; health values are never shown in this summary.</p></div><Badge variant="outline" className="border-[#D4DCD4] bg-white text-[#687D6D]">Privacy-first</Badge></div>
        <div className="grid gap-5 md:grid-cols-2">
          {SOURCES.map((source) => {
            const Icon = source.icon;
            const active = source.status === "active";
            return <Card key={source.name} className="border-[#E6E0D5] bg-white/90 shadow-sm transition-shadow hover:shadow-md"><CardHeader><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-[#F0F4EF] p-2.5 text-[#6F8D78]"><Icon className="h-5 w-5" /></div><div><CardTitle className="text-lg">{source.name}</CardTitle><CardDescription className="mt-1">{source.category}</CardDescription></div></div><Badge className={active ? "border border-[#BFD6C2] bg-[#EDF7EE] text-[#4B7655]" : "border border-[#E2DED5] bg-[#F8F6F1] text-[#7A7A70]"}>{active ? <><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Connected</> : <><Clock3 className="mr-1 h-3.5 w-3.5" /> Not connected</>}</Badge></div></CardHeader><CardContent><p className="text-sm leading-6 text-[#697069]">{source.description}</p><div className="mt-5 grid gap-3 border-t border-[#EEEAE2] pt-4 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#858A84]">Last synced</p><p className="mt-1 text-sm text-[#697069]">{formatLastSynced(source.lastSyncedAt)}</p></div><div className="flex flex-wrap gap-2 sm:justify-end">{source.name === "Fitbit" && <Button type="button" variant="outline" onClick={() => { setScopeAccepted(false); setFitbitOpen(true); }} className="border-[#BFCFBE] text-[#58705E] hover:bg-[#F1F6F1]">Review Fitbit access</Button>}<Button type="button" variant="outline" disabled={!active || !source.supportsManualSync || syncingSource === source.name} onClick={() => syncNow(source)} className="border-[#D6DED5] text-[#687D6D]">{syncingSource === source.name ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Syncing…</> : "Sync Now"}</Button></div></div></CardContent></Card>;
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-[#E2DED5] bg-white/70 p-5 text-sm leading-6 text-[#697069]"><p className="font-semibold text-[#465047]">What this status means</p><p className="mt-1">Patients Compass does not currently have an active external health-data connector in this environment. When a provider is connected, this page will show the provider name, permission scope, last successful sync time, and a manual sync control. It will not display lab values, symptoms, or raw wearable records in the connection summary.</p></div>
      </div>

      <Dialog open={fitbitOpen} onOpenChange={setFitbitOpen}>
        <DialogContent className="border-[#D8E4D9] bg-[#FCFDFB] text-[#2F332F]">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-xl"><Activity className="h-5 w-5 text-[#6F8D78]" /> Review Fitbit access</DialogTitle><DialogDescription>Patients Compass will request only the following read-only Fitbit scopes. You can decline any permission on Fitbit’s authorization page.</DialogDescription></DialogHeader>
          <div className="rounded-xl border border-[#E3E8E3] bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#687D6D]">Requested permissions</p><div className="mt-3 space-y-3">{FITBIT_SCOPES.map((scope) => <div key={scope.name} className="flex gap-3"><div className="mt-0.5 rounded-full bg-[#EDF3EE] px-2 py-0.5 font-mono text-xs font-semibold text-[#58705E]">{scope.name}</div><p className="text-sm leading-5 text-[#697069]">{scope.explanation}</p></div>)}</div></div>
          <div className="flex gap-3 rounded-xl border border-[#E6E0D5] bg-[#F8F6F1] p-3 text-xs leading-5 text-[#697069]"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#B37B4D]" /><p>Fitbit’s legacy Web API is scheduled to turn off on October 30, 2026. A production connector should use the current Google Health migration path and PKCE, with tokens handled server-side.</p></div>
          <label className="flex items-start gap-3 rounded-xl border border-[#D8E4D9] bg-white p-3 text-sm leading-5 text-[#465047]"><Checkbox checked={scopeAccepted} onCheckedChange={(checked) => setScopeAccepted(checked === true)} className="mt-0.5" /><span>I understand the requested scopes and want to continue to Fitbit’s authorization page.</span></label>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setFitbitOpen(false)} className="border-[#D6DED5] text-[#687D6D]">Cancel</Button><Button type="button" disabled={!scopeAccepted || !FITBIT_AUTHORIZATION_URL} onClick={openFitbitAuthorization} className="bg-[#6F8D78] text-white hover:bg-[#5F7B68]">{FITBIT_AUTHORIZATION_URL ? "Continue to Fitbit" : "Authorization not configured"}<ExternalLink className="ml-2 h-4 w-4" /></Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
