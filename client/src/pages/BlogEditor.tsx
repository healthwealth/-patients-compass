import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Save, X, ImagePlus, Loader2 } from "lucide-react";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { toast } from "sonner";

const CATEGORIES = ["health", "nutrition", "fitness", "mental-health", "lab-analysis"];

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  featuredImage?: string;
  published: boolean;
}

export function BlogEditor() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [post, setPost] = useState<BlogPost>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author: user?.name || "",
    category: "health",
    tags: [],
    published: false,
  });
  const [tagInput, setTagInput] = useState("");

  // Check admin access
  if (user && user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  const createPost = trpc.blog.create.useMutation();
  const uploadCoverImage = trpc.blog.uploadCoverImage.useMutation();

  const handleCreatePost = async () => {
    try {
      const result = await createPost.mutateAsync({
        slug: post.slug,
        title: post.title,
        description: post.excerpt,
        content: post.content,
        featuredImage: post.featuredImage || undefined,
        author: post.author || undefined,
        category: post.category,
        tags: post.tags.length > 0 ? post.tags.join(",") : undefined,
        readingTimeMinutes: Math.max(1, Math.ceil(post.content.trim().split(/\s+/).filter(Boolean).length / 220)),
        published: post.published,
      });
      if (result?.success) {
        toast.success("Blog post created successfully!");
        navigate("/admin/blog");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to create blog post");
    }
  };

  const handleCoverImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP cover image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Cover images must be 5 MB or smaller.");
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the selected image."));
        reader.readAsDataURL(file);
      });
      const dataBase64 = dataUrl.split(",")[1];
      if (!dataBase64) throw new Error("Could not encode the selected image.");

      const uploaded = await uploadCoverImage.mutateAsync({
        fileName: file.name,
        contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
        dataBase64,
      });
      setPost((current) => ({ ...current, featuredImage: uploaded.url }));
      toast.success("Cover image uploaded.");
    } catch (error) {
      console.error("Cover image upload failed:", error);
      toast.error(error instanceof Error ? error.message : "Cover image upload failed.");
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && post.tags.length < 10) {
      setPost({
        ...post,
        tags: [...post.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setPost({
      ...post,
      tags: post.tags.filter((_, i) => i !== index),
    });
  };

  const handleGenerateSlug = () => {
    const slug = post.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setPost({ ...post, slug });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Blog Post</h1>
          <p className="text-muted-foreground">Write and publish health education content</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Card>
              <CardHeader>
                <CardTitle>Post Title</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Enter blog post title"
                  value={post.title}
                  onChange={(e) => setPost({ ...post, title: e.target.value })}
                  className="text-lg"
                />
              </CardContent>
            </Card>

            {/* Slug */}
            <Card>
              <CardHeader>
                <CardTitle>URL Slug</CardTitle>
                <CardDescription>Auto-generated from title or customize manually</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="url-slug"
                    value={post.slug}
                    onChange={(e) => setPost({ ...post, slug: e.target.value })}
                  />
                  <Button onClick={handleGenerateSlug} variant="outline">
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Excerpt */}
            <Card>
              <CardHeader>
                <CardTitle>Excerpt</CardTitle>
                <CardDescription>Short summary for preview (10-500 characters)</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Write a compelling excerpt..."
                  value={post.excerpt}
                  onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Content */}
            <MarkdownEditor
              value={post.content}
              onChange={(content) => setPost({ ...post, content })}
              height="500px"
              showPreview={true}
              toolbarButtons={true}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={post.category} onValueChange={(value) => setPost({ ...post, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                  />
                  <Button onClick={handleAddTag} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, idx) => (
                    <div key={idx} className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {tag}
                      <button onClick={() => handleRemoveTag(idx)} className="hover:opacity-70">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cover Image</CardTitle>
                <CardDescription>JPEG, PNG, or WebP · up to 5 MB</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {post.featuredImage ? (
                  <div className="overflow-hidden rounded-xl border border-border bg-muted">
                    <img
                      src={post.featuredImage}
                      alt={post.title ? `Cover preview for ${post.title}` : "Article cover preview"}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground">
                    <span><ImagePlus className="mx-auto mb-2 h-5 w-5" />No cover image selected</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                    {uploadCoverImage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    {uploadCoverImage.isPending ? "Uploading..." : post.featuredImage ? "Replace image" : "Upload image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={uploadCoverImage.isPending}
                      onChange={handleCoverImageSelected}
                    />
                  </label>
                  {post.featuredImage && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setPost((current) => ({ ...current, featuredImage: undefined }))}>
                      Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Meta Title</Label>
                  <Input
                    placeholder="SEO title (max 60 chars)"
                    value={post.seoTitle || ""}
                    onChange={(e) => setPost({ ...post, seoTitle: e.target.value })}
                    maxLength={60}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Meta Description</Label>
                  <Textarea
                    placeholder="SEO description (max 160 chars)"
                    value={post.seoDescription || ""}
                    onChange={(e) => setPost({ ...post, seoDescription: e.target.value })}
                    maxLength={160}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Publish */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={post.published}
                    onChange={(e) => setPost({ ...post, published: e.target.checked })}
                  />
                  <span className="text-sm">Publish immediately</span>
                </label>
                <Button
                  onClick={handleCreatePost}
                  disabled={createPost.isPending || !post.title || !post.slug || !post.content}
                  className="w-full gap-2"
                >
                  <Save className="h-4 w-4" />
                  {createPost.isPending ? "Creating..." : "Create Post"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          EDUCATIONAL CONTENT ONLY
        </p>
      </div>
    </div>
  );
}
