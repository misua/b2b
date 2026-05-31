"use client";

import { useActionState, useState } from "react";
import { updateOrderStatus } from "@/actions/order";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { OrderStatus } from "@prisma/client";
import type { UpdateStatusState } from "@/actions/order";

const STATUS_OPTIONS: { value: OrderStatus; label: string; icon: string }[] = [
  { value: "REQUIREMENTS_SUBMITTED", label: "Requirements Submitted", icon: "📋" },
  { value: "QUOTATION_READY", label: "Quotation Ready", icon: "💰" },
  { value: "AWAITING_PRODUCTION", label: "Payment Received", icon: "✅" },
  { value: "IN_PRODUCTION", label: "In Production", icon: "🏭" },
  { value: "AT_CHINA_WAREHOUSE", label: "China Warehouse", icon: "🏬" },
  { value: "INTERNATIONAL_TRANSIT", label: "International Transit", icon: "🚢" },
  { value: "OUT_FOR_LOCAL_DELIVERY", label: "Out for Delivery", icon: "🚚" },
  { value: "DELIVERED", label: "Delivered", icon: "🎉" },
];

interface StatusSelectorProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function StatusSelector({ orderId, currentStatus }: StatusSelectorProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus);
  const [state, formAction, isPending] = useActionState<UpdateStatusState, FormData>(
    updateOrderStatus,
    undefined
  );

  const hasChanged = selectedStatus !== currentStatus;

  return (
    <div className="space-y-3">
      {state?.success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          ✓ Status updated successfully.
        </div>
      )}
      {state?.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="flex gap-2 items-center">
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="status" value={selectedStatus} />

        <Select
          value={selectedStatus}
          onValueChange={(v) => setSelectedStatus(v as OrderStatus)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue>
              {(() => {
                const opt = STATUS_OPTIONS.find((o) => o.value === selectedStatus);
                return opt ? `${opt.icon} ${opt.label}` : selectedStatus;
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="submit"
          size="sm"
          disabled={isPending || !hasChanged}
          className="shrink-0"
        >
          {isPending ? "Saving…" : "Update"}
        </Button>
      </form>

      {hasChanged && (
        <p className="text-xs text-muted-foreground">
          Client will see this change immediately after saving.
        </p>
      )}
    </div>
  );
}
