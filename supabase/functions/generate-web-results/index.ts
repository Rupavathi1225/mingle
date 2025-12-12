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
    const { searchText } = await req.json();
    
    if (!searchText) {
      return new Response(JSON.stringify({ error: "Search text is required" }), {
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

    console.log(`Generating web results for: "${searchText}"`);

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
            content: `You are a web results generator. Generate 6 web search results based on the search query.

CRITICAL FORMAT - Return ONLY valid JSON, no markdown, no code blocks:
{
  "results": [
    {
      "title": "Result title (5-8 words)",
      "description": "Short description (15-20 words)",
      "link": "https://example.com/path"
    }
  ]
}

Guidelines:
- Generate exactly 6 results
- Each title should be 5-8 words
- Each description should be 15-20 words, engaging and relevant
- Links should be realistic looking URLs related to the topic
- Results should be diverse and relevant to the search query
- Return ONLY the JSON object, nothing else`
          },
          {
            role: "user",
            content: `Generate web results for search: "${searchText}"`
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
      
      return new Response(JSON.stringify({ error: "Failed to generate results" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    let generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      console.error("No content in response:", data);
      return new Response(JSON.stringify({ error: "No results generated" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean up the response
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
      return new Response(JSON.stringify({ error: "Failed to parse generated results" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Web results generated successfully");

    return new Response(JSON.stringify({ 
      results: parsed.results || [] 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error generating web results:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
