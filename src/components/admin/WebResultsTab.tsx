import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WebResult {
  id: string;
  web_result_page: number;
  title: string;
  description: string | null;
  original_link: string;
  logo_url: string | null;
  position: number;
  prelanding_key: string | null;
  worldwide: boolean;
  is_active: boolean;
  is_sponsored: boolean | null;
}

interface RelatedSearch {
  id: string;
  search_text: string;
  web_result_page: number;
}

interface Prelanding {
  id: string;
  key: string;
  headline: string;
}

interface ClickDetail {
  id: string;
  ip_address: string | null;
  country: string | null;
  device_type: string | null;
  timestamp: string | null;
}

const WebResultsTab = () => {
  const [results, setResults] = useState<WebResult[]>([]);
  const [relatedSearches, setRelatedSearches] = useState<RelatedSearch[]>([]);
  const [prelandings, setPrelandings] = useState<Prelanding[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalLink, setOriginalLink] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [selectedRelatedSearch, setSelectedRelatedSearch] = useState("");
  const [selectedPrelanding, setSelectedPrelanding] = useState("");
  const [sponsored, setSponsored] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clickDetails, setClickDetails] = useState<ClickDetail[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedResultName, setSelectedResultName] = useState("");

  useEffect(() => {
    fetchResults();
    fetchRelatedSearches();
    fetchPrelandings();
  }, []);

  const fetchResults = async () => {
    const { data } = await supabase.from('web_results').select('*').order('web_result_page').order('position');
    if (data) setResults(data);
  };

  const fetchRelatedSearches = async () => {
    const { data } = await supabase.from('related_searches').select('id, search_text, web_result_page').eq('is_active', true).order('web_result_page');
    if (data) setRelatedSearches(data);
  };

  const fetchPrelandings = async () => {
    const { data } = await supabase.from('prelandings').select('id, key, headline').eq('is_active', true);
    if (data) setPrelandings(data);
  };

  const handleSave = async () => {
    if (!title || !originalLink || !selectedRelatedSearch) {
      toast({ title: "Error", description: "Title, link, and related search are required", variant: "destructive" });
      return;
    }

    const relatedSearch = relatedSearches.find(rs => rs.id === selectedRelatedSearch);
    if (!relatedSearch) {
      toast({ title: "Error", description: "Please select a valid related search", variant: "destructive" });
      return;
    }

    const selectedPrelandingData = selectedPrelanding && selectedPrelanding !== "none" 
      ? prelandings.find(p => p.id === selectedPrelanding) 
      : null;

    const payload = {
      title,
      description: description || null,
      original_link: originalLink,
      logo_url: logoUrl || null,
      web_result_page: relatedSearch.web_result_page,
      prelanding_key: selectedPrelandingData?.key || null,
      is_sponsored: sponsored,
      is_active: isActive
    };

    if (editingId) {
      await supabase.from('web_results').update(payload).eq('id', editingId);
      toast({ title: "Success", description: "Web result updated!" });
    } else {
      await supabase.from('web_results').insert(payload);
      toast({ title: "Success", description: "Web result created!" });
    }

    resetForm();
    fetchResults();
  };

  const handleEdit = (result: WebResult) => {
    setEditingId(result.id);
    setTitle(result.title);
    setDescription(result.description || "");
    setOriginalLink(result.original_link);
    setLogoUrl(result.logo_url || "");
    // Find the related search that matches this web_result_page
    const matchingRS = relatedSearches.find(rs => rs.web_result_page === result.web_result_page);
    setSelectedRelatedSearch(matchingRS?.id || "");
    // Find the prelanding that matches this prelanding_key
    const matchingPL = prelandings.find(p => p.key === result.prelanding_key);
    setSelectedPrelanding(matchingPL?.id || "");
    setSponsored(result.is_sponsored || false);
    setIsActive(result.is_active);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('web_results').delete().eq('id', id);
    toast({ title: "Success", description: "Web result deleted!" });
    fetchResults();
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setOriginalLink("");
    setLogoUrl("");
    setSelectedRelatedSearch("");
    setSelectedPrelanding("");
    setSponsored(false);
    setIsActive(true);
  };

  const handleViewBreakdown = async (result: WebResult) => {
    const { data } = await supabase
      .from('click_tracking')
      .select('*')
      .eq('link_id', result.id)
      .order('timestamp', { ascending: false });
    
    setClickDetails(data || []);
    setSelectedResultName(result.title);
    setShowBreakdown(true);
  };

  const getRelatedSearchName = (webResultPage: number) => {
    const rs = relatedSearches.find(r => r.web_result_page === webResultPage);
    return rs?.search_text || `Page ${webResultPage}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-bold text-primary mb-6">
          {editingId ? "Edit Web Result" : "Add Web Result"}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Original Link</label>
            <Input
              value={originalLink}
              onChange={(e) => setOriginalLink(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground mb-2 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Logo URL</label>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Related Search (determines page)</label>
            <Select value={selectedRelatedSearch} onValueChange={setSelectedRelatedSearch}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select related search" />
              </SelectTrigger>
              <SelectContent>
                {relatedSearches.map((rs) => (
                  <SelectItem key={rs.id} value={rs.id}>
                    {rs.search_text} (Page {rs.web_result_page})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Prelanding (optional)</label>
            <Select value={selectedPrelanding} onValueChange={setSelectedPrelanding}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="No prelanding (direct link)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No prelanding (direct link)</SelectItem>
                {prelandings.map((pl) => (
                  <SelectItem key={pl.id} value={pl.id}>
                    {pl.headline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={sponsored} onCheckedChange={setSponsored} />
              <label className="text-sm text-muted-foreground">Sponsored</label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <label className="text-sm text-muted-foreground">Active</label>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave}>{editingId ? "Update" : "Create"}</Button>
          {editingId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-bold text-primary mb-6">Existing Web Results</h2>
        
        <div className="space-y-3">
          {results.map((result) => (
            <div key={result.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-4">
                {result.logo_url ? (
                  <img src={result.logo_url} alt="" className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold">{result.title.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{result.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {getRelatedSearchName(result.web_result_page)} 
                    {result.is_sponsored && <span className="text-yellow-500"> • Sponsored</span>}
                    {result.prelanding_key && <span className="text-blue-500"> • Has Prelanding</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleViewBreakdown(result)}>
                  <Eye className="h-4 w-4 mr-1" /> View Breakdown
                </Button>
                <Button size="icon" variant="outline" onClick={() => handleEdit(result)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="destructive" onClick={() => handleDelete(result.id)}>
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
            <DialogTitle>Click Breakdown: {selectedResultName}</DialogTitle>
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

export default WebResultsTab;
