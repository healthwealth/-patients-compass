import CoverImage from "@/components/CoverImage";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { formatReorderAnnouncement, formatReorderSuccessToast } from "@/lib/collectionReorder";
import { filterCoverAssets } from "@/lib/coverLibrary";
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, GripVertical, ImagePlus, Loader2, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import confetti from "canvas-confetti";

type FormState = { slug: string; title: string; description: string; coverImage: string | null; published: boolean; blogPostIds: number[] };
const blankForm: FormState = { slug: "", title: "", description: "", coverImage: null, published: true, blogPostIds: [] };

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminCollections() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState("");
  const [reorderSuccessId, setReorderSuccessId] = useState<number | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadCategory, setUploadCategory] = useState("general");
  const [coverSearch, setCoverSearch] = useState("");
  const [coverCategory, setCoverCategory] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const collections = trpc.collections.adminList.useQuery();
  const articles = trpc.collections.adminListArticles.useQuery();
  const covers = trpc.collections.coverLibrary.useQuery();
  const detail = trpc.collections.adminDetail.useQuery({ id: selectedId! }, { enabled: selectedId !== null });
  const upload = trpc.collections.uploadCoverImage.useMutation();
  const deleteCover = trpc.collections.deleteCoverAsset.useMutation();
  const create = trpc.collections.adminCreate.useMutation();
  const update = trpc.collections.adminUpdate.useMutation();
  const remove = trpc.collections.adminDelete.useMutation();
  const replaceArticles = trpc.collections.adminReplaceArticles.useMutation();
  const isSaving = create.isPending || update.isPending || replaceArticles.isPending;
  const publishedArticles = useMemo(() => (articles.data ?? []).filter((article) => Boolean(article.published)), [articles.data]);
  const articleById = useMemo(() => new Map(publishedArticles.map((article) => [article.id, article])), [publishedArticles]);
  const coverCategories = useMemo(() => Array.from(new Set((covers.data ?? []).map((cover) => cover.category))).sort(), [covers.data]);
  const filteredCovers = useMemo(() => filterCoverAssets(covers.data ?? [], coverSearch, coverCategory), [covers.data, coverSearch, coverCategory]);

  useEffect(() => {
    if (!detail.data) return;
    setForm({
      slug: detail.data.collection.slug,
      title: detail.data.collection.title,
      description: detail.data.collection.description,
      coverImage: detail.data.collection.coverImage,
      published: Boolean(detail.data.collection.published),
      blogPostIds: detail.data.articles.map((article) => article.id),
    });
  }, [detail.data]);

  const reset = () => { setSelectedId(null); setForm(blankForm); setUploadTitle(""); setUploadAlt(""); setUploadCategory("general"); };
  const refresh = () => { utils.collections.adminList.invalidate(); utils.collections.adminDetail.invalidate(); utils.collections.coverLibrary.invalidate(); utils.collections.list.invalidate(); utils.collections.detail.invalidate(); };
  const moveArticle = (id: number, destination: number, source: "keyboard" | "drag" = "keyboard") => setForm((current) => {
    const from = current.blogPostIds.indexOf(id);
    if (from < 0 || from === destination || destination < 0 || destination >= current.blogPostIds.length) return current;
    const next = [...current.blogPostIds];
    next.splice(from, 1);
    next.splice(destination, 0, id);
    const article = articleById.get(id);
    setReorderAnnouncement(formatReorderAnnouncement(article?.title ?? "Article", "moved", destination + 1, next.length));
    if (source === "drag") {
      setReorderSuccessId(id);
      toast.success(formatReorderSuccessToast(article?.title ?? "Article", destination + 1));
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) confetti({ particleCount: 24, spread: 45, startVelocity: 18, gravity: 0.8, scalar: 0.65, origin: { x: 0.78, y: 0.58 }, colors: ["#7E9A85", "#D48C70", "#F2E7D8"] });
      window.setTimeout(() => setReorderSuccessId(null), 700);
    }
    return { ...current, blogPostIds: next };
  });
  const toggleArticle = (id: number, checked: boolean) => setForm((current) => ({ ...current, blogPostIds: checked ? [...current.blogPostIds, id] : current.blogPostIds.filter((item) => item !== id) }));

  const save = async () => {
    if (!form.slug || !form.title || form.description.length < 10) { toast.error("Add a valid slug, title, and description."); return; }
    try {
      const result = selectedId
        ? await update.mutateAsync({ id: selectedId, slug: form.slug, title: form.title, description: form.description, coverImage: form.coverImage, published: form.published })
        : await create.mutateAsync({ slug: form.slug, title: form.title, description: form.description, coverImage: form.coverImage, published: form.published });
      const id = selectedId ?? result.id;
      await replaceArticles.mutateAsync({ collectionId: id, blogPostIds: form.blogPostIds });
      setSelectedId(id); refresh(); toast.success(selectedId ? "Collection updated." : "Collection created.");
    } catch { toast.error("Could not save this collection."); }
  };

  const chooseCover = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { toast.error("Use a JPG, PNG, or WebP image up to 5 MB."); return; }
    try {
      const result = await upload.mutateAsync({
        fileName: file.name,
        contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
        dataBase64: await fileToBase64(file),
        title: uploadTitle || file.name.replace(/\.[^.]+$/, ""),
        altText: uploadAlt || "Editorial collection cover",
        category: uploadCategory.trim() || "general",
      });
      setForm((current) => ({ ...current, coverImage: result.url }));
      setUploadTitle(""); setUploadAlt(""); setUploadCategory("general"); toast.success("Cover uploaded and added to the library.");
    } catch { toast.error("Could not upload the cover image."); }
  };

  const deleteCoverAsset = async (id: number, title: string, usageCount: number) => {
    if (usageCount > 0) { toast.error("This cover is still in use by a collection."); return; }
    if (!window.confirm(`Remove “${title}” from the reusable cover library?`)) return;
    try { await deleteCover.mutateAsync({ id }); refresh(); toast.success("Cover removed from the library."); }
    catch { toast.error("Could not remove this cover."); }
  };

  const deleteCollection = async (id: number) => {
    if (!window.confirm("Delete this collection and its follows?")) return;
    try { await remove.mutateAsync({ id }); if (selectedId === id) reset(); refresh(); toast.success("Collection deleted."); }
    catch { toast.error("Could not delete this collection."); }
  };

  return (
    <main className="min-h-screen bg-[#F9F6F0] px-4 py-10 text-[#2C2A29] sm:py-14">
      <SEO title="Admin Collections" description="Manage curated article collections." path="/admin/collections" noIndex />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/admin/dashboard" className="mb-5 inline-flex items-center text-sm text-[#51715B] hover:underline"><ArrowLeft className="mr-1.5 h-4 w-4" />Admin dashboard</Link>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7E9A85]">Editorial controls</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">Curated collections</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#615D59]">Create focused reading paths from published articles. Reuse a managed cover or upload a new one.</p>
          </div>
          <Button onClick={reset} variant="outline" className="border-[#DCD3C7] text-[#51715B]"><Plus className="mr-1.5 h-4 w-4" />New collection</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="h-fit border-[#E9E2D7] bg-white">
            <CardHeader><CardTitle className="font-serif">Collections</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {collections.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-[#7E9A85]" /> : collections.data?.length ? collections.data.map((collection) => (
                <div key={collection.id} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${selectedId === collection.id ? "border-[#7E9A85] bg-[#F4F8F4]" : "border-[#E9E2D7]"}`}>
                  <button className="min-w-0 flex-1 text-left" onClick={() => setSelectedId(collection.id)}><p className="truncate text-sm font-semibold">{collection.title}</p><p className="mt-1 text-xs text-[#817B74]">{collection.articleCount} articles · {collection.published ? "Published" : "Draft"}</p></button>
                  <div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" className="text-[#51715B]" onClick={() => setSelectedId(collection.id)} aria-label={`Edit ${collection.title}`}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-[#A95E55] hover:bg-[#A95E55]/10" onClick={() => deleteCollection(collection.id)} aria-label={`Delete ${collection.title}`}><Trash2 className="h-4 w-4" /></Button></div>
                </div>
              )) : <p className="text-sm text-[#817B74]">No collections yet. Create the first reading path.</p>}
            </CardContent>
          </Card>

          <Card className="border-[#E9E2D7] bg-white">
            <CardHeader><CardTitle className="font-serif">{selectedId ? "Edit collection" : "Create collection"}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="collection-title">Title</Label><Input id="collection-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Visit Preparation Essentials" /></div><div><Label htmlFor="collection-slug">Slug</Label><Input id="collection-slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} placeholder="visit-preparation" /></div></div>
              <div><Label htmlFor="collection-description">Description</Label><textarea id="collection-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} maxLength={500} className="mt-1.5 w-full rounded-md border border-[#DCD3C7] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7E9A85]/30" placeholder="Help readers understand the purpose of this reading path." /><p className="mt-1 text-right text-xs text-[#817B74]">{form.description.length}/500</p></div>

              <div>
                <div className="flex items-center justify-between"><Label>Cover image</Label>{form.coverImage && <Button type="button" size="sm" variant="ghost" className="text-[#A95E55]" onClick={() => setForm({ ...form, coverImage: null })}><X className="mr-1 h-3.5 w-3.5" />Remove</Button>}</div>
                <div className="mt-1.5 overflow-hidden rounded-xl border border-dashed border-[#DCD3C7] bg-[#F9F6F0]"><CoverImage src={form.coverImage} alt="Collection cover preview" className="h-44 w-full object-cover" fallback={<button type="button" className="flex h-32 w-full flex-col items-center justify-center text-sm text-[#817B74] hover:bg-[#F4F8F4]" onClick={() => fileRef.current?.click()}><ImagePlus className="mb-2 h-7 w-7 text-[#7E9A85]" />{form.coverImage ? "Cover image is missing. Upload a new cover" : "Upload a new cover"}</button>} /><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => chooseCover(event.target.files?.[0])} /></div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3"><Input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} placeholder="New cover title (optional)" aria-label="New cover title" /><Input value={uploadAlt} onChange={(event) => setUploadAlt(event.target.value)} placeholder="Accessible alt text (optional)" aria-label="New cover alt text" /><Input value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)} placeholder="Category" aria-label="New cover category" /></div>
                <div className="mt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#817B74]">Reusable cover library</p><div className="mb-3 grid gap-2 sm:grid-cols-[1fr_11rem]"><label className="flex items-center gap-2 rounded-lg border border-[#DCD3C7] bg-white px-3"><Search className="h-4 w-4 text-[#9E9A90]" /><input value={coverSearch} onChange={(event) => setCoverSearch(event.target.value)} className="h-9 min-w-0 flex-1 bg-transparent text-xs outline-none" placeholder="Search covers" aria-label="Search cover library" /></label><select value={coverCategory} onChange={(event) => setCoverCategory(event.target.value)} className="h-9 rounded-lg border border-[#DCD3C7] bg-white px-2 text-xs text-[#615D59]" aria-label="Filter cover library by category"><option value="all">All categories</option>{coverCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>{covers.isLoading ? <Loader2 className="h-4 w-4 animate-spin text-[#7E9A85]" /> : filteredCovers.length ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{filteredCovers.map((cover) => <div key={cover.id} className={`group overflow-hidden rounded-lg border ${form.coverImage === cover.imageUrl ? "border-[#7E9A85] ring-2 ring-[#7E9A85]/30" : "border-[#E9E2D7]"}`}><button type="button" className="block w-full text-left" onClick={() => setForm({ ...form, coverImage: cover.imageUrl })}><img src={cover.imageUrl} alt={cover.altText} className="h-20 w-full object-cover transition-transform group-hover:scale-[1.03]" /><span className="block truncate px-2 pt-1.5 text-[11px] text-[#615D59]">{cover.title}</span><span className="block truncate px-2 text-[10px] text-[#9E9A90]">{cover.category}</span></button><div className="flex items-center justify-between gap-1 px-2 pb-1.5"><span className="text-[10px] text-[#817B74]">{cover.usageCount} use{cover.usageCount === 1 ? "" : "s"}</span><Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-[#A95E55]" disabled={cover.usageCount > 0 || deleteCover.isPending} onClick={() => deleteCoverAsset(cover.id, cover.title, cover.usageCount)} aria-label={cover.usageCount > 0 ? `${cover.title} is in use` : `Delete ${cover.title}`} title={cover.usageCount > 0 ? "In use" : "Delete cover"}><Trash2 className="h-3 w-3" /></Button></div></div>)}</div> : <p className="rounded-lg border border-dashed border-[#DCD3C7] p-3 text-xs text-[#817B74]">No cover images match this search and category.</p>}</div>
                {upload.isPending && <p className="mt-2 text-xs text-[#51715B]">Uploading cover…</p>}
              </div>

              <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.published} onCheckedChange={(checked) => setForm({ ...form, published: Boolean(checked) })} />Publish this collection</label>
              <div>
                <div className="mb-3 flex items-center justify-between"><div><Label>Articles in this collection</Label><p className="mt-1 text-xs leading-5 text-[#817B74]">Drag selected articles to reorder. Use arrow buttons as an accessible fallback.</p><p className="sr-only" aria-live="polite" aria-atomic="true">{reorderAnnouncement}</p></div><span className="text-xs text-[#817B74]">{form.blogPostIds.length} selected</span></div>
                <div className="space-y-2 rounded-xl border border-[#E9E2D7] p-3">
                                    {form.blogPostIds.map((id, index) => { const article = articleById.get(id); if (!article) return null; return <div key={id} draggable onDragStart={() => { setDraggedId(id); setReorderAnnouncement(formatReorderAnnouncement(article.title, "grabbed", index + 1, form.blogPostIds.length)); }} onDragEnd={() => { setDraggedId(null); setReorderAnnouncement(formatReorderAnnouncement(article.title, "dropped", form.blogPostIds.indexOf(id) + 1, form.blogPostIds.length)); }} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId !== null) moveArticle(draggedId, index, "drag"); setDraggedId(null); }} className={`flex items-center gap-2 rounded-lg border bg-[#F4F8F4] p-2 transition-all duration-200 ${draggedId === id ? "opacity-50" : ""} ${reorderSuccessId === id ? "scale-[1.02] border-[#7E9A85] shadow-md shadow-[#7E9A85]/20" : ""}`}>
<GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[#9E9A90]" aria-hidden="true" />{reorderSuccessId === id && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#51715B] motion-safe:animate-bounce" aria-hidden="true" />}<span className="min-w-0 flex-1"><span className="block text-sm font-medium">{index + 1}. {article.title}</span><span className="block text-xs text-[#817B74]">{article.category}</span></span><Button type="button" size="icon" variant="ghost" disabled={index === 0} onClick={() => moveArticle(id, index - 1)} aria-label={`Move ${article.title} up`}><ArrowUp className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" disabled={index === form.blogPostIds.length - 1} onClick={() => moveArticle(id, index + 1)} aria-label={`Move ${article.title} down`}><ArrowDown className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" onClick={() => toggleArticle(id, false)} aria-label={`Remove ${article.title}`}><X className="h-4 w-4 text-[#A95E55]" /></Button></div>; })}
                  {publishedArticles.filter((article) => !form.blogPostIds.includes(article.id)).map((article) => <label key={article.id} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-[#F4F8F4]"><Checkbox checked={false} onCheckedChange={(checked) => toggleArticle(article.id, Boolean(checked))} /><span><span className="block text-sm font-medium">{article.title}</span><span className="block text-xs text-[#817B74]">{article.category}</span></span></label>)}
                  {!publishedArticles.length && <p className="p-3 text-sm text-[#817B74]">Publish an article before adding it to a collection.</p>}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={reset} className="border-[#DCD3C7] text-[#51715B]">Cancel</Button><Button type="button" onClick={save} disabled={isSaving || upload.isPending} className="bg-[#7E9A85] hover:bg-[#6A8571]"><Save className="mr-1.5 h-4 w-4" />{isSaving ? "Saving…" : "Save collection"}</Button></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
