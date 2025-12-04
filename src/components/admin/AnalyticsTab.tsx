import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsData {
  sessions: number;
  pageViews: number;
  uniquePages: number;
  totalClicks: number;
}

const AnalyticsTab = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    sessions: 0,
    pageViews: 0,
    uniquePages: 0,
    totalClicks: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Get total sessions
    const { count: sessionsCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });

    // Get total clicks
    const { count: clicksCount } = await supabase
      .from('click_tracking')
      .select('*', { count: 'exact', head: true });

    // Get unique pages visited (related search clicks)
    const { data: pageClicks } = await supabase
      .from('click_tracking')
      .select('related_search_id')
      .eq('click_type', 'related_search');

    const uniquePages = new Set(pageClicks?.map(c => c.related_search_id).filter(Boolean)).size;

    setAnalytics({
      sessions: sessionsCount || 0,
      pageViews: clicksCount || 0,
      uniquePages,
      totalClicks: clicksCount || 0
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{analytics.sessions}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{analytics.pageViews}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Unique Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{analytics.uniquePages}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{analytics.totalClicks}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsTab;
