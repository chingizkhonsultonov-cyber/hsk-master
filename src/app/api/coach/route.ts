import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

/**
 * AI speaking coach. The page sends what the learner was asked to say (or the question they
 * answered) and what speech recognition heard; Claude returns structured feedback.
 * Needs ANTHROPIC_API_KEY on the server. When Supabase is configured, only signed-in users may call it.
 */
export const dynamic = "force-dynamic";

const MODEL = process.env.COACH_MODEL || "claude-opus-5-5";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["score", "summary", "issues", "corrected", "pinyin", "modelAnswer"],
  properties: {
    score: { type: "integer", description: "0–100 overall for this attempt" },
    summary: { type: "string", description: "Two or three sentences of feedback in the explanation language" },
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "heard", "expected", "tip"],
        properties: {
          kind: { type: "string", enum: ["pronunciation", "tone", "grammar", "vocabulary", "missing", "extra"] },
          heard: { type: "string" },
          expected: { type: "string" },
          tip: { type: "string", description: "One short tip in the explanation language" },
        },
      },
    },
    corrected: { type: "string", description: "The learner's attempt rewritten as correct, natural Chinese at their level" },
    pinyin: { type: "string", description: "Pinyin with tone marks for `corrected`" },
    modelAnswer: { type: "string", description: "For question mode, a short model answer at the learner's level; otherwise empty" },
  },
} as const;

const SYSTEM = `You are a patient Mandarin speaking coach preparing a learner for the HSK and HSKK exams.
You receive what the learner was asked to say, or the question they answered, plus the text that browser speech recognition produced from their recording. You cannot hear the audio: infer pronunciation and tone problems only from recognition errors (a character recognised as a different character with a similar sound usually means a tone or initial/final error; mention the likely tone confusion with pinyin). Do not invent problems the transcript gives no evidence for.
Judge grammar and word choice against the learner's HSK level, and keep every Chinese example within that level's vocabulary.
Write "summary" and every "tip" in the explanation language you are given. Keep feedback specific and encouraging; list at most five issues, most important first. Score 90+ only when the attempt is complete and correct.`;

type Body = { level: number; locale: "en" | "ru"; mode: "read" | "repeat" | "answer"; target: string; heard: string };

const hits = new Map<string, number[]>();
/** Best-effort limit for deployments without sign-in: 40 requests per hour per address. */
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 40;
}

export async function GET() {
  return Response.json({ enabled: !!process.env.ANTHROPIC_API_KEY, signIn: !!(SUPABASE_URL && SUPABASE_ANON) });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "not-configured" }, { status: 503 });

  if (SUPABASE_URL && SUPABASE_ANON) {
    const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
    const { data } = token ? await createClient(SUPABASE_URL, SUPABASE_ANON).auth.getUser(token) : { data: { user: null } };
    if (!data.user) return Response.json({ error: "sign-in" }, { status: 401 });
  } else if (limited(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local")) {
    return Response.json({ error: "rate-limited" }, { status: 429 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const { level, locale, mode, target, heard } = body;
  if (![1, 2, 3, 4, 5, 6, 7].includes(level) || !["en", "ru"].includes(locale) || !["read", "repeat", "answer"].includes(mode) || typeof target !== "string" || typeof heard !== "string" || target.length > 300 || heard.length > 600) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const task =
    mode === "answer"
      ? `Task: the learner answered this HSKK-style question aloud.\nQuestion: ${target}`
      : `Task: the learner ${mode === "read" ? "read this sentence aloud" : "heard this sentence and repeated it"}.\nTarget: ${target}`;
  const prompt = `HSK level: ${level === 7 ? "7–9" : level}\nExplanation language: ${locale === "ru" ? "Russian" : "English"}\n${task}\nSpeech recognition heard: ${heard || "(nothing)"}`;

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal") return Response.json({ error: "refused" }, { status: 422 });
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return Response.json({ error: "empty" }, { status: 502 });
    return Response.json(JSON.parse(text.text));
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return Response.json({ error: "busy" }, { status: 429 });
    if (error instanceof Anthropic.AuthenticationError) return Response.json({ error: "bad-key" }, { status: 503 });
    if (error instanceof Anthropic.APIError) return Response.json({ error: "api", status: error.status }, { status: 502 });
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
