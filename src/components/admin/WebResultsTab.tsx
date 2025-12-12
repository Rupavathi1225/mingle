import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Eye, Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BulkActionToolbar from "./BulkActionToolbar";
import { convertToCSV, downloadCSV } from "@/lib/csvExport";

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


interface ClickDetail {
  id: string;
  ip_address: string | null;
  country: string | null;
  device_type: string | null;
  timestamp: string | null;
}

interface GeneratedResult {
  title: string;
  description: string;
  link: string;
  selected: boolean;
  isSponsored: boolean;
}

const WebResultsTab = () => {
  const [results, setResults] = useState<WebResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [relatedSearches, setRelatedSearches] = useState<RelatedSearch[]>([]);
  const [selectedRelatedSearch, setSelectedRelatedSearch] = useState("");
  const [selectedPageFilter, setSelectedPageFilter] = useState<number | "all">("all");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clickDetails, setClickDetails] = useState<ClickDetail[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedResultName, setSelectedResultName] = useState("");
  
  // AI Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);

  // Manual entry fields
  const [manualTitle, setManualTitle] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [manualLogoUrl, setManualLogoUrl] = useState("");
  const [manualSponsored, setManualSponsored] = useState(false);

  useEffect(() => {
    fetchResults();
    fetchRelatedSearches();
  }, []);

  const fetchResults = async () => {
    const { data } = await supabase.from('web_results').select('*').order('web_result_page').order('position');
    if (data) setResults(data);
  };

  const fetchRelatedSearches = async () => {
    const { data } = await supabase.from('related_searches').select('id, search_text, web_result_page').eq('is_active', true).order('web_result_page');
    if (data) setRelatedSearches(data);
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
      setSelectedIds(new Set(results.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleExportAll = () => {
    const csv = convertToCSV(results, ['id', 'title', 'description', 'original_link', 'web_result_page', 'position', 'is_active', 'is_sponsored']);
    downloadCSV(csv, 'web_results_all.csv');
    toast({ title: "Success", description: "Exported all web results to CSV" });
  };

  const handleExportSelected = () => {
    const selected = results.filter(r => selectedIds.has(r.id));
    const csv = convertToCSV(selected, ['id', 'title', 'description', 'original_link', 'web_result_page', 'position', 'is_active', 'is_sponsored']);
    downloadCSV(csv, 'web_results_selected.csv');
    toast({ title: "Success", description: `Exported ${selected.length} web results to CSV` });
  };

  const handleCopy = () => {
    const selected = results.filter(r => selectedIds.has(r.id));
    const text = selected.map(r => `${r.title} - ${r.original_link}`).join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: "Success", description: "Copied to clipboard" });
  };

  const handleBulkActivate = async () => {
    const ids = Array.from(selectedIds);
    await supabase.from('web_results').update({ is_active: true }).in('id', ids);
    toast({ title: "Success", description: `Activated ${ids.length} web results` });
    fetchResults();
    setSelectedIds(new Set());
  };

  const handleBulkDeactivate = async () => {
    const ids = Array.from(selectedIds);
    await supabase.from('web_results').update({ is_active: false }).in('id', ids);
    toast({ title: "Success", description: `Deactivated ${ids.length} web results` });
    fetchResults();
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    await supabase.from('web_results').delete().in('id', ids);
    toast({ title: "Success", description: `Deleted ${ids.length} web results` });
    fetchResults();
    setSelectedIds(new Set());
  };

  const generateWebResults = async () => {
    if (!selectedRelatedSearch) {
      toast({ title: "Error", description: "Please select a related search first", variant: "destructive" });
      return;
    }

    const relatedSearch = relatedSearches.find(rs => rs.id === selectedRelatedSearch);
    if (!relatedSearch) return;

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-web-results", {
        body: { searchText: relatedSearch.search_text }
      });

      if (response.error) {
        toast({ title: "Error", description: response.error.message || "Failed to generate results", variant: "destructive" });
        return;
      }

      if (response.data?.results?.length) {
        setGeneratedResults(response.data.results.map((r: { title: string; description: string; link: string }) => ({
          ...r,
          selected: false,
          isSponsored: false
        })));
        toast({ title: "Success", description: "Web results generated!" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to generate results", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleResultSelection = (index: number) => {
    const selectedCount = generatedResults.filter(r => r.selected).length;
    const result = generatedResults[index];
    
    if (!result.selected && selectedCount >= 4) {
      toast({ title: "Error", description: "Maximum 4 results can be selected", variant: "destructive" });
      return;
    }
    
    setGeneratedResults(prev => prev.map((r, i) => 
      i === index ? { ...r, selected: !r.selected } : r
    ));
  };

  const toggleResultSponsored = (index: number) => {
    setGeneratedResults(prev => prev.map((r, i) => 
      i === index ? { ...r, isSponsored: !r.isSponsored } : r
    ));
  };

  const handleSaveGeneratedResults = async () => {
    if (!selectedRelatedSearch) {
      toast({ title: "Error", description: "Related search is required", variant: "destructive" });
      return;
    }

    const relatedSearch = relatedSearches.find(rs => rs.id === selectedRelatedSearch);
    if (!relatedSearch) return;

    const selectedResults = generatedResults.filter(r => r.selected);
    if (selectedResults.length === 0) {
      toast({ title: "Error", description: "Please select at least one result", variant: "destructive" });
      return;
    }

    const resultsToInsert = selectedResults.map((r, idx) => ({
      title: r.title,
      description: r.description,
      original_link: r.link,
      web_result_page: relatedSearch.web_result_page,
      is_sponsored: r.isSponsored,
      is_active: isActive,
      position: idx
    }));

    const { error } = await supabase.from('web_results').insert(resultsToInsert);
    
    if (error) {
      toast({ title: "Error", description: "Failed to save results", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: `Created ${selectedResults.length} web results!` });
    resetForm();
    fetchResults();
  };

  const handleSaveManual = async () => {
    if (!manualTitle || !manualLink || !selectedRelatedSearch) {
      toast({ title: "Error", description: "Title, link, and related search are required", variant: "destructive" });
      return;
    }

    const relatedSearch = relatedSearches.find(rs => rs.id === selectedRelatedSearch);
    if (!relatedSearch) {
      toast({ title: "Error", description: "Please select a valid related search", variant: "destructive" });
      return;
    }

    const payload = {
      title: manualTitle,
      description: manualDescription || null,
      original_link: manualLink,
      logo_url: manualLogoUrl || null,
      web_result_page: relatedSearch.web_result_page,
      is_sponsored: manualSponsored,
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
    setManualTitle(result.title);
    setManualDescription(result.description || "");
    setManualLink(result.original_link);
    setManualLogoUrl(result.logo_url || "");
    const matchingRS = relatedSearches.find(rs => rs.web_result_page === result.web_result_page);
    setSelectedRelatedSearch(matchingRS?.id || "");
    setManualSponsored(result.is_sponsored || false);
    setIsActive(result.is_active);
    setGeneratedResults([]);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('web_results').delete().eq('id', id);
    toast({ title: "Success", description: "Web result deleted!" });
    fetchResults();
  };

  const resetForm = () => {
    setEditingId(null);
    setManualTitle("");
    setManualDescription("");
    setManualLink("");
    setManualLogoUrl("");
    setSelectedRelatedSearch("");
    setManualSponsored(false);
    setIsActive(true);
    setGeneratedResults([]);
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

  const selectedGeneratedCount = generatedResults.filter(r => r.selected).length;

  const filteredResults = selectedPageFilter === "all" 
    ? results 
    : results.filter(r => r.web_result_page === selectedPageFilter);

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-bold text-primary mb-6">
          {editingId ? "Edit Web Result" : "Add Web Results"}
        </h2>
        
        {/* Related Search Selection */}
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-2 block">Related Search (determines page) *</label>
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

        {/* Generate AI Results Button */}
        {!editingId && (
          <div className="mb-6">
            <Button 
              onClick={generateWebResults} 
              disabled={isGenerating || !selectedRelatedSearch}
              variant="outline"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate AI Web Results
            </Button>
          </div>
        )}

        {/* Generated Results Selection */}
        {generatedResults.length > 0 && (
          <div className="mb-6 space-y-3">
            <label className="text-sm text-muted-foreground block">Select Web Results (max 4) - Toggle Sponsored for each</label>
            <div className="border rounded-lg p-3 space-y-2 max-h-80 overflow-y-auto">
              {generatedResults.map((result, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded border transition-colors ${
                    result.selected ? 'bg-primary/20 border-primary' : 'hover:bg-muted border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={result.selected} 
                      onCheckedChange={() => toggleResultSelection(idx)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{result.title}</p>
                      <p className="text-sm text-muted-foreground">{result.description}</p>
                      <p className="text-xs text-primary mt-1">{result.link}</p>
                    </div>
                    {result.selected && (
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={result.isSponsored} 
                          onCheckedChange={() => toggleResultSponsored(idx)}
                        />
                        <span className={`text-xs ${result.isSponsored ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                          {result.isSponsored ? 'Sponsored' : 'Normal'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{selectedGeneratedCount}/4 selected</p>
            
            {/* Common options for generated results */}
            <div className="flex items-center gap-2 mt-4">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <label className="text-sm text-muted-foreground">Active</label>
            </div>
            
            <Button onClick={handleSaveGeneratedResults} className="mt-4">
              Save Selected Results ({selectedGeneratedCount})
            </Button>
          </div>
        )}

        {/* Manual Entry Section */}
        <div className="border-t border-border pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? "Edit Web Result" : "Or Add Manually"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Title</label>
              <Input
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Original Link</label>
              <Input
                value={manualLink}
                onChange={(e) => setManualLink(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground mb-2 block">Description</label>
              <Textarea
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={manualSponsored} onCheckedChange={setManualSponsored} />
                <label className="text-sm text-muted-foreground">Sponsored</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <label className="text-sm text-muted-foreground">Active</label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={handleSaveManual}>{editingId ? "Update" : "Create Manual"}</Button>
            {editingId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-bold text-primary mb-6">Existing Web Results</h2>
        
        {/* Page Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedPageFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPageFilter("all")}
          >
            All
          </Button>
          {relatedSearches.map((rs) => (
            <Button
              key={rs.id}
              variant={selectedPageFilter === rs.web_result_page ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPageFilter(rs.web_result_page)}
            >
              wr={rs.web_result_page} - {rs.search_text.slice(0, 15)}...
            </Button>
          ))}
        </div>
        
        <BulkActionToolbar
          totalCount={filteredResults.length}
          selectedCount={selectedIds.size}
          isAllSelected={filteredResults.length > 0 && selectedIds.size === filteredResults.length}
          onSelectAll={(checked) => handleSelectAll(checked)}
          onExportAll={handleExportAll}
          onExportSelected={handleExportSelected}
          onCopy={handleCopy}
          onActivate={handleBulkActivate}
          onDeactivate={handleBulkDeactivate}
          onDelete={handleBulkDelete}
        />

        <div className="space-y-3">
          {filteredResults.map((result) => (
            <div key={result.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedIds.has(result.id)}
                  onCheckedChange={() => toggleSelection(result.id)}
                />
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
                    wr={result.web_result_page} 
                    {result.is_sponsored && <span className="text-yellow-500"> • Sponsored</span>}
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${result.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {result.is_active ? 'Active' : 'Inactive'}
                    </span>
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

