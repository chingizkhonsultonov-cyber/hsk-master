"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";

/** Goes one level up: lesson → lessons, level → main page. Always the same place, wherever you came from. */
export function BackButton({ parent }: { parent: string }) {
  const { t } = useI18n();
  return (
    <Link href={parent} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-semibold hover:border-muted">
      <span aria-hidden="true">←</span> {t.common.back}
    </Link>
  );
}
