import { useState, useMemo } from "react";
import SEO from "@/components/SEO";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ArrowRight, BookOpen, ChevronRight, Filter } from "lucide-react";
import { BIOMARKER_PROFILES, getBiomarkerCategories } from "@/data/biomarkers";

const CATEGORY_COLORS: Record<string, string> = {
  "Nutrient Balance": "bg-[#D48C70]/10 text-[#D48C70] border-[#D48C70]/20",
  "Hormonal System": "bg-[#A39EBA]/10 text-[#A39EBA] border-[#A39EBA]/20",
  "Metabolic System": "bg-[#7E9A85]/10 text-[#7E9A85] border-[#7E9A85]/20",
  "Cardiovascular System": "bg-[#C97B7B]/10 text-[#C97B7B] border-[#C97B7B]/20",
  "Liver System": "bg-[#8B9E6E]/10 text-[#8B9E6E] border-[#8B9E6E]/20",
};

export default function BiomarkerDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = getBiomarkerCategories();

  // Deduplicate by slug (remove vitamin-d-25oh duplicate)
  const uniqueBiomarkers = useMemo(() => {
    const seen = new Set<string>();
    return BIOMARKER_PROFILES.filter((b) => {
      if (seen.has(b.slug)) return false;
      seen.add(b.slug);
      return true;
    });
  }, []);

  const filtered = useMemo(() => {
    return uniqueBiomarkers.filter((b) => {
      const matchesSearch =
        !searchQuery ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.overview.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !activeCategory || b.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [uniqueBiomarkers, searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29]">
      <SEO
        title="Biomarker Directory"
        description="Explore 25+ lab biomarkers with clinical normal ranges vs. optimal wellness zones. Understand what your lab results really mean."
        path="/biomarkers"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          "name": "Biomarker Directory — The Patient's Compass",
          "description": "Reference guide for 25+ lab biomarkers with functional medicine optimal ranges",
          "url": "https://www.thepatientscompass.com/biomarkers"
        }}
      />
      {/* Header */}
      <div className="bg-[#2C2A29] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[#7E9A85] text-sm font-semibold hover:text-[#9ABBA2] transition-colors mb-2">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#7E9A85] p-2 rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-[#7E9A85] text-xs font-bold uppercase tracking-widest">
              Functional Medicine Library
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold leading-tight">
            Biomarker Directory
          </h1>
          <p className="text-[#C5C0B5] text-lg max-w-2xl leading-relaxed">
            Comprehensive profiles for each biomarker — standard vs. optimal ranges,
            symptom patterns, nutrition guidance, and doctor conversation starters.
          </p>
          <div className="flex items-center gap-2 text-xs text-[#9E9A90] font-medium pt-2">
            <span className="bg-[#7E9A85]/20 text-[#7E9A85] px-2 py-0.5 rounded-full font-bold">
              {uniqueBiomarkers.length} Biomarkers
            </span>
            <span>•</span>
            <span>{categories.length} Categories</span>
            <span>•</span>
            <span>Based on Clinical Laboratory Science Guidelines</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#EBE6DC] shadow-sm py-4 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9A90]" />
            <Input
              placeholder="Search biomarkers, categories, or symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#F9F6F0] border-[#EBE6DC] focus:border-[#7E9A85] rounded-xl text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-[#9E9A90] shrink-0" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveCategory(null)}
              className={`rounded-full text-xs font-semibold border transition-all ${
                !activeCategory
                  ? "bg-[#2C2A29] text-white border-[#2C2A29]"
                  : "border-[#EBE6DC] text-[#5C5A59] hover:border-[#7E9A85]"
              }`}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant="outline"
                size="sm"
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`rounded-full text-xs font-semibold border transition-all ${
                  activeCategory === cat
                    ? "bg-[#7E9A85] text-white border-[#7E9A85]"
                    : "border-[#EBE6DC] text-[#5C5A59] hover:border-[#7E9A85]"
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Biomarker Grid */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-2xl">🔍</p>
            <p className="font-semibold text-[#2C2A29]">No biomarkers found</p>
            <p className="text-sm text-[#5C5A59]">
              Try adjusting your search or clearing the category filter.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory(null);
              }}
              className="mt-2 border-[#EBE6DC] text-[#5C5A59] rounded-xl"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((biomarker) => (
              <Link key={biomarker.slug} href={`/biomarkers/${biomarker.slug}`}>
                <Card className="group border border-[#EBE6DC] shadow-sm rounded-3xl bg-white hover:shadow-lg hover:border-[#7E9A85]/40 transition-all duration-200 cursor-pointer overflow-hidden h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Icon + Category */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">{biomarker.icon}</div>
                      <Badge
                        className={`text-[10px] font-bold border rounded-full px-2.5 py-0.5 ${
                          CATEGORY_COLORS[biomarker.category] ||
                          "bg-[#7E9A85]/10 text-[#7E9A85] border-[#7E9A85]/20"
                        }`}
                      >
                        {biomarker.category}
                      </Badge>
                    </div>

                    {/* Name */}
                    <h3 className="font-serif font-bold text-xl text-[#2C2A29] mb-2 leading-snug">
                      {biomarker.shortName}
                    </h3>
                    <p className="text-xs text-[#9E9A90] font-medium mb-3">
                      {biomarker.name}
                    </p>

                    {/* Range comparison */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-[#F9F6F0] p-2.5 rounded-xl border border-[#EBE6DC]">
                        <p className="text-[9px] text-[#9E9A90] font-bold uppercase tracking-wider mb-0.5">
                          Standard
                        </p>
                        <p className="text-xs font-bold text-[#5C5A59] line-through">
                          {biomarker.standardRange.label}
                        </p>
                      </div>
                      <div
                        className="p-2.5 rounded-xl border"
                        style={{
                          backgroundColor: `${biomarker.categoryColor}15`,
                          borderColor: `${biomarker.categoryColor}30`,
                        }}
                      >
                        <p
                          className="text-[9px] font-bold uppercase tracking-wider mb-0.5"
                          style={{ color: biomarker.categoryColor }}
                        >
                          Optimal
                        </p>
                        <p
                          className="text-xs font-bold"
                          style={{ color: biomarker.categoryColor }}
                        >
                          {biomarker.optimalRange.label}
                        </p>
                      </div>
                    </div>

                    {/* Overview snippet */}
                    <p className="text-xs text-[#5C5A59] leading-relaxed line-clamp-3 flex-grow">
                      {biomarker.overview.slice(0, 140)}...
                    </p>

                    {/* CTA */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#EBE6DC]">
                      <span className="text-xs font-bold text-[#7E9A85]">
                        {biomarker.symptomsLow.length + biomarker.symptomsHigh.length} symptoms listed
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-[#7E9A85] group-hover:gap-2 transition-all">
                        <span>View Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Educational disclaimer */}
        <div className="mt-16 bg-white border border-[#EBE6DC] rounded-3xl p-6 flex gap-4">
          <div className="text-2xl shrink-0">📋</div>
          <div className="space-y-1">
            <p className="font-bold text-sm text-[#2C2A29]">Educational Information Only</p>
            <p className="text-xs text-[#5C5A59] leading-relaxed">
              All biomarker profiles, optimal ranges, and wellness guidance in this directory are
              educational in nature and based on functional medicine and clinical laboratory science
              frameworks. They are not intended to diagnose, treat, cure, or replace professional
              medical advice. Always discuss your specific lab results with your licensed healthcare
              provider.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
