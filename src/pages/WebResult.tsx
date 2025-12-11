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
  is_sponsored: boolean | null;
}

const WebResult = () => {
  const { wr } = useParams();
  const navigate = useNavigate();
  const sessionId = useSession();
  const [sponsoredResults, setSponsoredResults] = useState<WebResult[]>([]);
  const [normalResults, setNormalResults] = useState<WebResult[]>([]);
  const pageNumber = wr?.includes('=') ? parseInt(wr.split('=')[1]) || 1 : parseInt(wr || '1') || 1;

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
    if (data) {
      setSponsoredResults(data.filter(r => r.is_sponsored));
      setNormalResults(data.filter(r => !r.is_sponsored));
    }
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

  const getMaskedLink = (index: number) => {
    return `minglemoody.lid=${index + 1}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="py-4 text-center border-b border-border">
        <h1 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => navigate('/landing')}>
          Minglemoody
        </h1>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Sponsored Results Section */}
        {sponsoredResults.length > 0 && (
          <div className="bg-slate-900 rounded-lg p-6 mb-8">
            <div className="space-y-8">
              {sponsoredResults.map((result, index) => (
                <div key={result.id} className="space-y-2">
                  {/* Title first */}
                  <h3 
                    className="text-blue-400 hover:underline font-medium text-lg cursor-pointer"
                    style={{ fontVariant: 'small-caps' }}
                    onClick={() => handleResultClick(result)}
                  >
                    {result.title}
                  </h3>
                  
                  {/* Sponsored label and masked link below title */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Sponsored</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-400">{getMaskedLink(index)}</span>
                    <span className="text-gray-400 cursor-pointer">⋮</span>
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-400 text-sm italic">{result.description}</p>
                  
                  {/* Visit Website Button */}
                  <button
                    onClick={() => handleResultClick(result)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded transition-colors flex items-center gap-2 mt-2"
                  >
                    <span className="text-lg">➤</span>
                    Visit Website
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Normal Web Results Section */}
        {normalResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-muted-foreground text-sm font-medium">Web Results</h2>
            {normalResults.map((result) => (
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
          </div>
        )}

        {sponsoredResults.length === 0 && normalResults.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No results found for this page.</p>
        )}
      </main>
    </div>
  );
};

export default WebResult;
