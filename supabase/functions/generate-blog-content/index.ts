import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, slug } = await req.json();
    
    if (!title) {
      return new Response(JSON.stringify({ error: "Title is required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating content for blog: "${title}" (slug: ${slug})`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional blog content writer. Generate content and related searches based on the title.

CRITICAL FORMAT - Return ONLY valid JSON, no markdown, no code blocks:
{
  "content": "Short 50-word blog content here. Simple, tight, direct.",
  "relatedSearches": ["search phrase 1", "search phrase 2", "search phrase 3", "search phrase 4", "search phrase 5", "search phrase 6"]
}

Guidelines:
- content: Exactly 50 words, simple, tight, direct writing
- relatedSearches: 4-6 search phrases, each EXACTLY 5 words, related to the blog topic
- Return ONLY the JSON object, nothing else`
          },
          {
            role: "user",
            content: `Generate for blog title: "${title}"`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to generate content" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    let generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      console.error("No content in response:", data);
      return new Response(JSON.stringify({ error: "No content generated" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean up the response - remove markdown code blocks if present
    generatedText = generatedText.trim();
    if (generatedText.startsWith("```json")) {
      generatedText = generatedText.slice(7);
    } else if (generatedText.startsWith("```")) {
      generatedText = generatedText.slice(3);
    }
    if (generatedText.endsWith("```")) {
      generatedText = generatedText.slice(0, -3);
    }
    generatedText = generatedText.trim();

    let parsed;
    try {
      parsed = JSON.parse(generatedText);
    } catch (e) {
      console.error("Failed to parse AI response:", generatedText);
      return new Response(JSON.stringify({ error: "Failed to parse generated content" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Content generated successfully");

    return new Response(JSON.stringify({ 
      content: parsed.content || "", 
      relatedSearches: parsed.relatedSearches || [] 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error generating blog content:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
