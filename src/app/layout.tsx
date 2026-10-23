import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Noto_Serif_SC } from "next/font/google";
import { THEME_BOOT_SCRIPT } from "@/lib/settings";
import { contentSecurityPolicy } from "@/lib/security";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  weight: ["500", "700"],
  variable: "--font-noto-serif-sc",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "HSK Master", template: "%s · HSK Master" },
  description: "HSK 1–6 exam preparation: official word lists, grammar, character writing, listening and speaking.",
  applicationName: "HSK Master",
  appleWebApp: { capable: true, title: "HSK Master", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#101519" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plex.variable} ${notoSerifSC.variable}`}>
      <head>
        {/* GitHub Pages can't send headers, so the static build carries its policy in the page. */}
        {process.env.STATIC_EXPORT && <meta httpEquiv="Content-Security-Policy" content={contentSecurityPolicy()} />}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
