"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type RFQStatus = "PENDING_REVIEW" | "QUOTED" | "IN_PROGRESS" | "REJECTED";
type Filter = "ALL" | RFQStatus;

interface RFQItem {
  id: string;
  productName: string;
  quantity: number;
  status: string;
  createdAt: Date;
  quotation: {
    id: string;
    isApproved: boolean;
    order: { id: string } | null;
  } | null;
}

interface RFQActivityListProps {
  rfqs: RFQItem[];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  QUOTED: "bg-blue-100 text-blue-800 border-blue-200",
  IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending Review",
  QUOTED: "Quotation Ready",
  IN_PROGRESS: "In Progress",
  REJECTED: "Rejected",
};

// Left border accent per status — scannability at a glance
const STATUS_BORDER: Record<string, string> = {
  PENDING_REVIEW: "border-l-amber-400",
  QUOTED: "border-l-blue-500",
  IN_PROGRESS: "border-l-purple-500",
  REJECTED: "border-l-red-400",
};

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending Review", value: "PENDING_REVIEW" },
  { label: "Quotation Ready", value: "QUOTED" },
  { label: "In Progress", value: "IN_PROGRESS" },
];

export function RFQActivityList({ rfqs }: RFQActivityListProps) {
  const [activeFilter, setActiveFilter] = useState<Filter>("ALL");

  const filtered =
    activeFilter === "ALL"
      ? rfqs
      : rfqs.filter((r) => r.status === activeFilter);

  // Count per filter for badges
  const counts = rfqs.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Filter tab strip */}
      <div className="px-6 pt-4 pb-3 border-b flex gap-1 flex-wrap">
        {FILTERS.map((f) => {
          const count = f.value === "ALL" ? rfqs.length : (counts[f.value] ?? 0);
          const isActive = activeFilter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setActiveFilter(f.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
              {count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
          No {activeFilter === "ALL" ? "" : STATUS_LABELS[activeFilter] + " "}items.
        </div>
      ) : (
        <div>
          {filtered.map((rfq, idx) => {
            const borderColor = STATUS_BORDER[rfq.status] ?? "border-l-border";
            const showReview =
              rfq.status === "QUOTED" &&
              rfq.quotation &&
              !rfq.quotation.isApproved;
            const showTrack = rfq.quotation?.order != null;

            return (
              <div key={rfq.id}>
                {idx > 0 && <Separator />}
                <div
                  className={`px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors border-l-4 ${borderColor}`}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium truncate text-sm">{rfq.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {rfq.quantity.toLocaleString()} units ·{" "}
                      {new Date(rfq.createdAt).toLocaleDateString("en-US", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Badge className={STATUS_STYLES[rfq.status] ?? "bg-muted"}>
                      {STATUS_LABELS[rfq.status] ?? rfq.status}
                    </Badge>

                    {showReview && (
                      <ButtonLink
                        href={`/dashboard/client/quotations/${rfq.quotation!.id}`}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm shadow-blue-200"
                      >
                        Review Quote →
                      </ButtonLink>
                    )}

                    {showTrack && (
                      <ButtonLink
                        href={`/dashboard/client/orders/${rfq.quotation!.order!.id}`}
                        size="sm"
                        variant="outline"
                      >
                        Track Order
                      </ButtonLink>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
