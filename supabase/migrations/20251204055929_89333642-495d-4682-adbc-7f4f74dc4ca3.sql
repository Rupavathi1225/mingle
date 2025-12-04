
-- Landing content table
CREATE TABLE public.landing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Mingle Moody',
  description TEXT NOT NULL DEFAULT 'Discover the best platforms for connecting, sharing, and engaging with people worldwide.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Related searches table
CREATE TABLE public.related_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_text TEXT NOT NULL,
  title TEXT,
  web_result_page INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Web results table
CREATE TABLE public.web_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  web_result_page INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  original_link TEXT NOT NULL,
  logo_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  prelanding_key TEXT,
  country_codes TEXT[] DEFAULT '{}',
  worldwide BOOLEAN DEFAULT true,
  backlink TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pre-landings table
CREATE TABLE public.prelandings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  main_image_url TEXT,
  headline TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  redirect_description TEXT DEFAULT 'You will be redirected to...',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email captures table
CREATE TABLE public.email_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  prelanding_key TEXT NOT NULL,
  web_result_id UUID REFERENCES public.web_results(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sessions table for tracking
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  country TEXT,
  device_type TEXT,
  user_agent TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Click tracking table
CREATE TABLE public.click_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  link_id UUID REFERENCES public.web_results(id),
  related_search_id UUID REFERENCES public.related_searches(id),
  click_type TEXT NOT NULL, -- 'web_result' or 'related_search'
  ip_address TEXT,
  country TEXT,
  device_type TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Link clicks summary (for unique clicks)
CREATE TABLE public.link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  web_result_id UUID REFERENCES public.web_results(id),
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.related_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prelandings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- Public read policies for frontend
CREATE POLICY "Public read landing_content" ON public.landing_content FOR SELECT USING (true);
CREATE POLICY "Public read related_searches" ON public.related_searches FOR SELECT USING (true);
CREATE POLICY "Public read web_results" ON public.web_results FOR SELECT USING (true);
CREATE POLICY "Public read prelandings" ON public.prelandings FOR SELECT USING (true);
CREATE POLICY "Public insert email_captures" ON public.email_captures FOR INSERT WITH CHECK (true);
CREATE POLICY "Public all sessions" ON public.sessions FOR ALL USING (true);
CREATE POLICY "Public all click_tracking" ON public.click_tracking FOR ALL USING (true);
CREATE POLICY "Public read link_clicks" ON public.link_clicks FOR SELECT USING (true);

-- Admin policies (all operations)
CREATE POLICY "Admin all landing_content" ON public.landing_content FOR ALL USING (true);
CREATE POLICY "Admin all related_searches" ON public.related_searches FOR ALL USING (true);
CREATE POLICY "Admin all web_results" ON public.web_results FOR ALL USING (true);
CREATE POLICY "Admin all prelandings" ON public.prelandings FOR ALL USING (true);
CREATE POLICY "Admin read email_captures" ON public.email_captures FOR SELECT USING (true);
CREATE POLICY "Admin all link_clicks" ON public.link_clicks FOR ALL USING (true);

-- Insert default landing content
INSERT INTO public.landing_content (title, description) VALUES ('Mingle Moody', 'Discover the best platforms for connecting, sharing, and engaging with people worldwide. Whether you''re looking for social connections or professional networking.');

-- Insert sample related searches
INSERT INTO public.related_searches (search_text, title, web_result_page, position, display_order) VALUES
('Top Social Networking Platforms', 'Top Social Networking Platforms', 1, 1, 1),
('Best Community Forums', 'Best Community Forums', 2, 2, 2),
('Dating & Relationship Apps', 'Dating & Relationship Apps', 3, 3, 3),
('Professional Networking Sites', 'Professional Networking Sites', 4, 4, 4),
('Social Media Analytics Tools', 'Social Media Analytics Tools', 5, 5, 5);
