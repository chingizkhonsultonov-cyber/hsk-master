# Built-in "Ask Claude" chat

Until this is set up, the Ask Claude button opens claude.ai in a new tab instead (free for the site owner).

1. Connect Supabase and run `supabase/schema.sql` in the SQL editor (it creates the daily question counter).
2. Deploy this function: `supabase functions deploy ask`.
3. In Supabase → Edge Functions → Secrets, add `ANTHROPIC_API_KEY` (from console.anthropic.com; set a monthly spend limit there).
   Optional: `ALLOWED_ORIGINS` (comma-separated sites allowed to call it; defaults to the GitHub Pages site and localhost), `ASK_MODEL` (default `claude-haiku-5-5`; `claude-sonnet-5-5` gives richer answers at about 20× the cost) and `ASK_DAILY_LIMIT` (default 20 questions per user per day).
4. Rebuild the site with `NEXT_PUBLIC_ASK_CHAT=1` (the Supabase URL and publishable key are already in `scripts/build-static.mjs`) and redeploy. The button then answers inside the site for signed-in users.
