// Builds the app as plain files in out/ for hosts without a server, such as GitHub Pages.
// The AI coach route needs a server, so it is set aside during the build and the coach shows as off.
import { execSync } from "node:child_process";
import { renameSync } from "node:fs";

const api = "src/app/api";
const aside = "scripts/.api-aside";
renameSync(api, aside);
try {
  // Supabase project for accounts and progress sync. The publishable key is meant for browsers (row level
// security limits each user to their own row), so it is fine to keep here; the secret key never is.
const supabase = {
  NEXT_PUBLIC_SUPABASE_URL: "https://umxvlwbrdemrtorwsvey.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_J3Cw7ibNaRmRWuKROJfp6g_vpPh9KOX",
};
execSync("next build", { stdio: "inherit", env: { ...supabase, ...process.env, STATIC_EXPORT: "1" } });
} finally {
  renameSync(aside, api);
}
