"use client";

import { useActionState, useEffect, useRef } from "react";
import { addFactoryNote } from "@/actions/factory";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { FactoryNoteFormState } from "@/actions/factory";

interface FactoryNoteFormProps {
  factoryId: string;
}

export function FactoryNoteForm({ factoryId }: FactoryNoteFormProps) {
  const [state, formAction, isPending] = useActionState<
    FactoryNoteFormState,
    FormData
  >(addFactoryNote, undefined);

  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Clear textarea on success
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      textareaRef.current?.focus();
    }
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="factoryId" value={factoryId} />

      <div className="space-y-1.5">
        <Label htmlFor={`note-${factoryId}`}>Add a Note</Label>
        <textarea
          ref={textareaRef}
          id={`note-${factoryId}`}
          name="content"
          rows={3}
          placeholder="e.g. Called Jenny — shipment delayed 3 days due to Chinese New Year. New ETA Feb 10."
          disabled={isPending}
          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors ${
            state?.errors?.content
              ? "border-destructive"
              : "border-input"
          }`}
        />
        {state?.errors?.content && (
          <p className="text-xs text-destructive">{state.errors.content[0]}</p>
        )}
        {state?.message && (
          <p className="text-xs text-destructive">{state.message}</p>
        )}
        {state?.success && (
          <p className="text-xs text-green-600 font-medium">✓ Note saved.</p>
        )}
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Saving…" : "Save Note"}
      </Button>
    </form>
  );
}
