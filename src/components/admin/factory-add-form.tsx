"use client";

import { useActionState, useEffect, useRef } from "react";
import { createFactory } from "@/actions/factory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FactoryFormState } from "@/actions/factory";

export function FactoryAddForm() {
  const [state, formAction, isPending] = useActionState<FactoryFormState, FormData>(
    createFactory,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {/* Factory name — required */}
      <div className="space-y-1.5">
        <Label htmlFor="add-name">
          Factory Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="add-name"
          name="name"
          placeholder="e.g. Shenzhen Bright Manufacturing Co."
          disabled={isPending}
          className={state?.errors?.name ? "border-destructive" : ""}
        />
        {state?.errors?.name && (
          <p className="text-xs text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      {/* Contact details — all optional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="add-contact">
            Contact Person{" "}
            <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </Label>
          <Input
            id="add-contact"
            name="contactPerson"
            placeholder="e.g. Jenny Li"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="add-email">
            Email{" "}
            <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </Label>
          <Input
            id="add-email"
            name="email"
            type="email"
            placeholder="e.g. jenny@factory.com"
            disabled={isPending}
            className={state?.errors?.email ? "border-destructive" : ""}
          />
          {state?.errors?.email && (
            <p className="text-xs text-destructive">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="add-whatsapp">
            WhatsApp{" "}
            <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </Label>
          <Input
            id="add-whatsapp"
            name="whatsapp"
            placeholder="e.g. +86 138 0000 1234"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="add-notes">
          Notes{" "}
          <span className="text-muted-foreground font-normal text-xs">(optional)</span>
        </Label>
        <textarea
          id="add-notes"
          name="notes"
          rows={2}
          placeholder="e.g. Best for bags & packaging. MOQ 500 pcs. Lead time 30 days."
          disabled={isPending}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>

      {/* Feedback */}
      {state?.message && (
        <p className="text-xs text-destructive">{state.message}</p>
      )}
      {state?.success && (
        <p className="text-xs text-green-600 font-medium">✓ Factory added successfully.</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add Factory"}
      </Button>
    </form>
  );
}
