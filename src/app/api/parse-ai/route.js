// ✅ Handle preflight CORS request
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // change to "http://localhost:8100" for local testing
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// ✅ Main POST API handler
export async function POST(req) {
  const { prompt } = await req.json();

  // Use environment variable safely in production
  const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;

  // --- IMPROVED PROMPT ---
  const systemPrompt = `
You are a smart billing AI assistant.
Analyze the user's Hindi speech and detect their intent.

You must always return valid JSON in this exact format:
{
  "intent": "add_item" | "delete_item" | "update_item" | "generate_bill" | "other",
  "items": [
    { "name": "string", "quantity": number, "rate": number }
  ]
}

### Rules:
1. If the user describes items to add (e.g. "दो किलो चीनी 50 रुपये") → intent = "add_item".
2. If the user says to remove something (e.g. "ये चावल हटा दो") → intent = "delete_item".
3. If the user says to change price/quantity (e.g. "चीनी का रेट 60 कर दो") → intent = "update_item".
4. If the user says to make or generate the bill (e.g. "बिल बना दो", "generate bill", "invoice निकाल दो") → intent = "generate_bill".
5. Otherwise → intent = "other".
6. Always return a valid JSON object — no markdown, no explanations.

### Examples:
- "दो किलो चीनी 50 रुपये" → {"intent": "add_item", "items": [{"name": "चीनी", "quantity": 2, "rate": 50}]}
- "ये चावल हटा दो" → {"intent": "delete_item", "items": [{"name": "चावल"}]}
- "तेल का रेट 60 कर दो" → {"intent": "update_item", "items": [{"name": "तेल", "rate": 60}]}
- "बिल बना दो" → {"intent": "generate_bill", "items": []}
- "कुछ नहीं" → {"intent": "other", "items": []}

### User Text:
"${prompt}"
`;

  // --- CORS Headers ---
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // use your frontend origin in production
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini API Error:", await response.text());
      return new Response(JSON.stringify({ error: "AI API request failed" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const result = await response.json();
    const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Step 3: Safely parse JSON
    let parsed = { intent: "other", items: [] }; // Default fallback
    try {
      if (aiText) parsed = JSON.parse(aiText);
    } catch (e) {
      console.error("Failed to parse AI JSON response:", aiText);
      parsed = { error: "Invalid JSON response from AI", intent: "other", items: [] };
    }

    // Step 4: Respond cleanly
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
