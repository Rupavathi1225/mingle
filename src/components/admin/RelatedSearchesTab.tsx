import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import BulkActionToolbar from "./BulkActionToolbar";
import { convertToCSV, downloadCSV } from "@/lib/csvExport";

interface RelatedSearch {
  id: string;
  search_text: string;
  title: string | null;
  web_result_page: number;
  position: number;
  display_order: number;
  is_active: boolean;
  blog_id: string | null;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
}

interface ClickDetail {
  id: string;
  ip_address: string | null;
  country: string | null;
  device_type: string | null;
  timestamp: string | null;
}

const RelatedSearchesTab = () => {
  const [searches, setSearches] = useState<RelatedSearch[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState("");
  const [title, setTitle] = useState("");
  const [webResultPage, setWebResultPage] = useState(1);
  const [position, setPosition] = useState(1);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [blogId, setBlogId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clickDetails, setClickDetails] = useState<ClickDetail[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedSearchName, setSelectedSearchName] = useState("");

  useEffect(() => {
    fetchSearches();
    fetchBlogs();
  }, []);

  const fetchSearches = async () => {
    const { data } = await supabase.from('related_searches').select('*').order('display_order');
    if (data) setSearches(data as RelatedSearch[]);
  };

  const fetchBlogs = async () => {
    const { data } = await supabase.from('blogs').select('id, title, slug').order('title');
    if (data) setBlogs(data);
  };

  const getBlogName = (blogId: string | null) => {
    if (!blogId) return "No Blog";
    const blog = blogs.find(b => b.id === blogId);
    return blog ? blog.title : "Unknown Blog";
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(searches.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleExportAll = () => {
    const csv = convertToCSV(searches, ['id', 'search_text', 'title', 'web_result_page', 'position', 'display_order', 'is_active', 'blog_id']);
    downloadCSV(csv, 'related_searches_all.csv');
    toast({ title: "Success", description: "Exported all searches to CSV" });
  };

  const handleExportSelected = () => {
    const selected = searches.filter(s => selectedIds.has(s.id));
    const csv = convertToCSV(selected, ['id', 'search_text', 'title', 'web_result_page', 'position', 'display_order', 'is_active', 'blog_id']);
    downloadCSV(csv, 'related_searches_selected.csv');
    toast({ title: "Success", description: `Exported ${selected.length} searches to CSV` });
  };

  const handleCopy = () => {
    const selected = searches.filter(s => selectedIds.has(s.id));
    const baseUrl = window.location.origin;
    const links = selected.map(s => `${baseUrl}/web-results/${s.web_result_page}`);
    navigator.clipboard.writeText(links.join('\n'));
    
    // Open each link in a new tab
    selected.forEach(s => {
      window.open(`${baseUrl}/web-results/${s.web_result_page}`, '_blank');
    });
    
    toast({ title: "Success", description: `Copied ${links.length} links and opened in new tabs` });
  };

  const handleBulkActivate = async () => {
    const ids = Array.from(selectedIds);
    await supabase.from('related_searches').update({ is_active: true }).in('id', ids);
    toast({ title: "Success", description: `Activated ${ids.length} searches` });
    fetchSearches();
    setSelectedIds(new Set());
  };

  const handleBulkDeactivate = async () => {
    const ids = Array.from(selectedIds);
    await supabase.from('related_searches').update({ is_active: false }).in('id', ids);
    toast({ title: "Success", description: `Deactivated ${ids.length} searches` });
    fetchSearches();
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    
    // Delete related records first to avoid foreign key constraint errors
    await supabase.from('click_tracking').delete().in('related_search_id', ids);
    
    const { error } = await supabase.from('related_searches').delete().in('id', ids);
    
    if (error) {
      toast({ title: "Error", description: "Failed to delete searches", variant: "destructive" });
      return;
    }
    
    toast({ title: "Success", description: `Deleted ${ids.length} searches` });
    fetchSearches();
    setSelectedIds(new Set());
  };

  const handleSave = async () => {
    if (!searchText) {
      toast({ title: "Error", description: "Search text is required", variant: "destructive" });
      return;
    }

    const payload = {
      search_text: searchText,
      title: title || searchText,
      web_result_page: webResultPage,
      position,
      display_order: displayOrder,
      is_active: isActive,
      blog_id: blogId && blogId !== "none" ? blogId : null
    };

    if (editingId) {
      await supabase.from('related_searches').update(payload).eq('id', editingId);
      toast({ title: "Success", description: "Search updated!" });
    } else {
      await supabase.from('related_searches').insert(payload);
      toast({ title: "Success", description: "Search created!" });
    }

    resetForm();
    fetchSearches();
  };

  const handleEdit = (search: RelatedSearch) => {
    setEditingId(search.id);
    setSearchText(search.search_text);
    setTitle(search.title || "");
    setWebResultPage(search.web_result_page);
    setPosition(search.position);
    setDisplayOrder(search.display_order);
    setIsActive(search.is_active);
    setBlogId(search.blog_id || "");
  };

  const handleDelete = async (id: string) => {
    // Delete related records first to avoid foreign key constraint errors
    await supabase.from('click_tracking').delete().eq('related_search_id', id);
    
    const { error } = await supabase.from('related_searches').delete().eq('id', id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to delete search", variant: "destructive" });
      return;
    }
    
    toast({ title: "Success", description: "Search deleted!" });
    fetchSearches();
  };

  const resetForm = () => {
    setEditingId(null);
    setSearchText("");
    setTitle("");
    setWebResultPage(1);
    setPosition(1);
    setDisplayOrder(0);
    setIsActive(true);
    setBlogId("");
  };

  const handleViewBreakdown = async (search: RelatedSearch) => {
    const { data } = await supabase
      .from('click_tracking')
      .select('*')
      .eq('related_search_id', search.id)
      .order('timestamp', { ascending: false });
    
    setClickDetails(data || []);
    setSelectedSearchName(search.search_text);
    setShowBreakdown(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-bold text-primary mb-6">
          {editingId ? "Edit Related Search" : "Add Related Search"}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Blog *</label>
            <Select value={blogId || "none"} onValueChange={setBlogId}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select blog" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Blog (Global)</SelectItem>
                {blogs.map((blog) => (
                  <SelectItem key={blog.id} value={blog.id}>{blog.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Title (visible to users)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Best Social Media Platforms 2024"
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Search Text</label>
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Internal search text"
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Web Result Page (1-4)</label>
            <Select value={webResultPage.toString()} onValueChange={(v) => setWebResultPage(parseInt(v))}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Page 1</SelectItem>
                <SelectItem value="2">Page 2</SelectItem>
                <SelectItem value="3">Page 3</SelectItem>
                <SelectItem value="4">Page 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Position (1-4)</label>
            <Select value={position.toString()} onValueChange={(v) => setPosition(parseInt(v))}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Position 1</SelectItem>
                <SelectItem value="2">Position 2</SelectItem>
                <SelectItem value="3">Position 3</SelectItem>
                <SelectItem value="4">Position 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Display Order</label>
            <Input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              placeholder="Lower numbers appear first"
              className="bg-secondary border-border"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <label className="text-sm text-muted-foreground">Active</label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave}>{editingId ? "Update" : "Create"}</Button>
          {editingId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-bold text-primary mb-6">Existing Related Searches</h2>
        
        <BulkActionToolbar
          totalCount={searches.length}
          selectedCount={selectedIds.size}
          isAllSelected={searches.length > 0 && selectedIds.size === searches.length}
          onSelectAll={handleSelectAll}
          onExportAll={handleExportAll}
          onExportSelected={handleExportSelected}
          onCopy={handleCopy}
          onActivate={handleBulkActivate}
          onDeactivate={handleBulkDeactivate}
          onDelete={handleBulkDelete}
        />

        <div className="space-y-3">
          {searches.map((search) => (
            <div key={search.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedIds.has(search.id)}
                  onCheckedChange={() => toggleSelection(search.id)}
                />
                <div>
                  <p className="font-medium text-foreground">{search.title || search.search_text}</p>
                  <p className="text-sm text-muted-foreground">
                    Page: wr-{search.web_result_page} | Pos: {search.position} | Order: {search.display_order}
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${search.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {search.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Blog: <span className="text-primary">{getBlogName(search.blog_id)}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleViewBreakdown(search)}>
                  <Eye className="h-4 w-4 mr-1" /> View Breakdown
                </Button>
                <Button size="icon" variant="outline" onClick={() => handleEdit(search)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="destructive" onClick={() => handleDelete(search.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Click Breakdown: {selectedSearchName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">Total Clicks: {clickDetails.length}</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clickDetails.map((click) => (
                <TableRow key={click.id}>
                  <TableCell>{click.ip_address || '-'}</TableCell>
                  <TableCell>{click.country || '-'}</TableCell>
                  <TableCell>{click.device_type || '-'}</TableCell>
                  <TableCell>{click.timestamp ? new Date(click.timestamp).toLocaleString() : '-'}</TableCell>
                </TableRow>
              ))}
              {clickDetails.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No clicks recorded</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RelatedSearchesTab;
