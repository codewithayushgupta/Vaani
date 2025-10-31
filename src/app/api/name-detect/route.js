export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // or "http://localhost:8100"
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req) {
  const { prompt } = await req.json();
  const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;

  // --- CORS Headers ---
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // change to "http://localhost:8100" if needed
    "Content-Type": "application/json",
  };

  // --- AI Prompt ---
  const systemPrompt = `
You are an AI assistant that extracts a customer's name from a given text.
Respond ONLY with a single, valid JSON object in the format: { "name": "string" }.
- If a name is found, place it in the "name" field.
- If no name is found, the "name" field MUST be an empty string "".
- Do not include any explanation, markdown, or extra text.

**EXAMPLES:**
- User Text: "ग्राहक का नाम रमेश कुमार है"
- Your JSON: { "name": "रमेश कुमार" }

- User Text: "नाम सूरज है"
- Your JSON: { "name": "सूरज" }

- User Text: "चलो शुरू करो"
- Your JSON: { "name": "" }

---

**User Text to process:**
"${prompt}"
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" },
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
    let parsed = { name: "" };

    try {
      if (aiText) parsed = JSON.parse(aiText);
    } catch (e) {
      console.error("Failed to parse AI JSON response:", aiText);
      parsed = { name: "" };
    }

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
