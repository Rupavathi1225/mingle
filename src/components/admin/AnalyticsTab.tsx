import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Eye, MousePointer, Search } from "lucide-react";

interface AnalyticsData {
  sessions: number;
  pageViews: number;
  totalClicks: number;
  searchClicks: number;
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
}

interface RelatedSearchStats {
  id: string;
  search_text: string;
  clickCount: number;
}

interface ClickDetail {
  id: string;
  ip_address: string | null;
  country: string | null;
  device_type: string | null;
  timestamp: string | null;
  session_id: string;
}

const AnalyticsTab = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    sessions: 0,
    pageViews: 0,
    totalClicks: 0,
    searchClicks: 0
  });
  const [sessionData, setSessionData] = useState<SessionData[]>([]);
  const [relatedSearchStats, setRelatedSearchStats] = useState<RelatedSearchStats[]>([]);
  const [showClicksBreakdown, setShowClicksBreakdown] = useState(false);
  const [showSearchBreakdown, setShowSearchBreakdown] = useState(false);
  const [clickDetails, setClickDetails] = useState<ClickDetail[]>([]);
  const [selectedSearchName, setSelectedSearchName] = useState("");

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

    setAnalytics({
      sessions: sessionsCount || 0,
      pageViews: allClicks?.length || 0,
      totalClicks: allClicks?.length || 0,
      searchClicks
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
            searchClicks: clicks?.filter(c => c.click_type === 'related_search').length || 0
          };
        })
      );
      setSessionData(sessionDetails);
    }

    // Fetch related search stats
    const { data: relatedSearches } = await supabase
      .from('related_searches')
      .select('id, search_text');

    if (relatedSearches) {
      const stats: RelatedSearchStats[] = await Promise.all(
        relatedSearches.map(async (search) => {
          const { count } = await supabase
            .from('click_tracking')
            .select('*', { count: 'exact', head: true })
            .eq('related_search_id', search.id);

          return {
            id: search.id,
            search_text: search.search_text,
            clickCount: count || 0
          };
        })
      );
      setRelatedSearchStats(stats.sort((a, b) => b.clickCount - a.clickCount));
    }
  };

  const handleViewClicksBreakdown = async () => {
    const { data } = await supabase
      .from('click_tracking')
      .select('*')
      .order('timestamp', { ascending: false });
    
    setClickDetails(data || []);
    setShowClicksBreakdown(true);
  };

  const handleViewSearchBreakdown = async (search: RelatedSearchStats) => {
    const { data } = await supabase
      .from('click_tracking')
      .select('*')
      .eq('related_search_id', search.id)
      .order('timestamp', { ascending: false });
    
    setClickDetails(data || []);
    setSelectedSearchName(search.search_text);
    setShowSearchBreakdown(true);
  };

  const uniqueIPs = new Set(clickDetails.map(c => c.ip_address).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        <Card className="bg-card border-border cursor-pointer hover:bg-secondary/50" onClick={handleViewClicksBreakdown}>
          <CardContent className="p-4 flex items-center gap-3">
            <MousePointer className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{analytics.totalClicks}</p>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
              <p className="text-xs text-primary">View Breakdown →</p>
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
      </div>

      {/* Related Searches Breakdown */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-primary mb-4">Related Searches Breakdown</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Search Text</TableHead>
                  <TableHead>Total Clicks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedSearchStats.map((search) => (
                  <TableRow key={search.id}>
                    <TableCell className="font-medium">{search.search_text}</TableCell>
                    <TableCell>
                      <span className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded text-xs">
                        {search.clickCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleViewSearchBreakdown(search)}>
                        <Eye className="h-4 w-4 mr-1" /> View Breakdown
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {relatedSearchStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">No related searches found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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

      {/* Clicks Breakdown Dialog */}
      <Dialog open={showClicksBreakdown} onOpenChange={setShowClicksBreakdown}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Total Clicks Breakdown</DialogTitle>
          </DialogHeader>
          <div className="flex gap-4 mb-4">
            <p className="text-sm text-muted-foreground">Total Clicks: <span className="text-foreground font-bold">{clickDetails.length}</span></p>
            <p className="text-sm text-muted-foreground">Unique IPs: <span className="text-foreground font-bold">{uniqueIPs}</span></p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clickDetails.map((click) => (
                <TableRow key={click.id}>
                  <TableCell>{click.ip_address || '-'}</TableCell>
                  <TableCell>{click.country || '-'}</TableCell>
                  <TableCell>{click.device_type || '-'}</TableCell>
                  <TableCell>{click.timestamp ? new Date(click.timestamp).toLocaleString() : '-'}</TableCell>
                </TableRow>
              ))}
              {clickDetails.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No clicks recorded</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Search Breakdown Dialog */}
      <Dialog open={showSearchBreakdown} onOpenChange={setShowSearchBreakdown}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Search Breakdown: {selectedSearchName}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-4 mb-4">
            <p className="text-sm text-muted-foreground">Total Clicks: <span className="text-foreground font-bold">{clickDetails.length}</span></p>
            <p className="text-sm text-muted-foreground">Unique IPs: <span className="text-foreground font-bold">{uniqueIPs}</span></p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clickDetails.map((click) => (
                <TableRow key={click.id}>
                  <TableCell>{click.ip_address || '-'}</TableCell>
                  <TableCell>{click.country || '-'}</TableCell>
                  <TableCell>{click.device_type || '-'}</TableCell>
                  <TableCell>{click.timestamp ? new Date(click.timestamp).toLocaleString() : '-'}</TableCell>
                </TableRow>
              ))}
              {clickDetails.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No clicks recorded</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalyticsTab;
