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

interface GeneratedSearch {
  text: string;
  selected: boolean;
}

const BlogsTab = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
  const [generatedSearches, setGeneratedSearches] = useState<GeneratedSearch[]>([]);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    const { data } = await supabase.from("blogs").select("*").order("created_at", { ascending: false });
    setBlogs(data || []);
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
        if (response.data?.relatedSearches?.length) {
          setGeneratedSearches(response.data.relatedSearches.map((text: string) => ({ text, selected: false })));
        }
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

  const toggleSearchSelection = (index: number) => {
    const selectedCount = generatedSearches.filter(s => s.selected).length;
    const search = generatedSearches[index];
    
    if (!search.selected && selectedCount >= 4) {
      toast.error("Maximum 4 related searches can be selected");
      return;
    }
    
    setGeneratedSearches(prev => prev.map((s, i) => 
      i === index ? { ...s, selected: !s.selected } : s
    ));
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setAuthor("");
    setCategory("");
    setContent("");
    setFeaturedImage("");
    setStatus("draft");
    setGeneratedSearches([]);
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
      related_search_id: null,
    };

    let blogId = editingBlog?.id;

    if (editingBlog) {
      const { error } = await supabase.from("blogs").update(blogData).eq("id", editingBlog.id);
      if (error) {
        toast.error("Failed to update blog");
        return;
      }
    } else {
      const { data, error } = await supabase.from("blogs").insert([blogData]).select().single();
      if (error) {
        toast.error("Failed to create blog");
        return;
      }
      blogId = data.id;
    }

    // Save selected related searches
    const selectedSearches = generatedSearches.filter(s => s.selected);
    if (selectedSearches.length > 0 && blogId) {
      // First, remove any existing related searches for this blog
      await supabase.from("related_searches").delete().eq("blog_id", blogId);
      
      // Insert new selected searches
      const searchesToInsert = selectedSearches.map((s, idx) => ({
        search_text: s.text,
        title: s.text,
        blog_id: blogId,
        web_result_page: idx + 1,
        display_order: idx,
        position: idx + 1,
        is_active: true,
      }));
      
      const { error: searchError } = await supabase.from("related_searches").insert(searchesToInsert);
      if (searchError) {
        console.error("Failed to save related searches:", searchError);
      }
    }

    toast.success(editingBlog ? "Blog updated" : "Blog created");
    setIsDialogOpen(false);
    resetForm();
    fetchBlogs();
  };

  const handleEdit = async (blog: Blog) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setAuthor(blog.author || "");
    setCategory(blog.category || "");
    setContent(blog.content || "");
    setFeaturedImage(blog.featured_image || "");
    setStatus(blog.status || "draft");
    
    // Load existing related searches for this blog
    const { data: searches } = await supabase
      .from("related_searches")
      .select("search_text")
      .eq("blog_id", blog.id)
      .order("display_order");
    
    if (searches?.length) {
      setGeneratedSearches(searches.map(s => ({ text: s.search_text, selected: true })));
    } else {
      setGeneratedSearches([]);
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // First delete related searches
    await supabase.from("related_searches").delete().eq("blog_id", id);
    
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete blog");
      return;
    }
    toast.success("Blog deleted");
    fetchBlogs();
  };

  const selectedSearchCount = generatedSearches.filter(s => s.selected).length;

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
              <DialogTitle>{editingBlog ? "Edit Blog" : "Create New Blog"}</DialogTitle>
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
                  <Label>Content *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={generateContent} disabled={isGeneratingContent || !title}>
                    {isGeneratingContent ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                    Generate Content
                  </Button>
                </div>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Blog content..." rows={4} />
              </div>
              
              {/* Related Searches Selection */}
              {generatedSearches.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Related Searches (max 4)</Label>
                  <p className="text-xs text-muted-foreground">Selected searches will be linked to this blog and redirect to /wr=1, /wr=2, etc.</p>
                  <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                    {generatedSearches.map((search, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                          search.selected ? 'bg-primary/20 border border-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleSearchSelection(idx)}
                      >
                        <Checkbox checked={search.selected} />
                        <span className="flex-1">{search.text}</span>
                        {search.selected && (
                          <span className="text-xs text-primary font-medium">
                            → /wr={generatedSearches.filter((s, i) => s.selected && i <= idx).length}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedSearchCount}/4 selected</p>
                </div>
              )}
              
              <div>
                <Label>Featured Image URL</Label>
                <div className="flex gap-2">
                  <Input value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)} placeholder="https://..." className="flex-1" />
                  <Button type="button" variant="outline" onClick={generateImage} disabled={isGeneratingImage || !title}>
                    {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
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