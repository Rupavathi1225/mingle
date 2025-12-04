import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RelatedSearch {
  id: string;
  search_text: string;
  title: string | null;
  web_result_page: number;
  position: number;
  display_order: number;
  is_active: boolean;
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
  const [searchText, setSearchText] = useState("");
  const [title, setTitle] = useState("");
  const [webResultPage, setWebResultPage] = useState(1);
  const [position, setPosition] = useState(1);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clickDetails, setClickDetails] = useState<ClickDetail[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedSearchName, setSelectedSearchName] = useState("");

  useEffect(() => {
    fetchSearches();
  }, []);

  const fetchSearches = async () => {
    const { data } = await supabase.from('related_searches').select('*').order('display_order');
    if (data) setSearches(data);
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
      is_active: isActive
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
  };

  const handleDelete = async (id: string) => {
    await supabase.from('related_searches').delete().eq('id', id);
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
            <label className="text-sm text-muted-foreground mb-2 block">Search Text</label>
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Web Result Page (wr=)</label>
            <Input
              type="number"
              value={webResultPage}
              onChange={(e) => setWebResultPage(parseInt(e.target.value) || 1)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Position</label>
            <Input
              type="number"
              value={position}
              onChange={(e) => setPosition(parseInt(e.target.value) || 1)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Display Order</label>
            <Input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
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
        
        <div className="space-y-3">
          {searches.map((search) => (
            <div key={search.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div>
                <p className="font-medium text-foreground">{search.search_text}</p>
                <p className="text-sm text-muted-foreground">
                  Page: {search.web_result_page} | Pos: {search.position} | Order: {search.display_order}
                </p>
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

      {/* Click Breakdown Dialog */}
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
