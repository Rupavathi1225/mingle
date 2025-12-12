import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession, getDeviceType } from "@/hooks/useSession";

interface LandingContent {
  title: string;
  description: string;
}

interface RelatedSearch {
  id: string;
  search_text: string;
  web_result_page: number;
  position: number;
  display_order: number;
  is_active: boolean;
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
    const { data } = await supabase
      .from('related_searches')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (data) setSearches(data);
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

        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-foreground text-center mb-6">Related Searches</h3>
          <div className="flex flex-col gap-3">
            {searches.map((search) => (
              <button
                key={search.id}
                onClick={() => handleSearchClick(search)}
                className="bg-secondary hover:bg-secondary/80 text-foreground px-6 py-4 rounded-lg text-left transition-colors w-full"
              >
                {search.search_text}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
