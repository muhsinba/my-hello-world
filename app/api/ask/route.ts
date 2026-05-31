import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(40),
  lang: z.string().optional(),
});

const SYSTEM_PROMPT = `You are "Rule Assistant", an expert assistant on the Rules of Golf for tournament players.

Your expertise:
- The official Rules of Golf as published jointly by the USGA and The R&A (current edition), including all numbered Rules and their interpretations.
- Penalties (stroke, general penalty, disqualification) and how/when they apply.
- Relief procedures: free relief, penalty relief, dropping zones, nearest point of complete relief, abnormal course conditions, penalty areas, unplayable balls, lost ball, out of bounds, provisional balls.
- Stroke play vs. match play differences, including concessions and the order of play.
- The Committee's role, Local Rules, pace of play, and the Model Local Rules.
- Etiquette, customs, and tournament practices.

How to answer:
- Be accurate and practical. When relevant, cite the specific Rule number (e.g., "Rule 14.3" or "Rule 19.2") so the player can verify it.
- Give the player a clear, actionable answer: what they may do, the procedure, and any penalty.
- If a situation is ambiguous, explain the factors that determine the ruling and recommend consulting a Rules Official or the Committee on site, since they have final authority.
- Be concise but complete. Use short paragraphs or bullet points.
- Reply in the same language the player uses (English or Turkish).
- You may answer general golf questions, but if asked about something unrelated to golf, politely steer the conversation back to golf rules and play.
- Never invent Rule numbers. If you are unsure of the exact number, describe the principle without fabricating a citation.`;

type Message = { role: "user" | "assistant"; content: string };

// --- Groq (free, no billing): https://console.groq.com/keys ---
async function askGroq(apiKey: string, messages: Message[]): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1024,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new ProviderError(res.status, "Groq", detail);
  }
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? "").trim();
}

// --- Gemini: https://aistudio.google.com/apikey ---
async function askGemini(apiKey: string, messages: Message[]): Promise<string> {
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new ProviderError(res.status, "Gemini", detail);
  }
  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

class ProviderError extends Error {
  constructor(
    public status: number,
    public provider: string,
    public detail: string
  ) {
    super(`${provider} API error ${status}`);
  }
}

export async function POST(req: NextRequest) {
  // Prefer Groq (genuinely free, no billing); fall back to Gemini if that's what's set.
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (!groqKey && !geminiKey) {
    return NextResponse.json(
      {
        error:
          "The assistant is not configured. Add a free GROQ_API_KEY to .env.local (get one at https://console.groq.com/keys) and restart the dev server.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { messages } = parsed.data;

  try {
    const reply = groqKey
      ? await askGroq(groqKey, messages)
      : await askGemini(geminiKey!, messages);

    if (!reply) {
      return NextResponse.json(
        { error: "The assistant returned an empty answer. Please rephrase your question." },
        { status: 502 }
      );
    }
    return NextResponse.json({ reply });
  } catch (err) {
    if (err instanceof ProviderError) {
      console.error(`${err.provider} API error:`, err.status, err.detail);

      let message = "The assistant could not answer right now. Please try again.";
      if (err.status === 429) {
        message = `The assistant's quota is exhausted on ${err.provider} (rate limit or depleted credits). Try again shortly, or switch providers.`;
      } else if (err.status === 401 || err.status === 403) {
        message = `The ${err.provider} API key looks invalid or unauthorized. Verify the key in .env.local.`;
      } else if (err.status === 400) {
        message = `${err.provider} rejected the request. The API key or model may be misconfigured.`;
      }
      return NextResponse.json({ error: message }, { status: 502 });
    }
    console.error("Ask route failure:", err);
    return NextResponse.json(
      { error: "Could not reach the assistant. Check your connection and try again." },
      { status: 502 }
    );
  }
}
