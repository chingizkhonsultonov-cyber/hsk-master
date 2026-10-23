/**
 * Content Security Policy for every page. Scripts, styles, fonts, audio and data come from the site itself;
 * the only outside service is Supabase (accounts, sync and the Ask function).
 * Next.js inlines small boot scripts, so script-src needs 'unsafe-inline'; dev mode also needs 'unsafe-eval'.
 */
export function contentSecurityPolicy({ dev = false, frameAncestors = false } = {}) {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const connect = ["'self'", ...(supabase ? [supabase, supabase.replace(/^https:/, "wss:")] : [])];
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    `connect-src ${connect.join(" ")}${dev ? " ws:" : ""}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // frame-ancestors only works as a real header, not in a <meta> tag.
    ...(frameAncestors ? ["frame-ancestors 'none'"] : []),
  ].join("; ");
}

/** Headers for hosts that can send them (a Node server or Vercel). GitHub Pages gets the CSP as a <meta> tag instead. */
export function securityHeaders(dev: boolean) {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy({ dev, frameAncestors: true }) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  ];
}
