import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession, getDeviceType } from "@/hooks/useSession";
import { ArrowRight } from "lucide-react";

interface LandingContent {
  title: string;
  description: string;
}

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

const Landing = () => {
  const navigate = useNavigate();
  const sessionId = useSession();
  const [content, setContent] = useState<LandingContent>({ title: '', description: '' });
  const [searches, setSearches] = useState<RelatedSearch[]>([]);

  useEffect(() => {
    fetchContent();
    fetchSearches();
    if (sessionId) initSession();
  }, [sessionId]);

  const fetchContent = async () => {
    const { data } = await supabase.from('landing_content').select('*').limit(1).maybeSingle();
    if (data) setContent(data);
  };

  const fetchSearches = async () => {
    // Fetch 4 active related searches with different web_result_pages
    const { data } = await supabase
      .from('related_searches')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(4);
    
    console.log("Fetched searches for landing:", data);
    
    // Assign different web result pages (1, 2, 3, 4) to each search
    if (data) {
      const searchesWithPages = data.map((search, index) => ({
        ...search,
        web_result_page: index + 1
      }));
      setSearches(searchesWithPages);
    }
  };

  const initSession = async () => {
    const deviceType = getDeviceType();
    await supabase.from('sessions').upsert({
      session_id: sessionId,
      device_type: deviceType,
      user_agent: navigator.userAgent,
      last_activity: new Date().toISOString()
    }, { onConflict: 'session_id' });
  };

  const handleSearchClick = async (search: RelatedSearch) => {
    // Track click
    await supabase.from('click_tracking').insert({
      session_id: sessionId,
      related_search_id: search.id,
      click_type: 'related_search',
      device_type: getDeviceType()
    });

    navigate(`/webresult/${search.web_result_page}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="py-4 text-center">
        <h1 className="text-2xl font-bold text-primary">Minglemoody</h1>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">{content.title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{content.description}</p>
        </div>

        {searches.length > 0 && (
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center mb-4">Related Searches</h3>
            <div className="flex flex-col gap-2">
              {searches.map((search, index) => (
                <button
                  key={search.id}
                  onClick={() => handleSearchClick(search)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-md border transition-all text-left ${
                    index === 0 
                      ? 'bg-primary/20 border-primary text-primary hover:bg-primary/30' 
                      : 'bg-secondary/30 border-border text-primary hover:bg-secondary/50'
                  }`}
                >
                  <span className="text-sm">{search.title || search.search_text}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        )}

        {searches.length === 0 && (
          <div className="text-center text-muted-foreground">
            <p>No searches available. Add some in the admin panel.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Landing;
