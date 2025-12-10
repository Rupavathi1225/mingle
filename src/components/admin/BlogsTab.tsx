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
import { Plus, Edit, Trash2, Copy, ExternalLink, Loader2, Sparkles } from "lucide-react";
import BulkActionToolbar from "./BulkActionToolbar";
import { convertToCSV, downloadCSV } from "@/lib/csvExport";

interface Blog { id: string; title: string; slug: string; author: string | null; category: string | null; content: string | null; featured_image: string | null; status: string; related_search_id: string | null; created_at: string; }
interface RelatedSearch { id: string; search_text: string; title: string | null; }

const BlogsTab = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [relatedSearches, setRelatedSearches] = useState<RelatedSearch[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState("draft");
  const [relatedSearchId, setRelatedSearchId] = useState<string>("");

  useEffect(() => { fetchBlogs(); fetchRelatedSearches(); }, []);

  const fetchBlogs = async () => { const { data } = await supabase.from("blogs").select("*").order("created_at", { ascending: false }); setBlogs(data || []); };
  const fetchRelatedSearches = async () => { const { data } = await supabase.from("related_searches").select("id, search_text, title").eq("is_active", true); setRelatedSearches(data || []); };
  const generateSlug = (text: string) => text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
  const handleTitleChange = (value: string) => { setTitle(value); if (!editingBlog) setSlug(generateSlug(value)); };
  const toggleSelection = (id: string) => { const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelectedIds(n); };
  const handleSelectAll = (c: boolean) => setSelectedIds(c ? new Set(blogs.map(b => b.id)) : new Set());
  const handleExportAll = () => { downloadCSV(convertToCSV(blogs, ['id', 'title', 'slug', 'author', 'category', 'status']), 'blogs_all.csv'); toast.success("Exported all blogs"); };
  const handleExportSelected = () => { const s = blogs.filter(b => selectedIds.has(b.id)); downloadCSV(convertToCSV(s, ['id', 'title', 'slug', 'author', 'category', 'status']), 'blogs_selected.csv'); toast.success(`Exported ${s.length} blogs`); };
  const handleCopy = () => { const s = blogs.filter(b => selectedIds.has(b.id)); navigator.clipboard.writeText(s.map(b => `${b.title} - /blog/${b.slug}`).join('\n')); toast.success("Copied"); };
  const handleBulkActivate = async () => { await supabase.from('blogs').update({ status: 'published' }).in('id', Array.from(selectedIds)); toast.success("Published"); fetchBlogs(); setSelectedIds(new Set()); };
  const handleBulkDeactivate = async () => { await supabase.from('blogs').update({ status: 'draft' }).in('id', Array.from(selectedIds)); toast.success("Set to draft"); fetchBlogs(); setSelectedIds(new Set()); };
  const handleBulkDelete = async () => { await supabase.from('blogs').delete().in('id', Array.from(selectedIds)); toast.success("Deleted"); fetchBlogs(); setSelectedIds(new Set()); };
  const generateImage = async () => { if (!title) return; setIsGeneratingImage(true); try { const r = await supabase.functions.invoke("generate-blog-image", { body: { title } }); if (r.data?.imageUrl) { setFeaturedImage(r.data.imageUrl); toast.success("Image generated!"); } } catch { toast.error("Failed to generate image"); } finally { setIsGeneratingImage(false); }