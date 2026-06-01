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
  existingQuotation,
}: CostingCalculatorProps) {
  const [state, formAction, isPending] = useActionState<CostingFormState, FormData>(
    saveQuotation,
    undefined
  );

  const [values, setValues] = useState({
    productCost: existingQuotation?.productCost ?? 0,
    shippingCost: existingQuotation?.shippingCost ?? 0,
    customsDuties: existingQuotation?.customsDuties ?? 0,
    otherExpenses: existingQuotation?.otherExpenses ?? 0,
  });

  const [selectedFactoryId, setSelectedFactoryId] = useState<string>(
    existingQuotation?.factoryId != null ? existingQuotation.factoryId : ""
  );

  const total =
    values.productCost +
    values.shippingCost +
    values.customsDuties +
    values.otherExpenses;

  function handleChange(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = parseFloat(e.target.value) || 0;
      setValues((prev) => ({ ...prev, [field]: num }));
    };
  }

  const lineItems = [
    {
      key: "productCost" as const,
      label: "Product Cost",
      description: "Ex-factory unit cost × quantity",
      icon: "🏭",
    },
    {
      key: "shippingCost" as const,
      label: "Shipping & Freight",
      description: "Air / sea freight + local handling",
      icon: "🚢",
    },
    {
      key: "customsDuties" as const,
      label: "Customs & Duties",
      description: "Import taxes & brokerage fees",
      icon: "🏛️",
    },
    {
      key: "otherExpenses" as const,
      label: "Other Expenses",
      description: "Insurance, packaging, contingency",
      icon: "📦",
    },
  ];

  return (
    <form action={formAction} className="space-y-5">
      {/* Hidden fields */}
      <input type="hidden" name="rfqId" value={rfqId} />
      <input type="hidden" name="factoryId" value={selectedFactoryId} />

      {state?.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {/* ── Factory selector ── */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-2">
          <span>🏭</span>
          <span>Assigned Factory</span>
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        {factories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 px-3 py-2.5 text-sm text-muted-foreground">
            No factories registered yet.{" "}
            <Link
              href="/dashboard/admin/factories"
              className="text-primary underline underline-offset-2 font-medium"
            >
              Add factories →
            </Link>
          </div>
        ) : (
          <Select
            value={selectedFactoryId}
            onValueChange={(v) => setSelectedFactoryId(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select the winning factory…" />
            </SelectTrigger>
            <SelectContent>
              {factories.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {selectedFactoryId && (
          <button
            type="button"
            onClick={() => setSelectedFactoryId("")}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            ✕ Clear selection
          </button>
        )}
      </div>

      <Separator />

      {/* ── Cost line items ── */}
      <div className="space-y-4">
        {lineItems.map(({ key, label, description, icon }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={key} className="flex items-center gap-2">
              <span>{icon}</span>
              <span>{label}</span>
            </Label>
            <p className="text-xs text-muted-foreground">{description}</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                ₱
              </span>
              <Input
                id={key}
                name={key}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                defaultValue={existingQuotation?.[key] ?? ""}
                onChange={handleChange(key)}
                className="pl-7"
              />
            </div>
            {state?.errors?.[key] && (
              <p className="text-sm text-destructive">{state.errors[key]?.[0]}</p>
            )}
          </div>
        ))}
      </div>

      <Separator />

      {/* ── Live total ── */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Quotation</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sum of all line items</p>
          </div>
          <p className="text-3xl font-bold tabular-nums">
            ₱{total.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* Breakdown bar */}
        {total > 0 && (
          <div className="mt-4">
            <div className="flex rounded-full overflow-hidden h-2 gap-px">
              {lineItems.map(({ key }, i) => {
                const pct = (values[key] / total) * 100;
                if (pct === 0) return null;
                const colors = [
                  "bg-blue-500",
                  "bg-emerald-500",
                  "bg-amber-500",
                  "bg-purple-500",
                ];
                return (
                  <div
                    key={key}
                    style={{ width: `${pct}%` }}
                    className={`${colors[i]} transition-all`}
                    title={`${lineItems[i].label}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {lineItems.map(({ key, label }, i) => {
                const pct = total > 0 ? (values[key] / total) * 100 : 0;
                const colors = [
                  "text-blue-600",
                  "text-emerald-600",
                  "text-amber-600",
                  "text-purple-600",
                ];
                if (pct === 0) return null;
                return (
                  <span key={key} className={`text-xs ${colors[i]}`}>
                    {label}: {pct.toFixed(1)}%
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Admin note for client ── */}
      <div className="space-y-1.5">
        <Label htmlFor="adminNote" className="text-sm font-medium">
          Note for client{" "}
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <textarea
          id="adminNote"
          name="adminNote"
          rows={2}
          placeholder="e.g. Reduced shipping per your request. This is our best price."
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
        />
      </div>

      {/* ── Submit ── */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending
          ? "Saving…"
          : existingQuotation
          ? "Update Quotation"
          : "Send Quotation to Client"}
      </Button>
    </form>
  );
}
