// Shared LLM caller with fallback chain: Anthropic → Gemini → template.
// Pattern from Championship Chess. ZERO Lovable dependency.
//
// Usage:
//   const out = await callLLM(
//     [{ role: "user", content: "..." }],
//     300,
//     "Static fallback string",
//     "haiku"
//   );

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type LLMModel = "sonnet" | "haiku";

const ANTHROPIC_MODELS = {
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5-20251001",
};

async function callAnthropic(
  messages: LLMMessage[],
  maxTokens: number,
  model: LLMModel
): Promise<string | null> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return null;

  try {
    const systemMessages = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const nonSystem = messages.filter((m) => m.role !== "system");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODELS[model],
        max_tokens: maxTokens,
        system: systemMessages || undefined,
        messages: nonSystem.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    return typeof text === "string" ? text : null;
  } catch {
    return null;
  }
}

async function callGemini(messages: LLMMessage[], maxTokens: number): Promise<string | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return null;

  try {
    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" ? text : null;
  } catch {
    return null;
  }
}

export async function callLLM(
  messages: LLMMessage[],
  maxTokens: number,
  templateFallback: string,
  model: LLMModel = "haiku"
): Promise<string> {
  const anthropic = await callAnthropic(messages, maxTokens, model);
  if (anthropic) return anthropic;

  const gemini = await callGemini(messages, maxTokens);
  if (gemini) return gemini;

  return templateFallback;
}
