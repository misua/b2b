"use client";

import { useState } from "react";
import Link from "next/link";

interface DismissiblePillProps {
  id: string;
  href: string;
  children: React.ReactNode;
}

export function DismissiblePill({ id, href, children }: DismissiblePillProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-center bg-background border rounded-full shadow-sm overflow-hidden">
      {/* Main clickable area */}
      <Link
        href={href}
        className="flex items-center gap-2 text-xs px-3 py-1.5 hover:bg-muted transition-colors"
      >
        {children}
      </Link>

      {/* Dismiss button — separate from the link so clicking × doesn't navigate */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs border-l"
        aria-label={`Dismiss notification ${id}`}
      >
        ✕
      </button>
    </div>
  );
}
