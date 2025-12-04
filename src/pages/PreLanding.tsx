import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface PrelandingData {
  logo_url: string | null;
  main_image_url: string | null;
  headline: string;
  subtitle: string | null;
  description: string | null;
  redirect_description: string | null;
}

const PreLanding = () => {
  const { key } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<PrelandingData | null>(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '';
  const resultId = searchParams.get('rid') || '';

  useEffect(() => {
    if (key) fetchPrelanding();
  }, [key]);

  const fetchPrelanding = async () => {
    const { data: prelanding } = await supabase
      .from('prelandings')
      .select('*')
      .eq('key', key)
      .eq('is_active', true)
      .maybeSingle();
    if (prelanding) setData(prelanding);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    await supabase.from('email_captures').insert({
      email,
      prelanding_key: key,
      web_result_id: resultId || null
    });

    toast({ title: "Success", description: "Thank you! Redirecting..." });
    
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500);
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-xl p-8 shadow-xl">
        {data.logo_url && (
          <div className="flex justify-center mb-6">
            <img src={data.logo_url} alt="Logo" className="h-16 object-contain" />
          </div>
        )}

        {data.main_image_url && (
          <div className="mb-6">
            <img src={data.main_image_url} alt="Main" className="w-full rounded-lg" />
          </div>
        )}

        <h1 className="text-2xl font-bold text-foreground text-center mb-2">{data.headline}</h1>
        
        {data.subtitle && (
          <p className="text-muted-foreground text-center mb-4">{data.subtitle}</p>
        )}

        {data.description && (
          <p className="text-sm text-muted-foreground text-center mb-6">{data.description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-secondary border-border"
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Continue"}
          </Button>
        </form>

        {data.redirect_description && (
          <p className="text-xs text-muted-foreground text-center mt-4">{data.redirect_description}</p>
        )}
      </div>
    </div>
  );
};

export default PreLanding;
