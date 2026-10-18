/**
 * Blog Listing Page
 * Displays all published blog posts with search, filtering, and pagination
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Calendar, User, Clock } from "lucide-react";

export default function Blog() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Fetch published blog posts
  const { data: postsData, isLoading: postsLoading } = trpc.blog.listPublished.useQuery({
    page,
    limit: 10,
    category,
    search: search || undefined,
  });

  // Fetch categories for filtering
  const { data: categories } = trpc.blog.getCategories.useQuery();

  // Fetch popular posts for sidebar
  const { data: popularPosts } = trpc.blog.getPopular.useQuery({ limit: 5 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCategoryChange = (newCategory: string | undefined) => {
    setCategory(newCategory);
    setPage(1);
  };

  const posts = postsData?.posts || [];
  const pagination = postsData?.pagination;

  return (
    <>
      <SEO
        title="Health Blog"
        description="Read our latest healthcare articles covering lab result interpretation, biomarker optimization, and functional medicine insights."
        path="/blog"
        keywords={["healthcare blog", "lab results", "biomarkers", "functional medicine", "health education"]}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-border py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-bold text-foreground mb-4">Health & Wellness Blog</h1><p className="text-lg text-muted-foreground max-w-2xl">Discover evidence-based insights about lab results, biomarkers, and optimizing your health through functional medicine.</p></div><Link href="/collections"><Button variant="outline" className="border-[#7E9A85] text-[#51715B] hover:bg-[#7E9A85]/10">Explore curated collections</Button></Link></div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mb-8">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search articles..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10 pr-4 py-2"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Button type="submit" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8">
                    Search
                  </Button>
                </div>
              </form>

              {/* Category Filter */}
              <div className="mb-8 flex flex-wrap gap-2">
                <Button
                  variant={category === undefined ? "default" : "outline"}
                  onClick={() => handleCategoryChange(undefined)}
                  size="sm"
                >
                  All Articles
                </Button>
                {categories?.map((cat) => (
                  <Button
                    key={cat}
                    variant={category === cat ? "default" : "outline"}
                    onClick={() => handleCategoryChange(cat)}
                    size="sm"
                  >
                    {cat.                    split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </Button>
                ))}
              </div>

              {/* Blog Posts */}
              {postsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No articles found. Try adjusting your search or filters.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <Card
                      key={post.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/blog/${post.slug}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-2xl mb-2">{post.title}</CardTitle>
                            <CardDescription className="text-base">{post.description}</CardDescription>
                          </div>
                          {post.featuredImage && (
                            <img
                              src={post.featuredImage}
                              alt={post.title}
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{post.author}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{post.readingTimeMinutes} min read</span>
                          </div>
                          <Badge variant="secondary">{post.viewCount} views</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        onClick={() => setPage(p)}
                        size="sm"
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                    disabled={page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}

              {/* Educational Disclaimer */}
              <div className="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>EDUCATIONAL CONTENT ONLY:</strong> This blog provides general health information for educational purposes. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider before making health decisions.
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Popular Posts */}
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Popular Articles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {popularPosts?.map((post) => (
                      <div
                        key={post.id}
                        className="pb-4 border-b last:border-b-0 cursor-pointer hover:opacity-75 transition-opacity"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                      >
                        <p className="font-semibold text-sm text-foreground line-clamp-2">{post.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{post.viewCount} views</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
