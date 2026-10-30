import SEO from "@/components/SEO";
import CoverImage from "@/components/CoverImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Clock3, LibraryBig, Loader2 } from "lucide-react";
import { Link, useParams } from "wouter";

export default function CollectionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = trpc.collections.detail.useQuery({ slug: slug || "" }, { enabled: Boolean(slug) });
  if (isLoading) return <main className="flex min-h-screen items-center justify-center bg-[#F9F6F0]"><Loader2 className="h-8 w-8 animate-spin text-[#7E9A85]" /></main>;
  if (!data) return <main className="flex min-h-screen items-center justify-center bg-[#F9F6F0] p-6 text-center"><div><LibraryBig className="mx-auto h-10 w-10 text-[#B7B0A6]" /><h1 className="mt-4 font-serif text-2xl font-semibold">Collection unavailable</h1><Link href="/collections"><Button className="mt-6 bg-[#7E9A85] hover:bg-[#6A8571]">Browse collections</Button></Link></div></main>;
  return <main className="min-h-screen bg-[#F9F6F0] px-4 py-10 text-[#2C2A29] sm:py-14"><SEO title={data.collection.title} description={data.collection.description} path={`/collections/${data.collection.slug}`} /><div className="mx-auto max-w-5xl"><Link href="/collections"><Button variant="ghost" className="-ml-3 text-[#51715B] hover:bg-[#7E9A85]/10"><ArrowLeft className="mr-2 h-4 w-4" />All collections</Button></Link><div className="mt-7 grid gap-7 md:grid-cols-[1fr_0.8fr] md:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7E9A85]">Curated reading path</p><h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">{data.collection.title}</h1><p className="mt-4 text-base leading-7 text-[#615D59]">{data.collection.description}</p></div><CoverImage src={data.collection.coverImage} alt={`${data.collection.title} collection cover`} className="h-48 w-full rounded-2xl object-cover shadow-sm md:h-56" /></div><div className="mt-10 grid gap-4 md:grid-cols-2">{data.articles.map((article) => <Card key={article.id} className="border-[#E9E2D7] bg-white"><CardContent className="p-5">{article.featuredImage && <img src={article.featuredImage} alt="" className="mb-4 h-32 w-full rounded-xl object-cover" loading="lazy" />}<p className="text-xs font-semibold uppercase tracking-wide text-[#7E9A85]">{article.category}</p><Link href={`/blog/${article.slug}`}><h2 className="mt-2 font-serif text-xl font-semibold transition-colors hover:text-[#51715B]">{article.title}</h2></Link><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#615D59]">{article.description}</p><span className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#817B74]"><Clock3 className="h-3.5 w-3.5" />{article.readingTimeMinutes} min read</span></CardContent></Card>)}</div></div></main>;
}
