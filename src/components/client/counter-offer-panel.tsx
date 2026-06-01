"use client";

import { useState } from "react";
import { CounterOfferForm } from "./counter-offer-form";

interface CounterOfferPanelProps {
  quotationId: string;
  isLocked: boolean;
}

export function CounterOfferPanel({ quotationId, isLocked }: CounterOfferPanelProps) {
  const [open, setOpen] = useState(false);

  if (isLocked) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-center">
        <p className="text-xs font-medium text-amber-700">
          ⏳ Counter-offer submitted — awaiting admin response
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Visible outlined secondary button — always shown */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full h-10 rounded-lg border-2 text-sm font-semibold transition-all ${
          open
            ? "border-primary/40 bg-primary/5 text-primary"
            : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/40"
        }`}
      >
        {open ? "✕ Cancel counter-offer" : "💬 Submit a Counter-Offer"}
      </button>

      {/* Expandable form */}
      {open && (
        <div className="rounded-xl border bg-muted/20 p-4 space-y-1">
          <p className="text-xs text-muted-foreground mb-3">
            Tell us your target price. The admin will review and respond with a
            revised quotation.
          </p>
          <CounterOfferForm
            quotationId={quotationId}
            isLocked={false}
          />
        </div>
      )}
    </div>
  );
}
