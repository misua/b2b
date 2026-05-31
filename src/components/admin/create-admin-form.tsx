"use client";

import { useActionState, useRef, useEffect } from "react";
import { createAdminUser } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserFormState } from "@/actions/user";

export function CreateAdminForm() {
  const [state, formAction, isPending] = useActionState<UserFormState, FormData>(
    createAdminUser,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="create-name">Full Name *</Label>
          <Input
            id="create-name"
            name="name"
            placeholder="e.g. Maria Santos"
            disabled={isPending}
            className={state?.errors?.name ? "border-destructive" : ""}
          />
          {state?.errors?.name && (
            <p className="text-xs text-destructive">{state.errors.name[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="create-email">Email Address *</Label>
          <Input
            id="create-email"
            name="email"
            type="email"
            placeholder="e.g. maria@company.com"
            disabled={isPending}
            className={state?.errors?.email ? "border-destructive" : ""}
          />
          {state?.errors?.email && (
            <p className="text-xs text-destructive">{state.errors.email[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="create-password">
          Temporary Password *{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (min 8 chars, 1 uppercase, 1 number)
          </span>
        </Label>
        <Input
          id="create-password"
          name="password"
          type="password"
          placeholder="They should change this after first login"
          disabled={isPending}
          className={state?.errors?.password ? "border-destructive" : ""}
        />
        {state?.errors?.password && (
          <p className="text-xs text-destructive">{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && (
        <p className="text-xs text-destructive">{state.message}</p>
      )}
      {state?.success && (
        <p className="text-xs text-green-600 font-medium">
          ✓ Admin account created. Share the credentials securely.
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create Admin Account"}
      </Button>
    </form>
  );
}
