import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Save } from "lucide-react";

interface Prelanding {
  id: string;
  key: string;
  logo_url: string | null;
  main_image_url: string | null;
  headline: string;
  subtitle: string | null;
  description: string | null;
  redirect_description: string | null;
  is_active: boolean;
}

interface WebResult {
  id: string;
  title: string;
}

const PreLandingsTab = () => {
  const [prelandings, setPrelandings] = useState<Prelanding[]>([]);
  const [webResults, setWebResults] = useState<WebResult[]>([]);
  const [selectedWebResult, setSelectedWebResult] = useState("");
  const [key, setKey] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [redirectDescription, setRedirectDescription] = useState("You will be redirected to...");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrelandings();
    fetchWebResults();
  }, []);

  const fetchWebResults = async () => {
    const { data } = await supabase.from('web_results').select('id, title').order('title');
    if (data) setWebResults(data);
  };

  const fetchPrelandings = async () => {
    const { data } = await supabase.from('prelandings').select('*').order('created_at', { ascending: false });
    if (data) setPrelandings(data);
  };

  const handleSave = async () => {
    if (!key || !headline) {
      toast({ title: "Error", description: "Key and headline are required", variant: "destructive" });
      return;
    }

    const payload = {
      key,
      logo_url: logoUrl || null,
      main_image_url: mainImageUrl || null,
      headline,
      subtitle: subtitle || null,
      description: description || null,
      redirect_description: redirectDescription || null,
      is_active: isActive
    };

    if (editingId) {
      await supabase.from('prelandings').update(payload).eq('id', editingId);
      toast({ title: "Success", description: "Pre-landing updated!" });
    } else {
      const { error } = await supabase.from('prelandings').insert(payload);
      if (error?.code === '23505') {
        toast({ title: "Error", description: "Key already exists", variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Pre-landing created!" });
    }

    resetForm();
    fetchPrelandings();
  };

  const handleEdit = (prelanding: Prelanding) => {
    setEditingId(prelanding.id);
    setKey(prelanding.key);
    setLogoUrl(prelanding.logo_url || "");
    setMainImageUrl(prelanding.main_image_url || "");
    setHeadline(prelanding.headline);
    setSubtitle(prelanding.subtitle || "");
    setDescription(prelanding.description || "");
    setRedirectDescription(prelanding.redirect_description || "");
    setIsActive(prelanding.is_active);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('prelandings').delete().eq('id', id);
    toast({ title: "Success", description: "Pre-landing deleted!" });
    fetchPrelandings();
  };

  const resetForm = () => {
    setEditingId(null);
    setKey("");
    setLogoUrl("");
    setMainImageUrl("");
    setHeadline("");
    setSubtitle("");
    setDescription("");
    setRedirectDescription("You will be redirected to...");
    setIsActive(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-bold text-primary mb-6">
          {editingId ? "Edit Pre-Landing" : "Add Pre-Landing"}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground mb-2 block">Select Web Result</label>
            <Select value={selectedWebResult} onValueChange={setSelectedWebResult}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {webResults.map((wr) => (
                  <SelectItem key={wr.id} value={wr.id}>{wr.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Headline *</label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Key (unique identifier)</label>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g., offer1, promo2024"
              className="bg-secondary border-border"
              disabled={!!editingId}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground mb-2 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border"
              rows={4}
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
            <label className="text-sm text-muted-foreground mb-2 block">Main Image URL</label>
            <Input
              value={mainImageUrl}
              onChange={(e) => setMainImageUrl(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Email Placeholder</label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Enter your email"
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">CTA Button Text</label>
            <Input
              value={redirectDescription}
              onChange={(e) => setRedirectDescription(e.target.value)}
              placeholder="Get Started"
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <label className="text-sm text-muted-foreground">Active</label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} className="bg-primary">
            <Save className="h-4 w-4 mr-2" />
            {editingId ? "Update Pre-Landing" : "Save Pre-Landing"}
          </Button>
          {editingId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-bold text-primary mb-6">Existing Pre-Landings</h2>
        
        <div className="space-y-3">
          {prelandings.map((prelanding) => (
            <div key={prelanding.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div>
                <p className="font-medium text-foreground">{prelanding.headline}</p>
                <p className="text-sm text-muted-foreground">Key: {prelanding.key}</p>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" onClick={() => handleEdit(prelanding)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="destructive" onClick={() => handleDelete(prelanding.id)}>
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

export default PreLandingsTab;
