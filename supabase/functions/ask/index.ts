// "Ask Claude" chat for HSK Master, deployed as a Supabase Edge Function.
// Secrets (Supabase → Edge Functions → Secrets): ANTHROPIC_API_KEY (required), ASK_MODEL, ASK_DAILY_LIMIT (optional).
// Supabase checks the caller's sign-in token before this code runs, so only signed-in users can ask.
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = Deno.env.get("ASK_MODEL") || "claude-haiku-5-5";
const DAILY_LIMIT = Number(Deno.env.get("ASK_DAILY_LIMIT") || 20);
const MAX_TURNS = 20;
const MAX_CHARS = 2000;

const MAX_BODY = 60_000;
// Only the site itself may call the function from a browser (ALLOWED_ORIGINS, comma-separated, overrides).
const ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "https://chingizkhonsultonov-cyber.github.io,http://localhost:3000").split(",").map((s) => s.trim());

let cors: Record<string, string> = {};
const corsFor = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  return {
    "access-control-allow-origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
    "access-control-allow-headers": "authorization, content-type, apikey, x-client-info",
    "access-control-allow-methods": "POST, OPTIONS",
    vary: "origin",
  };
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

const system = (locale: string, level: number | null, page: string) => `You are the built-in tutor of HSK Master, a website for learning Chinese for the HSK 3.0 (2025) exams, levels 1–6 and 7–9.
Answer the learner's questions about Chinese: grammar, words, characters, pronunciation and tones, the HSK and HSKK exams, and how to study. You may also help with how to use the site.
Reply in ${locale === "ru" ? "Russian" : "English"} unless the learner writes in another language. Write Chinese in simplified characters, and give pinyin with tone marks and a translation for every Chinese example.
${level ? `The learner is studying HSK ${level === 7 ? "7–9" : level}. Keep examples within that level's vocabulary where you can.` : ""}
They are on this page of the site: ${page}.
Be clear and concise: short paragraphs or a short list, a few good examples rather than many. Write plain text with no Markdown (no **, # or tables); use line breaks, and • for list items. If a question has nothing to do with Chinese or the site, say briefly that you can only help with learning Chinese.`;

type Turn = { role: "user" | "assistant"; content: unknown };

Deno.serve(async (req) => {
  cors = corsFor(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "not_configured" }, 503);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  const { data: auth } = await admin.auth.getUser(token);
  if (!auth.user) return json({ error: "sign_in" }, 401);

  let body: { messages?: Turn[]; locale?: string; level?: number | null; page?: string };
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (!Array.isArray(body.messages) || body.messages.some((m) => !m || (m.role !== "user" && m.role !== "assistant"))) return json({ error: "bad_request" }, 400);
  const messages = body.messages.slice(-MAX_TURNS);
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || typeof last.content !== "string" || !last.content.trim() || last.content.length > MAX_CHARS) {
    return json({ error: "bad_request" }, 400);
  }
  // The window must start on a user turn.
  while (messages.length && messages[0].role !== "user") messages.shift();

  const { data: allowed } = await admin.rpc("ask_bump", { uid: auth.user.id, cap: DAILY_LIMIT });
  if (allowed === false) return json({ error: "limit" }, 429);

  try {
    const client = new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low" },
      system: system(body.locale === "ru" ? "ru" : "en", typeof body.level === "number" ? body.level : null, String(body.page || "/").slice(0, 200)),
      messages: messages as Anthropic.MessageParam[],
    });
    if (res.stop_reason === "refusal") return json({ error: "refusal" }, 200);
    const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
    // `content` goes back to the browser unchanged so the next turn can replay it exactly.
    return json({ text, content: res.content });
  } catch (e) {
    console.error(e);
    return json({ error: "upstream" }, 502);
  }
});
