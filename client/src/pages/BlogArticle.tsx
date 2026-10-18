import { useLocation, useParams } from "wouter";
import { Loader2 } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArticleTemplate, type ArticleTemplatePost, type RelatedArticle } from "@/components/blog/ArticleTemplate";
import { trpc } from "@/lib/trpc";
import { buildRelatedRecommendations } from "@/lib/articleRecommendations";

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { data: article, isLoading } = trpc.blog.getBySlug.useQuery({ slug: slug || "" }, { enabled: Boolean(slug) });
  const { data: relatedArticles } = trpc.blog.getRelated.useQuery({ slug: slug || "", limit: 3 }, { enabled: Boolean(slug) });
  const { data: categoryArticles } = trpc.blog.listPublished.useQuery(
    { page: 1, limit: 6, category: article?.category },
    { enabled: Boolean(article?.category) }
  );

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#F9F6F0]"><Loader2 className="h-8 w-8 animate-spin text-[#7E9A85]" /></div>;

  if (!article) return <main className="flex min-h-screen flex-col items-center justify-center bg-[#F9F6F0] px-4 text-center"><SEO title="Article Not Found" path="/blog" noIndex /><h1 className="font-serif text-3xl font-semibold">Article not found</h1><p className="mt-3 text-[#615D59]">This article may have moved or is no longer published.</p><Button className="mt-6 bg-[#7E9A85] hover:bg-[#6C8875]" onClick={() => navigate("/blog")}>Browse the blog</Button><p className="mt-8 text-xs text-[#736E68]">EDUCATIONAL CONTENT ONLY — Not medical advice.</p></main>;

  const recommendations = buildRelatedRecommendations(
    (relatedArticles ?? []) as RelatedArticle[],
    (categoryArticles?.posts ?? []) as RelatedArticle[],
    article.slug,
    3
  );

  return <><SEO title={article.title} description={article.description} path={`/blog/${article.slug}`} keywords={article.keywords || undefined} structuredData={{ "@context": "https://schema.org", "@type": "BlogPosting", headline: article.title, description: article.description, image: article.featuredImage, datePublished: article.publishedAt, dateModified: article.updatedAt, author: { "@type": "Person", name: article.author } }} /><ArticleTemplate article={article as ArticleTemplatePost} relatedArticles={recommendations} /></>;
}
