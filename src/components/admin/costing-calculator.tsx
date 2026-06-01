"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveQuotation } from "@/actions/quotation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CostingFormState } from "@/actions/quotation";

interface Factory {
  id: string;
  name: string;
}

interface CostingCalculatorProps {
  rfqId: string;
  factories: Factory[];
  /** When true: this is a response to a client counter-offer → button label changes */
  isRevision?: boolean;
  existingQuotation?: {
    productCost: number;
    shippingCost: number;
    customsDuties: number;
    otherExpenses: number;
    totalCost: number;
    factoryId?: string | null | undefined;
  } | null;
}

export function CostingCalculator({
  rfqId,
  factories,
  isRevision = false,
  existingQuotation,
}: CostingCalculatorProps) {
  const [state, formAction, isPending] = useActionState<CostingFormState, FormData>(
    saveQuotation,
    undefined
  );

  const [values, setValues] = useState({
    productCost:   existingQuotation?.productCost   ?? 0,
    shippingCost:  existingQuotation?.shippingCost  ?? 0,
    customsDuties: existingQuotation?.customsDuties ?? 0,
    otherExpenses: existingQuotation?.otherExpenses ?? 0,
  });

  const [selectedFactoryId, setSelectedFactoryId] = useState<string>(
    existingQuotation?.factoryId != null ? existingQuotation.factoryId : ""
  );

  const total =
    values.productCost + values.shippingCost + values.customsDuties + values.otherExpenses;

  function handleChange(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: parseFloat(e.target.value) || 0 }));
    };
  }

  const lineItems = [
    { key: "productCost"   as const, label: "Product Cost",       description: "Ex-factory unit cost × quantity",   icon: "🏭" },
    { key: "shippingCost"  as const, label: "Shipping & Freight",  description: "Air / sea freight + local handling", icon: "🚢" },
    { key: "customsDuties" as const, label: "Customs & Duties",    description: "Import taxes & brokerage fees",      icon: "🏛️" },
    { key: "otherExpenses" as const, label: "Other Expenses",      description: "Insurance, packaging, contingency",  icon: "📦" },
  ];

  // Contextual submit label
  const submitLabel = isPending
    ? "Saving…"
    : isRevision
    ? "Send Revised Quote →"
    : existingQuotation
    ? "Update & Notify Client →"
    : "Send Quotation to Client →";

  const submitClass = isRevision
    ? "w-full bg-amber-500 hover:bg-amber-600 text-white border-0 font-semibold"
    : "w-full";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="rfqId"      value={rfqId} />
      <input type="hidden" name="factoryId"  value={selectedFactoryId} />

      {/* ── Success banner ── */}
      {state?.success && state.message && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-start gap-3">
          <span className="text-lg shrink-0">✓</span>
          <p className="text-sm font-medium text-green-800">{state.message}</p>
        </div>
      )}

      {state?.message && !state.success && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {/* ── Reply to client (note) — first so admin sets context before entering costs ── */}
      <div className="space-y-1.5">
        <Label htmlFor="adminNote" className="text-sm font-medium">
          Reply to client{" "}
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <textarea
          id="adminNote"
          name="adminNote"
          rows={2}
          placeholder="e.g. We can match your target price. Updated below."
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
        />
      </div>

      <Separator />

      {/* ── Factory selector ── */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-sm">
          <span>🏭</span>
          <span>Assigned Factory</span>
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        {factories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 px-3 py-2 text-sm text-muted-foreground">
            No factories yet.{" "}
            <Link href="/dashboard/admin/factories" className="text-primary underline underline-offset-2 font-medium">
              Add one →
            </Link>
          </div>
        ) : (
          <Select value={selectedFactoryId} onValueChange={(v) => setSelectedFactoryId(v ?? "")}>
            <SelectTrigger className="w-full h-9">
              <SelectValue>
                {selectedFactoryId
                  ? (factories.find((f) => f.id === selectedFactoryId)?.name ?? "Unknown factory")
                  : "Select the winning factory…"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {factories.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {selectedFactoryId && (
          <button type="button" onClick={() => setSelectedFactoryId("")}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors">
            ✕ Clear
          </button>
        )}
      </div>

      <Separator />

      {/* ── Cost fields ── */}
      <div className="space-y-3">
        {lineItems.map(({ key, label, description, icon }) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={key} className="flex items-center gap-1.5 text-sm">
              <span>{icon}</span>
              <span>{label}</span>
            </Label>
            <p className="text-xs text-muted-foreground">{description}</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">₱</span>
              <Input
                id={key}
                name={key}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                defaultValue={existingQuotation?.[key] ?? ""}
                onChange={handleChange(key)}
                className="pl-7 h-10"
              />
            </div>
            {state?.errors?.[key] && (
              <p className="text-xs text-destructive">{state.errors[key]?.[0]}</p>
            )}
          </div>
        ))}
      </div>

      <Separator />

      {/* ── Live total ── */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Quotation</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Sum of all line items</p>
          </div>
          <p className="text-2xl font-bold tabular-nums">
            ₱{total.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {total > 0 && (
          <div className="mt-3">
            <div className="flex rounded-full overflow-hidden h-1.5 gap-px">
              {lineItems.map(({ key }, i) => {
                const pct = (values[key] / total) * 100;
                if (pct === 0) return null;
                const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500"];
                return (
                  <div key={key} style={{ width: `${pct}%` }}
                    className={`${colors[i]} transition-all`}
                    title={`${lineItems[i].label}: ${pct.toFixed(1)}%`} />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Submit ── */}
      <Button type="submit" className={submitClass} disabled={isPending}>
        {submitLabel}
      </Button>
    </form>
  );
}
