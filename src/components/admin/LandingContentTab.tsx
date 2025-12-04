import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const LandingContentTab = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentId, setContentId] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data } = await supabase.from('landing_content').select('*').limit(1).maybeSingle();
    if (data) {
      setTitle(data.title);
      setDescription(data.description);
      setContentId(data.id);
    }
  };

  const handleSave = async () => {
    if (contentId) {
      await supabase.from('landing_content').update({ title, description }).eq('id', contentId);
    } else {
      await supabase.from('landing_content').insert({ title, description });
    }
    toast({ title: "Success", description: "Landing content saved!" });
  };

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <h2 className="text-xl font-bold text-primary mb-6">Edit Landing Content</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>
        
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-secondary border-border min-h-[100px]"
          />
        </div>

        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default LandingContentTab;
