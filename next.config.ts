import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security";

// STATIC_EXPORT=1 builds plain files for hosts without a server, such as GitHub Pages.
// The AI coach needs a server, so it stays off in that build.
const base = process.env.NEXT_PUBLIC_BASE_PATH || undefined;
const dev = process.env.NODE_ENV !== "production";
const nextConfig: NextConfig = process.env.STATIC_EXPORT
  ? { output: "export", basePath: base, trailingSlash: true, poweredByHeader: false }
  : {
      poweredByHeader: false,
      async headers() {
        return [{ source: "/:path*", headers: securityHeaders(dev) }];
      },
    };

export default nextConfig;
