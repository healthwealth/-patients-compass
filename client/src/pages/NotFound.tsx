import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Compass, Home, Search } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HEADER_SEARCH_DESTINATIONS, filterHeaderSearchDestinations } from "@/lib/headerSearch";
import { trackNotFoundRecoverySelection } from "@/lib/gtm";

const POPULAR_RESOURCES = HEADER_SEARCH_DESTINATIONS.slice(0, 4);

export default function NotFound() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const { results } = filterHeaderSearchDestinations(query, 4);

  const navigate = (href: string) => setLocation(href);
  const navigateFromRecovery = (
    href: string,
    selectionSource: "search_result" | "popular_resource",
    destinationCategory: string,
  ) => {
    trackNotFoundRecoverySelection(selectionSource, destinationCategory);
    setLocation(href);
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (results[0]) navigateFromRecovery(results[0].href, "search_result", results[0].category);
  };

  return (
    <main className="min-h-screen bg-[#F9F6F0] px-4 py-12 text-[#2C2A29] sm:py-20">
      <SEO
        title="Page Not Found"
        description="The requested page is unavailable. Explore The Patient's Compass resources or return to the homepage."
        path="/404"
        noIndex
      />
      <Card className="mx-auto w-full max-w-2xl overflow-hidden border-[#E9E2D7] bg-white shadow-xl shadow-[#2C2A29]/5">
        <CardContent className="p-7 sm:p-10">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7E9A85]/15 text-[#51715B]">
            <Compass aria-hidden="true" className="h-7 w-7" />
          </div>
          <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#7E9A85]">404 · Route unavailable</p>
          <h1 className="mt-3 text-center font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Let’s find a better path.</h1>
          <p className="mx-auto mt-4 max-w-lg text-center leading-7 text-[#615D59]">
            This page may have moved, expired, or requires an account. Search the site or choose a popular resource below.
          </p>

          <form onSubmit={submitSearch} className="relative mx-auto mt-8 max-w-xl">
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7E9A85]" />
            <Input
              aria-label="Search Patient's Compass resources"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search biomarkers, guides, and tools"
              className="h-12 rounded-xl border-[#DDD5C9] bg-[#FDFBF8] pl-11 pr-28 shadow-sm focus-visible:ring-[#7E9A85]"
            />
            <Button type="submit" size="sm" disabled={!results[0]} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#7E9A85] hover:bg-[#6C8875]">
              Search
            </Button>
          </form>

          {query.trim() && (
            <div className="mx-auto mt-3 max-w-xl rounded-xl border border-[#EEE8DE] bg-[#FDFBF8] p-2" role="list" aria-label="Search suggestions">
              {results.length > 0 ? results.map((result) => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.href}
                    type="button"
                    role="listitem"
                    onClick={() => navigateFromRecovery(result.href, "search_result", result.category)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#7E9A85]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85]"
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 text-[#7E9A85]" />
                    <span className="flex-1 text-sm font-semibold">{result.label}</span>
                    <span className="text-xs text-[#736E68]">{result.category}</span>
                  </button>
                );
              }) : (
                <p className="px-3 py-2 text-sm text-[#736E68]">No matches yet. Try “biomarkers,” “books,” or “support.”</p>
              )}
            </div>
          )}

          <section className="mt-9 border-t border-[#EEE8DE] pt-7" aria-labelledby="popular-resources-heading">
            <h2 id="popular-resources-heading" className="text-sm font-semibold uppercase tracking-[0.13em] text-[#736E68]">Popular resources</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {POPULAR_RESOURCES.map((resource) => {
                const Icon = resource.icon;
                return (
                  <button
                    key={resource.href}
                    type="button"
                    onClick={() => navigateFromRecovery(resource.href, "popular_resource", resource.category)}
                    className="group flex items-center gap-3 rounded-xl border border-[#E9E2D7] bg-[#FDFBF8] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#7E9A85]/50 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85]"
                  >
                    <span className="rounded-lg bg-[#7E9A85]/12 p-2 text-[#51715B]"><Icon aria-hidden="true" className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{resource.label}</span><span className="block text-xs text-[#736E68]">{resource.category}</span></span>
                    <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#7E9A85] transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
          </section>

          <div className="mt-8 flex flex-col items-center gap-3 border-t border-[#EEE8DE] pt-7 sm:flex-row sm:justify-between">
            <p className="text-center text-xs text-[#736E68] sm:text-left">EDUCATIONAL CONTENT ONLY — Not medical advice.</p>
            <Button onClick={() => navigate("/")} variant="outline" className="rounded-xl border-[#7E9A85] text-[#51715B] hover:bg-[#7E9A85]/10">
              <Home aria-hidden="true" className="mr-2 h-4 w-4" /> Return home
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
