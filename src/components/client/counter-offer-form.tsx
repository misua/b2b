"use client";

import { useActionState, useRef, useEffect } from "react";
import { submitCounterOffer } from "@/actions/quotation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CounterOfferState } from "@/actions/quotation";

interface CounterOfferFormProps {
  quotationId: string;
  isLocked: boolean;
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
      <p className="text-xs text-center text-amber-600">
        Counter-offer submitted — waiting for admin response.
      </p>
    );
  }

  if (state?.success) {
    return (
      <p className="text-xs text-center text-green-700 font-medium">
        ✓ Counter-offer submitted successfully.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="quotationId" value={quotationId} />

      <div className="space-y-1.5">
        <Label htmlFor="counter-content" className="text-xs font-medium">
          Your message <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="counter-content"
          name="content"
          rows={3}
          placeholder="e.g. Can you do ₱45,000? That's our budget limit."
          disabled={isPending}
          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none ${
            state?.errors?.content ? "border-destructive" : "border-input"
          }`}
        />
        {state?.errors?.content && (
          <p className="text-xs text-destructive">{state.errors.content[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="counter-price" className="text-xs font-medium">
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
            placeholder="e.g. 45000.00"
            disabled={isPending}
            className={`pl-7 h-9 ${state?.errors?.targetPrice ? "border-destructive" : ""}`}
          />
        </div>
      </div>

      {state?.message && (
        <p className="text-xs text-destructive">{state.message}</p>
      )}

      <Button type="submit" variant="outline" size="sm" disabled={isPending} className="w-full">
        {isPending ? "Submitting…" : "Submit Counter-Offer"}
      </Button>
    </form>
  );
}
