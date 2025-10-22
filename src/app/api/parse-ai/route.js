export async function POST(req) {
  const { prompt } = await req.json();

  // Use environment variable safely in production
  const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;

  // --- IMPROVED PROMPT ---
  // We've added strict rules and examples to guide the AI.
  const systemPrompt = `
You are a billing data extraction AI.
Extract structured data from the user's spoken text and respond ONLY with a single, valid JSON object — no markdown, no explanations, no text before or after the JSON.

**RULES:**
1. You MUST extract an item name, quantity, and rate for every item.
2. If you cannot find a clear item name for an entry, DO NOT create an item for it.
3. If the text is just a number, a price without an item, or a command like "generate bill", you MUST return an empty "items" array.
4. Combine related information. "Half kilo sugar for 50 rupees" is ONE item, not two.
5. If a rate/price is not mentioned for an item, use 0 as the rate.

**JSON FORMAT:**
{
  "items": [
    { "name": "string", "quantity": number, "rate": number }
  ]
}

**EXAMPLES:**
- User Text: "दो किलो चीनी 50 रुपये प्रति किलो और एक मैगी"
- Your JSON: { "items": [{ "name": "चीनी", "quantity": 2, "rate": 50 }, { "name": "मैगी", "quantity": 1, "rate": 0 }] }

- User Text: "आधा लीटर तेल"
- Your JSON: { "items": [{ "name": "तेल", "quantity": 0.5, "rate": 0 }] }

- User Text: "100 रुपये"
- Your JSON: { "items": [] }

- User Text: "₹2 50"
- Your JSON: { "items": [] }

- User Text: "बस बिल बना दो"
- Your JSON: { "items": [] }

---

**User Text to process:**
"${prompt}"
`;

  // Step 2: Call Gemini API (Upgraded to a more capable model)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        // Adding a generation config to encourage stricter JSON output
        generationConfig: {
            "responseMimeType": "application/json",
        }
      }),
    }
  );

  if (!response.ok) {
    console.error("Gemini API Error:", await response.text());
    return new Response(JSON.stringify({ error: "AI API request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await response.json();
  const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Step 3: Safely parse JSON
  let parsed = { items: [] }; // Default to empty items
  try {
    if (aiText) {
      parsed = JSON.parse(aiText);
    }
  } catch (e) {
    console.error("Failed to parse AI JSON response:", aiText);
    // If parsing fails, we return an empty structure to prevent frontend errors.
    parsed = { error: "Invalid JSON response from AI", items: [] };
  }

  // Step 4: Respond cleanly
  return new Response(JSON.stringify(parsed), {
    headers: { "Content-Type": "application/json" },
  });
}
