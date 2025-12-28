import OpenAI from "openai";

export default async (request, context) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ With Netlify AI Gateway enabled, this works WITHOUT API keys.
    // If AI Gateway is not enabled, you can fallback by setting OPENAI_API_KEY in Netlify env vars.
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // optional fallback
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Zaina AI, the friendly assistant for FLM TV. Be helpful, upbeat, and concise (2–5 sentences unless asked for more). If asked about movies/shows, include year + quick summary.",
        },
        { role: "user", content: query },
      ],
      max_tokens: 500,
    });

    const text = completion?.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "AI request failed", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
