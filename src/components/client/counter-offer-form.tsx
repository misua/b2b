"use client";

import { useActionState, useRef, useEffect } from "react";
import { submitCounterOffer } from "@/actions/quotation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CounterOfferState } from "@/actions/quotation";

interface CounterOfferFormProps {
  quotationId: string;
  isLocked: boolean; // true when negotiationStatus === "COUNTER_OFFERED"
}

export function CounterOfferForm({ quotationId, isLocked }: CounterOfferFormProps) {
  const [state, formAction, isPending] = useActionState<CounterOfferState, FormData>(
    submitCounterOffer,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  if (isLocked) {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
        <span className="text-xl shrink-0">⏳</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">Waiting for admin response</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Your counter-offer has been submitted. The admin will review and revise the
            quotation or respond shortly.
          </p>
        </div>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2">
        <span className="text-lg">✓</span>
        <p className="text-sm font-medium text-green-800">
          Counter-offer submitted. Waiting for admin to respond.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="quotationId" value={quotationId} />

      <div className="space-y-1.5">
        <Label htmlFor="counter-content" className="text-sm font-medium">
          Your message <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="counter-content"
          name="content"
          rows={3}
          placeholder="e.g. We have a budget of ₱2,800. Can you work within this?"
          disabled={isPending}
          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none transition-colors ${
            state?.errors?.content ? "border-destructive" : "border-input"
          }`}
        />
        {state?.errors?.content && (
          <p className="text-xs text-destructive">{state.errors.content[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="counter-price" className="text-sm font-medium">
          Target price{" "}
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
          <Input
            id="counter-price"
            name="targetPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 2800.00"
            disabled={isPending}
            className={`pl-7 ${state?.errors?.targetPrice ? "border-destructive" : ""}`}
          />
        </div>
        {state?.errors?.targetPrice && (
          <p className="text-xs text-destructive">{state.errors.targetPrice[0]}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter your desired total price if you have a specific budget in mind.
        </p>
      </div>

      {state?.message && (
        <p className="text-xs text-destructive">{state.message}</p>
      )}

      <Button type="submit" variant="outline" disabled={isPending} className="w-full">
        {isPending ? "Submitting…" : "Submit Counter-Offer"}
      </Button>
    </form>
  );
}
