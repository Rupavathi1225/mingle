import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Tag, Search } from "lucide-react";
import { format } from "date-fns";

interface Blog {
  id: string;
  title: string;
  slug: string;
  author: string | null;
  category: string | null;
  content: string | null;
  featured_image: string | null;
  status: string;
  related_search_id: string | null;
  created_at: string;
}

interface RelatedSearch {
  id: string;
  search_text: string;
  title: string | null;
  web_result_page: number;
}

const Blog = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedSearches, setRelatedSearches] = useState<RelatedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setBlog(data);

    // Fetch related searches that belong to this blog
    const { data: searchesData } = await supabase
      .from("related_searches")
      .select("*")
      .eq("blog_id", data.id)
      .eq("is_active", true)
      .order("display_order");
    
    if (searchesData) {
      setRelatedSearches(searchesData);
    }

    setIsLoading(false);
  };

  const handleRelatedSearchClick = (search: RelatedSearch) => {
    navigate(`/webresult/wr=${search.web_result_page}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Blog Not Found</h1>
        <p className="text-muted-foreground mb-6">The blog you're looking for doesn't exist or isn't published.</p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {blog?.featured_image && (
        <div className="relative w-full h-64 md:h-96">
          <img
            src={blog.featured_image}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {blog?.title}
        </h1>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8">
          {blog?.author && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{blog.author}</span>
            </div>
          )}
          {blog?.category && (
            <div className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              <span>{blog.category}</span>
            </div>
          )}
          {blog?.created_at && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(blog.created_at), "MMMM d, yyyy")}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none mb-8">
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {blog?.content}
          </p>
        </div>

        {/* Related Searches Section */}
        {relatedSearches.length > 0 && (
          <div className="border-t border-border pt-8 mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Search className="h-5 w-5" />
              Related Searches
            </h3>
            <div className="flex flex-wrap gap-3">
              {relatedSearches.map((search) => (
                <Button
                  key={search.id}
                  onClick={() => handleRelatedSearchClick(search)}
                  variant="outline"
                  className="hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {search.title || search.search_text}
                </Button>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default Blog;
