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
    const { webResultTitle, webResultDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating prelanding content for:", webResultTitle);

    // Generate text content
    const textPrompt = `Generate compelling pre-landing page content for an email capture page. The page is related to: "${webResultTitle}"${webResultDescription ? ` - ${webResultDescription}` : ''}.

Generate the following fields in JSON format:
- headline: A compelling, attention-grabbing headline (max 60 characters)
- subtitle: A supporting subtitle that adds context (max 100 characters)
- description: A brief description explaining the value proposition (max 200 characters)
- redirect_description: A short text like "You will be redirected to..." (max 50 characters)

Return ONLY valid JSON with these exact keys: headline, subtitle, description, redirect_description`;

    const textResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a marketing copywriter. Generate compelling pre-landing page content. Return ONLY valid JSON, no markdown or code blocks." },
          { role: "user", content: textPrompt }
        ],
      }),
    });

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      console.error("AI text gateway error:", textResponse.status, errorText);
      throw new Error(`AI gateway error: ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    const textContent = textData.choices?.[0]?.message?.content;
    
    console.log("Raw text AI response:", textContent);

    // Parse the JSON from the response
    let parsedContent;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI response");
    }

    // Generate image
    console.log("Generating main image...");
    const imagePrompt = `Create a professional, modern hero image for a landing page about: "${webResultTitle}". The image should be clean, visually appealing, and suitable for a business/marketing context. No text in the image.`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          { role: "user", content: imagePrompt }
        ],
        modalities: ["image", "text"]
      }),
    });

    let mainImageUrl = null;
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (generatedImage) {
        mainImageUrl = generatedImage;
        console.log("Image generated successfully");
      }
    } else {
      console.error("Image generation failed:", await imageResponse.text());
    }

    return new Response(JSON.stringify({ ...parsedContent, main_image_url: mainImageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error("Error in generate-prelanding-content:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
