"use client";

import Link from "next/link";
import { useActionState, useState, useEffect } from "react";
import { updateFactory, deleteFactory } from "@/actions/factory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { FactoryFormState } from "@/actions/factory";

interface Factory {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  whatsapp: string | null;
  notes: string | null;
  createdAt: Date;
  _count: { quotations: number };
}

interface FactoryRowProps {
  factory: Factory;
}

export function FactoryRow({ factory }: FactoryRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ── Controlled edit field state ──────────────────────────────────────────
  // Initialised from factory props; reset when accordion opens
  const [fields, setFields] = useState({
    name: factory.name,
    contactPerson: factory.contactPerson ?? "",
    email: factory.email ?? "",
    whatsapp: factory.whatsapp ?? "",
    notes: factory.notes ?? "",
  });

  // Reset fields to latest factory data every time the panel opens
  useEffect(() => {
    if (isExpanded) {
      setFields({
        name: factory.name,
        contactPerson: factory.contactPerson ?? "",
        email: factory.email ?? "",
        whatsapp: factory.whatsapp ?? "",
        notes: factory.notes ?? "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  function handleField(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  const [editState, editAction, isEditPending] = useActionState<FactoryFormState, FormData>(
    updateFactory,
    undefined
  );
  const [deleteState, deleteAction, isDeletePending] = useActionState<FactoryFormState, FormData>(
    deleteFactory,
    undefined
  );

  // Collapse on successful save
  useEffect(() => {
    if (editState?.success) setIsExpanded(false);
  }, [editState?.success]);

  const hasContact = factory.contactPerson || factory.email || factory.whatsapp;

  return (
    <div className="border-b last:border-b-0">
      {/* ── Collapsed row ── */}
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 group">
        <span className="text-lg shrink-0">🏭</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{factory.name}</p>

          {hasContact ? (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
              {factory.contactPerson && (
                <span className="text-xs text-muted-foreground">
                  👤 {factory.contactPerson}
                </span>
              )}
              {factory.email && (
                <a
                  href={`mailto:${factory.email}`}
                  className="text-xs text-primary hover:underline underline-offset-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  ✉️ {factory.email}
                </a>
              )}
              {factory.whatsapp && (
                <a
                  href={`https://wa.me/${factory.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:underline underline-offset-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  💬 {factory.whatsapp}
                </a>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              {factory._count.quotations === 0
                ? "No orders yet · No contact info"
                : `${factory._count.quotations} quotation${factory._count.quotations !== 1 ? "s" : ""} · No contact info`}
            </p>
          )}

          {factory.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-sm italic">
              {factory.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Link
            href={`/dashboard/admin/factories/${factory.id}`}
            className="inline-flex items-center h-7 px-2 rounded-md border border-input text-xs font-medium hover:bg-muted transition-colors"
          >
            History
          </Link>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setIsExpanded((v) => !v)}
          >
            {isExpanded ? "Close" : "Edit"}
          </Button>

          <form action={deleteAction}>
            <input type="hidden" name="id" value={factory.id} />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="h-7 text-xs text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
              disabled={isDeletePending || factory._count.quotations > 0}
              title={
                factory._count.quotations > 0
                  ? "Cannot delete — factory has linked quotations"
                  : "Delete factory"
              }
            >
              {isDeletePending ? "…" : "Delete"}
            </Button>
          </form>
        </div>

        {deleteState?.message && (
          <p className="text-xs text-destructive ml-2 max-w-48 shrink-0">
            {deleteState.message}
          </p>
        )}
      </div>

      {/* ── Expanded edit panel ── */}
      {isExpanded && (
        <div className="bg-muted/20 border-t px-4 py-4">
          <form action={editAction} className="space-y-4">
            <input type="hidden" name="id" value={factory.id} />

            {/* Hidden fields carry the controlled state into the FormData */}
            <input type="hidden" name="name" value={fields.name} />
            <input type="hidden" name="contactPerson" value={fields.contactPerson} />
            <input type="hidden" name="email" value={fields.email} />
            <input type="hidden" name="whatsapp" value={fields.whatsapp} />
            <input type="hidden" name="notes" value={fields.notes} />

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor={`name-${factory.id}`}>
                Factory Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`name-${factory.id}`}
                value={fields.name}
                onChange={handleField("name")}
                disabled={isEditPending}
                className={editState?.errors?.name ? "border-destructive" : ""}
              />
              {editState?.errors?.name && (
                <p className="text-xs text-destructive">{editState.errors.name[0]}</p>
              )}
            </div>

            {/* Contact grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`contact-${factory.id}`}>
                  Contact Person{" "}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  id={`contact-${factory.id}`}
                  value={fields.contactPerson}
                  onChange={handleField("contactPerson")}
                  placeholder="e.g. Jenny Li"
                  disabled={isEditPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`email-${factory.id}`}>
                  Email{" "}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  id={`email-${factory.id}`}
                  type="email"
                  value={fields.email}
                  onChange={handleField("email")}
                  placeholder="e.g. jenny@factory.com"
                  disabled={isEditPending}
                  className={editState?.errors?.email ? "border-destructive" : ""}
                />
                {editState?.errors?.email && (
                  <p className="text-xs text-destructive">{editState.errors.email[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`whatsapp-${factory.id}`}>
                  WhatsApp{" "}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  id={`whatsapp-${factory.id}`}
                  value={fields.whatsapp}
                  onChange={handleField("whatsapp")}
                  placeholder="e.g. +86 138 0000 1234"
                  disabled={isEditPending}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor={`notes-${factory.id}`}>
                Notes{" "}
                <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </Label>
              <textarea
                id={`notes-${factory.id}`}
                value={fields.notes}
                onChange={handleField("notes")}
                rows={2}
                placeholder="e.g. Best for bags & packaging. MOQ 500 pcs. Lead time 30 days."
                disabled={isEditPending}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            {editState?.message && (
              <p className="text-xs text-destructive">{editState.message}</p>
            )}
            {editState?.success && (
              <p className="text-xs text-green-600 font-medium">✓ Saved successfully.</p>
            )}

            <Separator />

            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isEditPending}>
                {isEditPending ? "Saving…" : "Save Changes"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsExpanded(false)}
                disabled={isEditPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
