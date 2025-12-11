import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ExternalLink, Loader2, Sparkles, Copy } from "lucide-react";
import BulkActionToolbar from "./BulkActionToolbar";
import { convertToCSV, downloadCSV } from "@/lib/csvExport";

interface Blog {
  id: string;
  title: string;
  slug: string;
  author: string | null;
  category: string | null;
  content: string | null;
  featured_image: string | null;
  status: string;
  related_search_id: string | null;
  created_at: string;
}

interface RelatedSearch {
  id: string;
  search_text: string;
  title: string | null;
}

const BlogsTab = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [relatedSearches, setRelatedSearches] = useState<RelatedSearch[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState("draft");
  const [relatedSearchId, setRelatedSearchId] = useState<string>("");

  useEffect(() => {
    fetchBlogs();
    fetchRelatedSearches();
  }, []);

  const fetchBlogs = async () => {
    const { data } = await supabase.from("blogs").select("*").order("created_at", { ascending: false });
    setBlogs(data || []);
  };

  const fetchRelatedSearches = async () => {
    const { data } = await supabase.from("related_searches").select("id, search_text, title").eq("is_active", true);
    setRelatedSearches(data || []);
  };

  const generateSlug = (text: string) => text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!editingBlog) setSlug(generateSlug(value));
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = (checked: boolean) => setSelectedIds(checked ? new Set(blogs.map(b => b.id)) : new Set());

  const handleExportAll = () => {
    downloadCSV(convertToCSV(blogs, ['id', 'title', 'slug', 'author', 'category', 'status']), 'blogs_all.csv');
    toast.success("Exported all blogs");
  };

  const handleExportSelected = () => {
    const selected = blogs.filter(b => selectedIds.has(b.id));
    downloadCSV(convertToCSV(selected, ['id', 'title', 'slug', 'author', 'category', 'status']), 'blogs_selected.csv');
    toast.success(`Exported ${selected.length} blogs`);
  };

  const handleCopy = () => {
    const selected = blogs.filter(b => selectedIds.has(b.id));
    navigator.clipboard.writeText(selected.map(b => `${b.title} - /blog/${b.slug}`).join('\n'));
    toast.success("Copied");
  };

  const handleBulkActivate = async () => {
    await supabase.from('blogs').update({ status: 'published' }).in('id', Array.from(selectedIds));
    toast.success("Published");
    fetchBlogs();
    setSelectedIds(new Set());
  };

  const handleBulkDeactivate = async () => {
    await supabase.from('blogs').update({ status: 'draft' }).in('id', Array.from(selectedIds));
    toast.success("Set to draft");
    fetchBlogs();
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    await supabase.from('blogs').delete().in('id', Array.from(selectedIds));
    toast.success("Deleted");
    fetchBlogs();
    setSelectedIds(new Set());
  };

  const generateImage = async () => {
    if (!title) return;
    setIsGeneratingImage(true);
    try {
      const response = await supabase.functions.invoke("generate-blog-image", { body: { title } });
      if (response.data?.imageUrl) {
        setFeaturedImage(response.data.imageUrl);
        toast.success("Image generated!");
      }
    } catch {
      toast.error("Failed to generate image");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateContent = async () => {
    if (!title) {
      toast.error("Please enter a title first");
      return;
    }
    setIsGeneratingContent(true);
    try {
      const response = await supabase.functions.invoke("generate-blog-content", { body: { title, slug } });
      if (response.error) {
        toast.error(response.error.message || "Failed to generate content");
        return;
      }
      if (response.data?.content) {
        setContent(response.data.content);
        toast.success("Content generated!");
      } else if (response.data?.error) {
        toast.error(response.data.error);
      }
    } catch {
      toast.error("Failed to generate content");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setAuthor("");
    setCategory("");
    setContent("");
    setFeaturedImage("");
    setStatus("draft");
    setRelatedSearchId("");
    setEditingBlog(null);
  };

  const handleSave = async () => {
    if (!title || !slug) {
      toast.error("Title and slug are required");
      return;
    }

    const blogData = {
      title,
      slug,
      author: author || null,
      category: category || null,
      content: content || null,
      featured_image: featuredImage || null,
      status,
      related_search_id: relatedSearchId && relatedSearchId !== "none" ? relatedSearchId : null,
    };

    if (editingBlog) {
      const { error } = await supabase.from("blogs").update(blogData).eq("id", editingBlog.id);
      if (error) {
        toast.error("Failed to update blog");
        return;
      }
      toast.success("Blog updated");
    } else {
      const { error } = await supabase.from("blogs").insert([blogData]);
      if (error) {
        toast.error("Failed to create blog");
        return;
      }
      toast.success("Blog created");
    }

    setIsDialogOpen(false);
    resetForm();
    fetchBlogs();
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setAuthor(blog.author || "");
    setCategory(blog.category || "");
    setContent(blog.content || "");
    setFeaturedImage(blog.featured_image || "");
    setStatus(blog.status || "draft");
    setRelatedSearchId(blog.related_search_id || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete blog");
      return;
    }
    toast.success("Blog deleted");
    fetchBlogs();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Blogs Management</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Blog</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBlog ? "Edit Blog" : "Add New Blog"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Blog title" />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="blog-slug" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Author</Label>
                  <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Content</Label>
                  <Button type="button" variant="outline" size="sm" onClick={generateContent} disabled={isGeneratingContent || !title}>
                    {isGeneratingContent ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                    Generate
                  </Button>
                </div>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Blog content..." rows={6} />
              </div>
              <div>
                <Label>Featured Image URL</Label>
                <div className="flex gap-2">
                  <Input value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)} placeholder="https://..." className="flex-1" />
                  <Button type="button" variant="outline" onClick={generateImage} disabled={isGeneratingImage || !title}>
                    {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Related Search</Label>
                  <Select value={relatedSearchId || "none"} onValueChange={setRelatedSearchId}>
                    <SelectTrigger><SelectValue placeholder="Select search" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {relatedSearches.map((rs) => (
                        <SelectItem key={rs.id} value={rs.id}>{rs.title || rs.search_text}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">{editingBlog ? "Update Blog" : "Create Blog"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <BulkActionToolbar
          selectedCount={selectedIds.size}
          totalCount={blogs.length}
          onSelectAll={handleSelectAll}
          isAllSelected={selectedIds.size === blogs.length && blogs.length > 0}
          onExportAll={handleExportAll}
          onExportSelected={handleExportSelected}
          onCopy={handleCopy}
          onActivate={handleBulkActivate}
          onDeactivate={handleBulkDeactivate}
          onDelete={handleBulkDelete}
        />
        <div className="space-y-2">
          {blogs.map((blog) => (
            <div key={blog.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox checked={selectedIds.has(blog.id)} onCheckedChange={() => toggleSelection(blog.id)} />
                <div>
                  <div className="font-medium">{blog.title}</div>
                  <div className="text-sm text-muted-foreground">/blog/{blog.slug} • {blog.status}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => {
                  const fullUrl = `${window.location.origin}/blog/${blog.slug}`;
                  navigator.clipboard.writeText(fullUrl);
                  toast.success("Link copied!");
                }}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => window.open(`/blog/${blog.slug}`, '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(blog)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(blog.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {blogs.length === 0 && <p className="text-center text-muted-foreground py-8">No blogs found</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogsTab;
