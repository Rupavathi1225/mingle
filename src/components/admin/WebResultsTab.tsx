import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";

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
}

const WebResultsTab = () => {
  const [results, setResults] = useState<WebResult[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalLink, setOriginalLink] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [webResultPage, setWebResultPage] = useState(1);
  const [position, setPosition] = useState(0);
  const [prelandingKey, setPrelandingKey] = useState("");
  const [worldwide, setWorldwide] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    const { data } = await supabase.from('web_results').select('*').order('web_result_page').order('position');
    if (data) setResults(data);
  };

  const handleSave = async () => {
    if (!title || !originalLink) {
      toast({ title: "Error", description: "Title and link are required", variant: "destructive" });
      return;
    }

    const payload = {
      title,
      description: description || null,
      original_link: originalLink,
      logo_url: logoUrl || null,
      web_result_page: webResultPage,
      position,
      prelanding_key: prelandingKey || null,
      worldwide,
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
    setWebResultPage(result.web_result_page);
    setPosition(result.position);
    setPrelandingKey(result.prelanding_key || "");
    setWorldwide(result.worldwide);
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
    setWebResultPage(1);
    setPosition(0);
    setPrelandingKey("");
    setWorldwide(true);
    setIsActive(true);
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
            <label className="text-sm text-muted-foreground mb-2 block">Pre-Landing Key</label>
            <Input
              value={prelandingKey}
              onChange={(e) => setPrelandingKey(e.target.value)}
              placeholder="Leave empty for direct link"
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Web Result Page</label>
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
              onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={worldwide} onCheckedChange={setWorldwide} />
              <label className="text-sm text-muted-foreground">Worldwide</label>
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
                    Page: {result.web_result_page} | Pos: {result.position}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
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
    </div>
  );
};

export default WebResultsTab;
