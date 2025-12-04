import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Eye, MousePointer, Search, Link } from "lucide-react";

interface AnalyticsData {
  sessions: number;
  pageViews: number;
  totalClicks: number;
  searchClicks: number;
  resultClicks: number;
}

interface SessionData {
  session_id: string;
  ip_address: string | null;
  country: string | null;
  source: string | null;
  device_type: string | null;
  last_activity: string | null;
  pageViews: number;
  clicks: number;
  searchClicks: number;
  resultClicks: number;
}

const AnalyticsTab = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    sessions: 0,
    pageViews: 0,
    totalClicks: 0,
    searchClicks: 0,
    resultClicks: 0
  });
  const [sessionData, setSessionData] = useState<SessionData[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Get total sessions
    const { count: sessionsCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });

    // Get all clicks
    const { data: allClicks } = await supabase
      .from('click_tracking')
      .select('*');

    const searchClicks = allClicks?.filter(c => c.click_type === 'related_search').length || 0;
    const resultClicks = allClicks?.filter(c => c.click_type === 'web_result').length || 0;

    setAnalytics({
      sessions: sessionsCount || 0,
      pageViews: allClicks?.length || 0,
      totalClicks: allClicks?.length || 0,
      searchClicks,
      resultClicks
    });

    // Fetch session details
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .order('last_activity', { ascending: false })
      .limit(50);

    if (sessions) {
      const sessionDetails: SessionData[] = await Promise.all(
        sessions.map(async (session) => {
          const { data: clicks } = await supabase
            .from('click_tracking')
            .select('*')
            .eq('session_id', session.session_id);

          return {
            session_id: session.session_id,
            ip_address: session.ip_address,
            country: session.country,
            source: session.source,
            device_type: session.device_type,
            last_activity: session.last_activity,
            pageViews: clicks?.length || 0,
            clicks: clicks?.length || 0,
            searchClicks: clicks?.filter(c => c.click_type === 'related_search').length || 0,
            resultClicks: clicks?.filter(c => c.click_type === 'web_result').length || 0
          };
        })
      );
      setSessionData(sessionDetails);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{analytics.sessions}</p>
              <p className="text-sm text-muted-foreground">Sessions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Eye className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{analytics.pageViews}</p>
              <p className="text-sm text-muted-foreground">Page Views</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <MousePointer className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{analytics.totalClicks}</p>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Search className="h-8 w-8 text-cyan-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{analytics.searchClicks}</p>
              <p className="text-sm text-muted-foreground">Search Clicks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Link className="h-8 w-8 text-pink-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{analytics.resultClicks}</p>
              <p className="text-sm text-muted-foreground">Result Clicks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Analytics Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-primary mb-4">Session Analytics</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Page Views</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Searches</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionData.map((session) => (
                  <TableRow key={session.session_id}>
                    <TableCell className="font-mono text-xs">{session.session_id.slice(0, 12)}...</TableCell>
                    <TableCell>{session.ip_address || '-'}</TableCell>
                    <TableCell>
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                        {session.country || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                        {session.source || 'direct'}
                      </span>
                    </TableCell>
                    <TableCell>{session.device_type || '-'}</TableCell>
                    <TableCell>{session.pageViews}</TableCell>
                    <TableCell>{session.clicks}</TableCell>
                    <TableCell>
                      <span className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded text-xs">
                        {session.searchClicks}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="bg-pink-500/20 text-pink-400 px-2 py-1 rounded text-xs">
                        {session.resultClicks}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {session.last_activity ? new Date(session.last_activity).toLocaleString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
