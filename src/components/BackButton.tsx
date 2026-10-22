"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";

// The page the visit started on. From there, Back goes to the parent page instead of leaving the app.
let entry: string | null = null;

/** Returns to the previous page in the app, or to the parent page when the visit started here. */
export function BackButton({ parent }: { parent: string }) {
  const router = useRouter();
  const path = usePathname();
  const { t } = useI18n();
  useEffect(() => {
    entry ??= path;
  }, [path]);
  return (
    <button
      type="button"
      onClick={() => (entry && entry !== path ? router.back() : router.push(parent))}
      className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg border border-line px-3 text-sm font-semibold hover:border-muted"
    >
      <span aria-hidden="true">←</span> {t.common.back}
    </button>
  );
}
