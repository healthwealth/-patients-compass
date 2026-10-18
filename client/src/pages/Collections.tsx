import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Bookmark, Check, LibraryBig, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

function FollowButton({ collectionId }: { collectionId: number }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: state } = trpc.collections.isFollowing.useQuery({ collectionId }, { enabled: isAuthenticated });
  const follow = trpc.collections.follow.useMutation({ onSuccess: () => { utils.collections.isFollowing.invalidate({ collectionId }); utils.collections.followed.invalidate(); toast.success("Collection followed."); } });
  const unfollow = trpc.collections.unfollow.useMutation({ onSuccess: () => { utils.collections.isFollowing.invalidate({ collectionId }); utils.collections.followed.invalidate(); toast.success("Collection unfollowed."); } });
  const following = state?.following ?? false;
  return <Button size="sm" variant={following ? "secondary" : "outline"} className="border-[#DCD3C7] text-[#51715B] hover:bg-[#7E9A85]/10" disabled={follow.isPending || unfollow.isPending} onClick={() => { if (!isAuthenticated) { window.location.href = getLoginUrl(); return; } if (following) unfollow.mutate({ collectionId }); else follow.mutate({ collectionId }); }}><Bookmark className="mr-1.5 h-4 w-4" />{following ? "Following" : "Follow"}</Button>;
}

export default function Collections() {
  const { isAuthenticated } = useAuth();
  const { data: collections, isLoading } = trpc.collections.list.useQuery();
  const { data: followed } = trpc.collections.followed.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  return <main className="min-h-screen bg-[#F9F6F0] px-4 py-12 text-[#2C2A29] sm:py-16"><SEO title="Curated Collections" description="Follow curated educational article collections from The Patient's Compass." path="/collections" /><div className="mx-auto max-w-6xl"><div className="mb-10 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7E9A85]">Educational library</p><h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">Curated collections</h1><p className="mt-3 text-sm leading-6 text-[#615D59]">Explore real Patients Compass articles grouped by topic, and follow the collections you want to revisit.</p></div>{followed?.length ? <section className="mb-10 rounded-2xl border border-[#DDE8DF] bg-[#F4F8F4] p-5"><div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#51715B]" /><p className="text-sm font-semibold">You follow {followed.length} collection{followed.length === 1 ? "" : "s"}</p></div><div className="mt-3 flex flex-wrap gap-2">{followed.map((collection) => <Link key={collection.id} href={`/collections/${collection.slug}`}><Button size="sm" variant="outline" className="border-[#C9DDCD] bg-white text-[#51715B]">{collection.title}</Button></Link>)}</div></section> : null}{isLoading ? <div className="flex min-h-48 items-center justify-center rounded-2xl border border-[#E9E2D7] bg-white"><Loader2 className="h-7 w-7 animate-spin text-[#7E9A85]" /></div> : collections?.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{collections.map((collection) => <Card key={collection.id} className="group overflow-hidden border-[#E9E2D7] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#2C2A29]/5">{collection.coverImage ? <img src={collection.coverImage} alt="" className="h-36 w-full object-cover" loading="lazy" /> : <div className="flex h-36 items-center justify-center bg-[#7E9A85]/10"><LibraryBig className="h-9 w-9 text-[#7E9A85]" /></div>}<CardContent className="p-5"><h2 className="font-serif text-xl font-semibold"><Link href={`/collections/${collection.slug}`}><span className="transition-colors group-hover:text-[#51715B]">{collection.title}</span></Link></h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-[#615D59]">{collection.description}</p><div className="mt-5 flex items-center justify-between"><Link href={`/collections/${collection.slug}`}><Button variant="ghost" size="sm" className="-ml-2 text-[#51715B] hover:bg-[#7E9A85]/10">Explore</Button></Link><FollowButton collectionId={collection.id} /></div></CardContent></Card>)}</div> : <Card className="border-dashed border-[#DCD3C7] bg-white/70"><CardContent className="py-16 text-center"><LibraryBig className="mx-auto h-9 w-9 text-[#B7B0A6]" /><h2 className="mt-4 font-serif text-xl font-semibold">Collections are being prepared</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#736E68]">Published collections will appear here as editorial topics are organized.</p></CardContent></Card>}</div></main>;
}
