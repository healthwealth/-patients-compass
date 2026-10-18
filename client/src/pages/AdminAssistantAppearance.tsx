import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowLeft, Check, Crosshair, Eye, GitCompareArrows, ImagePlus, Loader2, Palette, Search, SlidersHorizontal, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function imageToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(file);
  });
}

export default function AdminAssistantAppearance() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [draftCropX, setDraftCropX] = useState(50);
  const [draftCropY, setDraftCropY] = useState(22);
  const appearance = trpc.assistantAppearance.get.useQuery();
  const options = trpc.assistantAppearance.options.useQuery(undefined, { enabled: user?.role === "admin" });
  useEffect(() => {
    if (!appearance.data) return;
    setDraftCropX(appearance.data.cropPositionX);
    setDraftCropY(appearance.data.cropPositionY);
  }, [appearance.data?.cropPositionX, appearance.data?.cropPositionY]);
  const setPortrait = trpc.assistantAppearance.setPortrait.useMutation({
    onSuccess: async (portrait) => {
      await Promise.all([appearance.refetch(), options.refetch()]);
      setDraftCropX(portrait.cropPositionX);
      setDraftCropY(portrait.cropPositionY);
      toast.success(`${portrait.label} portrait is now active across Health Companion.`);
    },
    onError: (error) => toast.error(error.message || "Could not update the portrait."),
  });
  const setCropPosition = trpc.assistantAppearance.setCropPosition.useMutation({
    onSuccess: async (portrait) => {
      await appearance.refetch();
      setDraftCropX(portrait.cropPositionX);
      setDraftCropY(portrait.cropPositionY);
      toast.success("Crop position saved across Health Companion.");
    },
    onError: (error) => toast.error(error.message || "Could not save the crop position."),
  });
  const uploadPortrait = trpc.assistantAppearance.uploadCustomPortrait.useMutation({
    onSuccess: async (portrait) => {
      await utils.assistantAppearance.options.invalidate();
      setUploadFile(null);
      setUploadPreview(null);
      setLabel("");
      setDescription("");
      setAltText("");
      toast.success(`${portrait.label} was added to the portrait library.`);
    },
    onError: (error) => toast.error(error.message || "Could not upload this portrait."),
  });

  if (!user || user.role !== "admin") {
    return <div className="flex min-h-screen items-center justify-center bg-[#F7F4EE] px-4"><p className="text-sm text-[#6F756F]">Access denied. Administrator settings only.</p></div>;
  }

  const selectedKey = appearance.data?.key;
  const filteredOptions = (options.data ?? []).filter((option) => `${option.label} ${option.description}`.toLowerCase().includes(search.trim().toLowerCase()));

  const updateCropFromPreview = (event: MouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, Math.round(((event.clientX - bounds.left) / bounds.width) * 100)));
    const y = Math.max(0, Math.min(100, Math.round(((event.clientY - bounds.top) / bounds.height) * 100)));
    setDraftCropX(x);
    setDraftCropY(y);
  };

  const chooseImage = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Choose a JPEG, PNG, or WebP portrait.");
    if (!file.size || file.size > MAX_IMAGE_BYTES) return toast.error("Custom portraits must be 3 MB or smaller.");
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    if (!label) setLabel(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 120));
  };

  const submitUpload = async () => {
    if (!uploadFile || !label.trim() || description.trim().length < 10 || altText.trim().length < 8) {
      toast.error("Choose an image and complete the label, description, and alternative text.");
      return;
    }
    try {
      uploadPortrait.mutate({
        label: label.trim(), description: description.trim(), altText: altText.trim(), fileName: uploadFile.name,
        contentType: uploadFile.type as "image/jpeg" | "image/png" | "image/webp",
        dataBase64: await imageToBase64(uploadFile),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read this image.");
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F4EE] px-4 py-8 text-[#2F332F] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-6 gap-2 text-[#687D6D]"><ArrowLeft className="h-4 w-4" /> Back to admin dashboard</Button>
        <div className="mb-8 flex items-start gap-4">
          <div className="rounded-2xl bg-[#7E9A85]/15 p-3 text-[#6F8D78]"><Palette className="h-6 w-6" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8E9F90]">Administrator settings</p><h1 className="mt-1 font-serif text-3xl font-semibold sm:text-4xl">Health Companion appearance</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#6F756F]">Choose a diverse professional portrait or upload a custom managed image. The selected educator portrait updates every Health Companion surface.</p></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="border-[#E6E0D5] bg-white/80 shadow-sm lg:row-span-2">
            <CardHeader><CardTitle>Professional portrait library</CardTitle><CardDescription>{appearance.isLoading ? "Loading the active portrait…" : `${options.data?.length ?? 0} managed options available.`}</CardDescription><div className="relative pt-2"><Search className="absolute left-3 top-5 h-4 w-4 text-[#8B958C]" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search portraits" className="pl-9" /></div></CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredOptions.map((option) => {
                  const isSelected = selectedKey === option.key;
                  return <button key={option.key} type="button" aria-pressed={isSelected} disabled={setPortrait.isPending} onClick={() => setPortrait.mutate({ portraitKey: option.key })} className={`group overflow-hidden rounded-2xl border text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85] ${isSelected ? "border-[#7E9A85] bg-[#F1F6F1] shadow-md" : "border-[#E6E0D5] bg-white hover:-translate-y-0.5 hover:border-[#B7C9BA] hover:shadow-sm"}`}>
                    <div className="relative aspect-square overflow-hidden bg-[#EAEFEA]"><img src={option.url} alt={option.altText} className="h-full w-full object-cover object-[50%_22%] sm:object-[50%_24%] transition-transform duration-300 group-hover:scale-[1.02]" />{isSelected && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#6F8D78] px-3 py-1 text-xs font-semibold text-white"><Check className="h-3.5 w-3.5" /> Active</span>}{option.isCustom && <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#58705E]">Custom</span>}</div>
                    <div className="p-4"><p className="font-semibold text-[#2F332F]">{option.label}</p><p className="mt-1 text-sm leading-5 text-[#6F756F]">{option.description}</p></div>
                  </button>;
                })}
              </div>
              {!filteredOptions.length && !options.isLoading && <p className="rounded-xl bg-[#F8F5EF] px-4 py-8 text-center text-sm text-[#77786F]">No portraits match that search.</p>}
            </CardContent>
          </Card>

          <Card className="h-fit border-[#E6E0D5] bg-white/90 shadow-sm lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-[#6F8D78]" /> Active portrait preview</CardTitle>
              <CardDescription>Adjust the face position, preview both formats, then save it across Health Companion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {appearance.data ? (
                <>
                  <div className="rounded-xl border border-[#DDE7DE] bg-[#F7FAF6] px-3 py-2 text-xs text-[#58705E]">
                    <p className="flex items-center gap-2 font-semibold"><Crosshair className="h-4 w-4" /> Click the new-crop image to place the focal point</p>
                    <p className="mt-1 text-[#6F756F]">The click sets both sliders to the point you choose.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#E6E0D5] bg-white p-2">
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#7A897D]"><GitCompareArrows className="h-3.5 w-3.5" /> Saved layout</div>
                      <div className="aspect-square overflow-hidden rounded-xl border border-[#DDE7DE] bg-[#EAEFEA]">
                        <img src={appearance.data.url} alt={`${appearance.data.altText}, saved crop`} style={{ objectPosition: `${appearance.data.cropPositionX}% ${appearance.data.cropPositionY}%` }} className="h-full w-full object-cover" />
                      </div>
                      <p className="mt-2 text-center text-[11px] tabular-nums text-[#7A897D]">X {appearance.data.cropPositionX}% · Y {appearance.data.cropPositionY}%</p>
                    </div>
                    <div className="rounded-xl border border-[#BFCFBE] bg-[#F4F8F3] p-2">
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#58705E]"><Crosshair className="h-3.5 w-3.5" /> New crop</div>
                      <button type="button" onClick={updateCropFromPreview} aria-label="Set portrait focal point on new crop preview" className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-[#B7C9BA] bg-[#EAEFEA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F8D78]">
                        <img src={appearance.data.url} alt={`${appearance.data.altText}, new crop preview`} style={{ objectPosition: `${draftCropX}% ${draftCropY}%` }} className="h-full w-full object-cover transition-[object-position] duration-200" />
                        <span aria-hidden="true" className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#6F8D78]/80 shadow-[0_0_0_2px_rgba(47,51,47,.25)]" style={{ left: `${draftCropX}%`, top: `${draftCropY}%` }} />
                      </button>
                      <p className="mt-2 text-center text-[11px] tabular-nums text-[#58705E]">X {draftCropX}% · Y {draftCropY}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="aspect-square overflow-hidden rounded-2xl border border-[#DDE7DE] bg-[#EAEFEA]"><img src={appearance.data.url} alt="" aria-hidden="true" style={{ objectPosition: `${draftCropX}% ${draftCropY}%` }} className="h-full w-full object-cover" /></div>
                      <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[#7A897D]">New mobile crop</p>
                    </div>
                    <div>
                      <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-[#DDE7DE] bg-[#EAEFEA]"><img src={appearance.data.url} alt="" aria-hidden="true" style={{ objectPosition: `${draftCropX}% ${draftCropY}%` }} className="h-full w-full object-cover" /></div>
                      <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[#7A897D]">New tablet crop</p>
                    </div>
                  </div>
                  <div className="space-y-4 rounded-xl border border-[#DDE7DE] bg-white/70 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm font-semibold text-[#58705E]"><SlidersHorizontal className="h-4 w-4" /> Fine-tune crop</p>
                      <span className="text-xs tabular-nums text-[#7A897D]">X {draftCropX}% · Y {draftCropY}%</span>
                    </div>
                    <label className="block text-xs font-medium text-[#6F756F]" htmlFor="portrait-crop-x">Horizontal position</label>
                    <input id="portrait-crop-x" aria-label="Horizontal portrait crop position" type="range" min="0" max="100" value={draftCropX} onChange={(event) => setDraftCropX(Number(event.target.value))} className="w-full accent-[#6F8D78]" />
                    <label className="block text-xs font-medium text-[#6F756F]" htmlFor="portrait-crop-y">Vertical position</label>
                    <input id="portrait-crop-y" aria-label="Vertical portrait crop position" type="range" min="0" max="100" value={draftCropY} onChange={(event) => setDraftCropY(Number(event.target.value))} className="w-full accent-[#6F8D78]" />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button type="button" className="flex-1 bg-[#6F8D78] text-white hover:bg-[#5F7B68]" disabled={setCropPosition.isPending || !selectedKey || (draftCropX === (appearance.data?.cropPositionX ?? 50) && draftCropY === (appearance.data?.cropPositionY ?? 22))} onClick={() => selectedKey && setCropPosition.mutate({ portraitKey: selectedKey, cropPositionX: draftCropX, cropPositionY: draftCropY })}>
                        {setCropPosition.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving crop</> : "Save crop position"}
                      </Button>
                      <Button type="button" variant="outline" className="border-[#BFCFBE] text-[#58705E] hover:bg-[#F1F6F1]" onClick={() => { setDraftCropX(50); setDraftCropY(22); }}>Reset</Button>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#F4F8F3] px-3 py-2 text-sm text-[#58705E]">
                    <p className="font-semibold">{appearance.data.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[#6F756F]">This is the portrait currently used across Health Companion surfaces.</p>
                  </div>
                  <Button type="button" variant="outline" className="w-full border-[#BFCFBE] text-[#58705E] hover:bg-[#F1F6F1]" onClick={() => navigate("/medical-assistant")}>
                    Open full Health Companion preview
                  </Button>
                </>
              ) : (
                <div className="aspect-[3/4] animate-pulse rounded-2xl bg-[#EAEFEA]" aria-label="Loading active portrait preview" />
              )}
            </CardContent>
          </Card>

          <Card className="h-fit border-[#E6E0D5] bg-white/90 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-[#6F8D78]" /> Upload custom portrait</CardTitle><CardDescription>JPEG, PNG, or WebP · maximum 3 MB · square images work best.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <input ref={uploadInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseImage(event.target.files?.[0])} />
              <button type="button" onClick={() => uploadInputRef.current?.click()} className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#BFC9C0] bg-[#F6F8F4] text-[#6F8D78] hover:bg-[#EFF4EF]">{uploadPreview ? <img src={uploadPreview} alt="Custom portrait preview" className="h-full w-full object-cover object-[50%_22%] sm:object-[50%_24%]" /> : <span className="flex flex-col items-center gap-2 text-sm font-semibold"><Upload className="h-6 w-6" /> Choose portrait image</span>}</button>
              <div className="space-y-2"><Label htmlFor="portrait-label">Display label</Label><Input id="portrait-label" value={label} onChange={(event) => setLabel(event.target.value)} maxLength={120} placeholder="e.g. Community educator" /></div>
              <div className="space-y-2"><Label htmlFor="portrait-description">Short description</Label><Input id="portrait-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={255} placeholder="Professional non-clinical editorial portrait" /></div>
              <div className="space-y-2"><Label htmlFor="portrait-alt">Alternative text</Label><Input id="portrait-alt" value={altText} onChange={(event) => setAltText(event.target.value)} maxLength={255} placeholder="Health Companion AI educator…" /></div>
              <Button type="button" onClick={() => void submitUpload()} disabled={!uploadFile || uploadPortrait.isPending} className="w-full bg-[#6F8D78] text-white hover:bg-[#5F7B68]">{uploadPortrait.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading securely</> : "Add to portrait library"}</Button>
              <p className="rounded-xl bg-[#F8F5EF] px-3 py-2 text-[11px] leading-5 text-[#77786F]">Use an image you own or have permission to use. Avoid white coats, clinical badges, or visuals that imply a licensed physician.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
