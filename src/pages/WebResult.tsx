import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession, getDeviceType } from "@/hooks/useSession";

interface WebResult {
  id: string;
  title: string;
  description: string;
  original_link: string;
  logo_url: string | null;
  prelanding_key: string | null;
  position: number;
}

const WebResult = () => {
  const { wr } = useParams();
  const navigate = useNavigate();
  const sessionId = useSession();
  const [results, setResults] = useState<WebResult[]>([]);
  const pageNumber = parseInt(wr || '1') || 1;

  useEffect(() => {
    fetchResults(pageNumber);
  }, [pageNumber]);

  const fetchResults = async (page: number) => {
    const { data } = await supabase
      .from('web_results')
      .select('*')
      .eq('web_result_page', page)
      .eq('is_active', true)
      .order('position', { ascending: true });
    if (data) setResults(data);
  };

  const handleResultClick = async (result: WebResult) => {
    // Track click
    await supabase.from('click_tracking').insert({
      session_id: sessionId,
      link_id: result.id,
      click_type: 'web_result',
      device_type: getDeviceType()
    });

    // Update link clicks
    const { data: existing } = await supabase
      .from('link_clicks')
      .select('*')
      .eq('web_result_id', result.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('link_clicks').update({
        total_clicks: existing.total_clicks + 1,
        updated_at: new Date().toISOString()
      }).eq('id', existing.id);
    } else {
      await supabase.from('link_clicks').insert({
        web_result_id: result.id,
        total_clicks: 1,
        unique_clicks: 1
      });
    }

    // Check if prelanding is needed
    if (result.prelanding_key) {
      navigate(`/prelanding/${result.prelanding_key}?redirect=${encodeURIComponent(result.original_link)}&rid=${result.id}`);
    } else {
      window.open(result.original_link, '_blank');
    }
  };

  const getLogoDisplay = (result: WebResult) => {
    if (result.logo_url) {
      return (
        <img src={result.logo_url} alt={result.title} className="w-12 h-12 rounded object-cover" />
      );
    }
    return (
      <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center">
        <span className="text-primary font-bold text-xl">{result.title.charAt(0).toUpperCase()}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="py-4 text-center border-b border-border">
        <h1 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => navigate('/landing')}>
          Minglemoody
        </h1>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.id}
              className="flex items-start gap-4 py-4 cursor-pointer hover:bg-secondary/30 px-4 rounded-lg transition-colors"
              onClick={() => handleResultClick(result)}
            >
              {getLogoDisplay(result)}
              <div className="flex-1">
                <h3 className="text-primary hover:underline font-medium text-lg">{result.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{result.description}</p>
              </div>
            </div>
          ))}

          {results.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No results found for this page.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default WebResult;
