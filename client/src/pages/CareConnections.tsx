import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowDownAZ, ArrowLeft, ExternalLink, HeartHandshake, Info, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { trackCareConnectionsConsentCompleted, trackCareConnectionsDirectoryView } from "@/lib/gtm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CONSENT_VERSION = "2026-09-17";

export default function CareConnections() {
  const [state, setState] = useState("all");
  const [specialty, setSpecialty] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");
  const [selectedPartner, setSelectedPartner] = useState<null | { id: number; name: string; websiteUrl: string }>(null);
  const [consented, setConsented] = useState(false);
  const queryInput = useMemo(() => ({ state: state === "all" ? undefined : state, specialty: specialty === "all" ? undefined : specialty }), [specialty, state]);
  const partnersQuery = trpc.careConnections.list.useQuery(queryInput);
  const consent = trpc.careConnections.recordConsent.useMutation({
    onError: (error) => toast.error(error.message || "We could not record your choice."),
  });
  useEffect(() => { trackCareConnectionsDirectoryView(); }, []);

  const states = useMemo(() => Array.from(new Set((partnersQuery.data ?? []).flatMap((partner) => partner.states))).sort(), [partnersQuery.data]);
  const specialties = useMemo(() => Array.from(new Set((partnersQuery.data ?? []).flatMap((partner) => partner.specialties))).sort(), [partnersQuery.data]);
  const sortedPartners = useMemo(() => [...(partnersQuery.data ?? [])].sort((a, b) => {
    if (sortBy === "name_desc") return b.name.localeCompare(a.name);
    if (sortBy === "verified_newest") return new Date(b.verifiedAt ?? 0).getTime() - new Date(a.verifiedAt ?? 0).getTime();
    if (sortBy === "license_expiry") return new Date(a.licenseExpiresAt ?? "9999-12-31").getTime() - new Date(b.licenseExpiresAt ?? "9999-12-31").getTime();
    return a.name.localeCompare(b.name);
  }), [partnersQuery.data, sortBy]);

  const openPartner = (partner: { id: number; name: string; websiteUrl: string }) => {
    setSelectedPartner(partner);
    setConsented(false);
  };

  const continueToPartner = async () => {
    if (!selectedPartner || !consented) return;
    await consent.mutateAsync({ partnerId: selectedPartner.id, consentVersion: CONSENT_VERSION });
    trackCareConnectionsConsentCompleted();
    window.open(selectedPartner.websiteUrl, "_blank", "noopener,noreferrer");
    setSelectedPartner(null);
  };

  return (
    <main className="min-h-screen bg-[#F7F4EF] text-[#2C2A29]">
      <section className="border-b border-[#E8E0D4] bg-[#EEF4EE]">
        <div className="container py-10 md:py-16">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[#607A68] hover:text-[#2C2A29]"><ArrowLeft className="h-4 w-4" /> Back to Home</Link>
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-white text-[#607A68] hover:bg-white"><HeartHandshake className="mr-2 h-4 w-4" /> Licensed Care Connections</Badge>
            <h1 className="font-serif text-4xl font-bold tracking-tight md:text-6xl">Find a licensed care partner when you are ready.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5C5A59]">A curated directory of independent third-party providers. Patients Compass helps you compare publicly available information; the partner handles care, scheduling, payment, records, and clinical decisions.</p>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-[#526257] md:grid-cols-3">
            <div className="flex gap-3 rounded-xl border border-[#D8E4D8] bg-white/70 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#71917A]" /><span>No health information is requested by this directory.</span></div>
            <div className="flex gap-3 rounded-xl border border-[#D8E4D8] bg-white/70 p-4"><ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-[#71917A]" /><span>You will leave Patients Compass before contacting a partner.</span></div>
            <div className="flex gap-3 rounded-xl border border-[#D8E4D8] bg-white/70 p-4"><Info className="mt-0.5 h-5 w-5 shrink-0 text-[#71917A]" /><span>This is not an emergency or clinical triage service.</span></div>
          </div>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#71917A]">Partner directory</p><h2 className="mt-2 font-serif text-3xl font-bold">Browse by location and focus</h2></div>
          <div className="grid w-full gap-3 sm:grid-cols-2 md:w-[620px] md:grid-cols-3">
            <Select value={state} onValueChange={setState}><SelectTrigger aria-label="Filter by state"><SelectValue placeholder="All states" /></SelectTrigger><SelectContent><SelectItem value="all">All states</SelectItem>{states.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            <Select value={specialty} onValueChange={setSpecialty}><SelectTrigger aria-label="Filter by specialty"><SelectValue placeholder="All specialties" /></SelectTrigger><SelectContent><SelectItem value="all">All specialties</SelectItem>{specialties.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger aria-label="Sort partners"><ArrowDownAZ className="mr-2 h-4 w-4 text-[#71917A]" /><SelectValue placeholder="Sort partners" /></SelectTrigger><SelectContent><SelectItem value="name_asc">Name: A to Z</SelectItem><SelectItem value="name_desc">Name: Z to A</SelectItem><SelectItem value="verified_newest">Recently verified</SelectItem><SelectItem value="license_expiry">License expiry: soonest</SelectItem></SelectContent></Select>
          </div>
        </div>
        {partnersQuery.isLoading ? <div className="rounded-2xl border border-[#E8E0D4] bg-white p-10 text-center text-[#5C5A59]">Loading care partners…</div> : partnersQuery.isError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-800">The directory is temporarily unavailable. Please try again later.</div> : sortedPartners.length ? <div className="grid gap-5 md:grid-cols-2">{sortedPartners.map((partner) => <Card key={partner.id} className="border-[#E8E0D4] bg-white shadow-sm transition-transform hover:-translate-y-0.5"><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle>{partner.name}</CardTitle><CardDescription className="mt-2 leading-6">{partner.description}</CardDescription></div><Badge variant="outline" className="shrink-0 text-[#607A68]"><ShieldCheck className="mr-1 h-3 w-3" /> Verified partner</Badge></div></CardHeader><CardContent><div className="mb-5 flex flex-wrap gap-2">{partner.states.map((item) => <Badge key={item} variant="secondary"><MapPin className="mr-1 h-3 w-3" />{item}</Badge>)}{partner.specialties.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div><div className="mb-5 rounded-xl border border-[#E8E0D4] bg-[#FBFAF7] p-4 text-sm"><p className="font-semibold text-[#465047]">Licensing details</p><dl className="mt-2 grid gap-x-4 gap-y-1 text-[#6B6966] sm:grid-cols-2"><div><dt className="inline font-medium">Authority: </dt><dd className="inline">{partner.licensingAuthority || "Not provided"}</dd></div><div><dt className="inline font-medium">License no.: </dt><dd className="inline">{partner.licenseNumber || "Not provided"}</dd></div><div><dt className="inline font-medium">Status: </dt><dd className="inline capitalize">{partner.licenseStatus}</dd></div><div><dt className="inline font-medium">Expires: </dt><dd className="inline">{partner.licenseExpiresAt ? new Date(partner.licenseExpiresAt).toLocaleDateString() : "Not provided"}</dd></div></dl>{partner.licenseUrl && <a href={partner.licenseUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#607A68] hover:underline">View public license record <ExternalLink className="h-3 w-3" /></a>}</div><p className="mb-5 text-xs text-[#6B6966]">{partner.verificationNote || "Reviewed against public licensing information. Confirm current status, availability, pricing, and privacy terms on the partner site."}</p><Button onClick={() => openPartner(partner)} className="w-full bg-[#71917A] text-white hover:bg-[#607A68]">View partner site <ExternalLink className="ml-2 h-4 w-4" /></Button></CardContent></Card>)}</div> : <div className="rounded-2xl border border-dashed border-[#C9D7CB] bg-white p-10 text-center"><HeartHandshake className="mx-auto h-10 w-10 text-[#71917A]" /><h3 className="mt-4 font-serif text-2xl font-bold">No published partners match these filters</h3><p className="mx-auto mt-2 max-w-xl text-[#5C5A59]">Partners appear here only after they have been independently reviewed and published by the Patients Compass team. Try clearing a filter or check back later.</p><Button variant="outline" className="mt-5" onClick={() => { setState("all"); setSpecialty("all"); setSortBy("name_asc"); }}>Clear filters</Button></div>}
      </section>

      <section className="border-t border-[#E8E0D4] bg-white"><div className="container py-10 md:py-14"><h2 className="font-serif text-3xl font-bold">Frequently asked questions</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{[
        ["What is Licensed Care Connections?", "It is an informational directory and referral handoff to independent providers. Patients Compass does not provide, schedule, bill for, or supervise their care."],
        ["What happens after I choose a partner?", "A consent dialog explains that you are leaving our site. After you agree, the partner’s website opens in a new tab. Review that provider’s terms, privacy notice, licensing, costs, and service availability before sharing information."],
        ["Does Patients Compass receive my medical information?", "The directory is designed to work without health information. Do not enter symptoms, diagnoses, lab results, insurance details, or other sensitive information into a directory field or URL."],
        ["Can I use this for an emergency?", "No. Do not use this directory for urgent or emergency needs. Call your local emergency number or go to the nearest emergency department. If you may be in immediate danger, seek emergency help now."],
      ].map(([question, answer]) => <Card key={question} className="border-[#E8E0D4] shadow-none"><CardHeader><CardTitle className="text-lg">{question}</CardTitle></CardHeader><CardContent className="pt-0 text-sm leading-6 text-[#5C5A59]">{answer}</CardContent></Card>)}</div></div></section>

      <Dialog open={Boolean(selectedPartner)} onOpenChange={(open) => !open && setSelectedPartner(null)}><DialogContent><DialogHeader><DialogTitle>Before you leave Patients Compass</DialogTitle><DialogDescription>You are about to visit {selectedPartner?.name}, an independent third-party provider. Patients Compass does not control that site or provide clinical services there.</DialogDescription></DialogHeader><div className="rounded-lg border border-[#E8E0D4] bg-[#F7F4EF] p-4 text-sm leading-6 text-[#5C5A59]">Review the partner’s privacy notice, terms, licence information, costs, and emergency instructions. Do not share more information than is necessary. For emergencies, call your local emergency number instead.</div><label className="flex items-start gap-3 text-sm leading-6"><Checkbox checked={consented} onCheckedChange={(checked) => setConsented(checked === true)} /><span>I understand that I am leaving Patients Compass and that this independent provider’s policies and services will apply.</span></label><DialogFooter><Button variant="outline" onClick={() => setSelectedPartner(null)}>Cancel</Button><Button onClick={continueToPartner} disabled={!consented || consent.isPending} className="bg-[#71917A] text-white hover:bg-[#607A68]">{consent.isPending ? "Opening…" : "Continue to partner"}</Button></DialogFooter></DialogContent></Dialog>
    </main>
  );
}
