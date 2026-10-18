import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Bookmark, BookmarkCheck, Calendar, Check, Clock, Copy, Facebook, Linkedin, Mail, Share2, Twitter, User } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildArticleShareLinks } from "@/lib/articleSharing";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export type ArticleTemplatePost = {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  featuredImage: string | null;
  author: string;
  category: string;
  tags: string | null;
  keywords: string | null;
  readingTimeMinutes: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RelatedArticle = Pick<ArticleTemplatePost, "id" | "slug" | "title" | "publishedAt" | "createdAt">;

function formattedDate(date: Date) {
  return new Date(date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function ArticleShareButtons({ article }: { article: ArticleTemplatePost }) {
  const [copied, setCopied] = useState(false);
  const shareLinks = buildArticleShareLinks(article);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLinks.canonicalUrl);
      setCopied(true);
      toast.success("Article link copied.");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy the link. Please copy it from your browser.");
    }
  };

  const openShareWindow = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  return (
    <section className="border-y border-[#E9E2D7] py-6" aria-labelledby="share-article-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="share-article-heading" className="font-semibold text-[#2C2A29]">Share this article</h2>
          <p className="mt-1 text-sm text-[#736E68]">Help someone find a clearer starting point for their health questions.</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Article sharing options">
          <Button variant="outline" size="sm" onClick={copyLink} className="border-[#DCD3C7]">
            {copied ? <Check aria-hidden="true" className="mr-1.5 h-4 w-4 text-[#51715B]" /> : <Copy aria-hidden="true" className="mr-1.5 h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button variant="outline" size="icon" aria-label="Share on X" onClick={() => openShareWindow(shareLinks.x)}><Twitter aria-hidden="true" className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" aria-label="Share on LinkedIn" onClick={() => openShareWindow(shareLinks.linkedin)}><Linkedin aria-hidden="true" className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" aria-label="Share on Facebook" onClick={() => openShareWindow(shareLinks.facebook)}><Facebook aria-hidden="true" className="h-4 w-4" /></Button>
          <Button asChild variant="outline" size="icon" aria-label="Share by email"><a href={shareLinks.email}><Mail aria-hidden="true" className="h-4 w-4" /></a></Button>
        </div>
      </div>
    </section>
  );
}

function AuthorBio({ author }: { author: string }) {
  return (
    <section className="mt-10 rounded-2xl border border-[#E9E2D7] bg-[#FDFBF8] p-6" aria-labelledby="author-bio-heading">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7E9A85]/15 text-[#51715B]"><User aria-hidden="true" className="h-5 w-5" /></span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7E9A85]">About the author</p>
          <h2 id="author-bio-heading" className="mt-1 font-serif text-xl font-semibold text-[#2C2A29]">{author}</h2>
          <p className="mt-2 text-sm leading-6 text-[#615D59]">Contributor to The Patient&apos;s Compass educational library. Articles are designed to support informed conversations with qualified healthcare professionals.</p>
        </div>
      </div>
    </section>
  );
}

export function ArticleTemplate({ article, relatedArticles }: { article: ArticleTemplatePost; relatedArticles: RelatedArticle[] }) {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: favoriteState } = trpc.favorites.contains.useQuery({ resourceType: "blog_post", resourceId: article.id }, { enabled: isAuthenticated });
  const isSaved = favoriteState?.saved ?? false;
  const saveFavorite = trpc.favorites.save.useMutation({ onSuccess: () => { utils.favorites.list.invalidate(); toast.success("Article saved to your private library."); }, onError: () => toast.error("Could not save this article.") });
  const removeFavorite = trpc.favorites.remove.useMutation({ onSuccess: () => { utils.favorites.list.invalidate(); toast.success("Article removed from saved content."); }, onError: () => toast.error("Could not update saved content.") });
  const publishedDate = article.publishedAt ?? article.createdAt;

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29]">
      <header className="border-b border-[#E9E2D7] bg-[#FDFBF8] py-8 sm:py-12">
        <div className="container max-w-5xl">
          <Button variant="ghost" onClick={() => navigate("/blog")} className="-ml-3 text-[#51715B] hover:bg-[#7E9A85]/10 hover:text-[#2C2A29]"><ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />Back to Blog</Button>
          <Badge className="mt-5 bg-[#7E9A85]/15 text-[#51715B] hover:bg-[#7E9A85]/15">{article.category}</Badge>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{article.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#615D59]">{article.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#736E68]">
            <span className="inline-flex items-center gap-1.5"><User aria-hidden="true" className="h-4 w-4" />{article.author}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar aria-hidden="true" className="h-4 w-4" />{formattedDate(publishedDate)}</span>
            <span className="inline-flex items-center gap-1.5"><Clock aria-hidden="true" className="h-4 w-4" />{article.readingTimeMinutes} min read</span>
          </div>
          <Button
            variant={isSaved ? "secondary" : "outline"}
            size="sm"
            className="mt-5 border-[#DCD3C7] text-[#51715B] hover:bg-[#7E9A85]/10"
            onClick={() => {
              if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
              const input = { resourceType: "blog_post" as const, resourceId: article.id };
              if (isSaved) removeFavorite.mutate(input); else saveFavorite.mutate(input);
            }}
            disabled={saveFavorite.isPending || removeFavorite.isPending}
          >
            {isSaved ? <BookmarkCheck className="mr-1.5 h-4 w-4" /> : <Bookmark className="mr-1.5 h-4 w-4" />}
            {isSaved ? "Saved to your library" : "Save article"}
          </Button>
        </div>
      </header>

      <main className="container max-w-5xl py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <article className="min-w-0">
            {article.featuredImage && <img src={article.featuredImage} alt="" className="mb-9 aspect-[16/8] w-full rounded-2xl object-cover shadow-lg shadow-[#2C2A29]/5" loading="lazy" />}
            <div className="prose prose-stone max-w-none prose-headings:font-serif prose-a:text-[#51715B] prose-a:decoration-[#7E9A85]/50 hover:prose-a:text-[#2C2A29]"><Streamdown>{article.content}</Streamdown></div>
            <div className="mt-9"><ArticleShareButtons article={article} /></div>
            <AuthorBio author={article.author} />
            <aside className="mt-10 rounded-xl border border-[#B9D3E9] bg-[#EFF8FF] p-5 text-sm leading-6 text-[#174B70]"><strong>EDUCATIONAL CONTENT ONLY:</strong> This article provides general health information for educational purposes. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making health decisions.</aside>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {relatedArticles.length > 0 && <Card className="border-[#E9E2D7] bg-white"><CardHeader><CardTitle className="font-serif text-lg">Related articles</CardTitle></CardHeader><CardContent className="space-y-4">{relatedArticles.map((post) => <button key={post.id} type="button" onClick={() => navigate(`/blog/${post.slug}`)} className="block w-full border-b border-[#EEE8DE] pb-4 text-left last:border-0 last:pb-0"><span className="block text-sm font-semibold leading-5 text-[#2C2A29] hover:text-[#51715B]">{post.title}</span><span className="mt-1 block text-xs text-[#736E68]">{formattedDate(post.publishedAt ?? post.createdAt)}</span></button>)}</CardContent></Card>}
            <Card className="border-[#E9E2D7] bg-[#FDFBF8]"><CardHeader><CardTitle className="font-serif text-lg">Article details</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div><p className="text-[#736E68]">Category</p><p className="mt-1 font-semibold">{article.category}</p></div>{article.tags && <div><p className="text-[#736E68]">Topics</p><div className="mt-2 flex flex-wrap gap-1.5">{article.tags.split(",").filter(Boolean).map((tag) => <Badge key={tag.trim()} variant="outline" className="border-[#DCD3C7] text-[#615D59]">{tag.trim()}</Badge>)}</div></div>}</CardContent></Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
