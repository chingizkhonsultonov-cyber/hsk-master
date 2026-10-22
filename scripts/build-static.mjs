// Builds the app as plain files in out/ for hosts without a server, such as GitHub Pages.
// The AI coach route needs a server, so it is set aside during the build and the coach shows as off.
import { execSync } from "node:child_process";
import { renameSync } from "node:fs";

const api = "src/app/api";
const aside = "scripts/.api-aside";
renameSync(api, aside);
try {
  execSync("next build", { stdio: "inherit", env: { ...process.env, STATIC_EXPORT: "1" } });
} finally {
  renameSync(aside, api);
}
