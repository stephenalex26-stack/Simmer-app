export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "No API key" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { messages, max_tokens = 8192 } = body;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-non-reasoning",
        max_tokens,
        temperature: 1.0,
        messages: [
          {
            role: "system",
            content: "You are a professional family meal planner. You ALWAYS respond with valid JSON only — no markdown, no backticks, no explanation text before or after the JSON. Your response must start with { and end with }. You know thousands of family-friendly recipes and can suggest meals beyond what the user provides. Every recipe must include exact measurements, temperatures, and cooking times. Format all prep steps and cooking steps as arrays of SHORT individual steps — one task per step, one sentence max. Never combine multiple recipes into one step."
          },
          ...messages
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || "API error " + response.status }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const transformed = {
      content: data.choices?.map(c => ({
        type: "text",
        text: c.message?.content || "",
      })) || [],
    };

    return new Response(JSON.stringify(transformed), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = { path: "/api/generate" };
