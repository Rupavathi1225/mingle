import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LandingContentTab from "@/components/admin/LandingContentTab";
import RelatedSearchesTab from "@/components/admin/RelatedSearchesTab";
import WebResultsTab from "@/components/admin/WebResultsTab";
import PreLandingsTab from "@/components/admin/PreLandingsTab";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import BlogsTab from "@/components/admin/BlogsTab";

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="py-4 px-6 border-b border-border flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="landing" className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-card border border-border flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="landing">Landing Content</TabsTrigger>
            <TabsTrigger value="searches">Search Buttons</TabsTrigger>
            <TabsTrigger value="results">Web Results</TabsTrigger>
            <TabsTrigger value="prelandings">Pre-Landings</TabsTrigger>
            <TabsTrigger value="blogs">Blogs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="landing">
            <LandingContentTab />
          </TabsContent>
          <TabsContent value="searches">
            <RelatedSearchesTab />
          </TabsContent>
          <TabsContent value="results">
            <WebResultsTab />
          </TabsContent>
          <TabsContent value="prelandings">
            <PreLandingsTab />
          </TabsContent>
          <TabsContent value="blogs">
            <BlogsTab />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
