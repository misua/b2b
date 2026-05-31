import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ButtonLink } from "@/components/ui/button-link";
import { ApproveQuotationForm } from "@/components/rfq/approve-quotation-form";

export const metadata: Metadata = { title: "Quotation Detail | B2B Sourcing Portal" };

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireClient();
  const { id } = await params;

  const quotation = await prisma.quotation.findFirst({
    where: { id, rfq: { userId: session.userId } },
    include: {
      rfq: { select: { productName: true, quantity: true, createdAt: true } },
      order: true,
    },
  });

  if (!quotation) notFound();

  const total = Number(quotation.totalCost);
  const perUnit = quotation.rfq.quantity > 0 ? total / quotation.rfq.quantity : 0;

  const lineItems = [
    { label: "Product Cost",       icon: "🏭", value: Number(quotation.productCost),   description: "Ex-factory cost" },
    { label: "Shipping & Freight", icon: "🚢", value: Number(quotation.shippingCost),  description: "Air / sea freight" },
    { label: "Customs & Duties",   icon: "🏛️", value: Number(quotation.customsDuties), description: "Import taxes" },
    { label: "Other Expenses",     icon: "📦", value: Number(quotation.otherExpenses),  description: "Insurance, packaging" },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Link href="/dashboard/client" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>›</span>
        <span className="text-foreground font-medium">Quotation</span>
      </nav>

      {/* ── Approved banner ── */}
      {quotation.isApproved && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-100 border border-green-300 flex items-center justify-center text-lg shrink-0">
            ✅
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">Quotation Approved</p>
            <p className="text-xs text-green-700 mt-0.5">Payment received — your order is being processed.</p>
          </div>
          {quotation.order && (
            <ButtonLink
              href={`/dashboard/client/orders/${quotation.order.id}`}
              size="sm"
              className="shrink-0 bg-green-600 hover:bg-green-700 text-white border-0"
            >
              Track →
            </ButtonLink>
          )}
        </div>
      )}

      {/* ── Product header ── */}
      <div className="rounded-xl border bg-card px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Product</p>
            <p className="font-bold text-lg leading-tight">{quotation.rfq.productName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {quotation.rfq.quantity.toLocaleString()} units ·{" "}
              Quoted{" "}
              {new Date(quotation.createdAt).toLocaleDateString("en-US", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <Badge variant={quotation.isApproved ? "default" : "secondary"} className="shrink-0">
            {quotation.isApproved ? "Approved" : "Awaiting Approval"}
          </Badge>
        </div>
      </div>

      {/* ── Cost breakdown with proportion bars ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cost Breakdown</CardTitle>
          <CardDescription>All-in landed cost per unit and total</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-4">
          {lineItems.map(({ label, icon, value, description }) => {
            const pct = total > 0 ? (value / total) * 100 : 0;
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base w-6 text-center">{icon}</span>
                    <div>
                      <p className="text-sm font-medium leading-none">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">${fmt(value)}</p>
                    <p className="text-xs text-muted-foreground">{pct.toFixed(1)}%</p>
                  </div>
                </div>
                {/* Proportion bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-8">
                  <div
                    className="h-full bg-primary/50 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}

          <Separator />

          {/* Total */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Total Amount</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All-in landed cost
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">${fmt(total)}</p>
                {perUnit > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ${fmt(perUnit)} / unit
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Approve & Pay — when not yet approved ── */}
      {!quotation.isApproved && (
        <div className="rounded-xl border-2 border-primary/20 bg-card overflow-hidden">
          {/* Commitment header */}
          <div className="bg-primary/5 border-b border-primary/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">
                🔐
              </div>
              <div>
                <p className="font-semibold text-sm">Approve & Pay</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You are committing to pay{" "}
                  <span className="font-bold text-foreground">${fmt(total)}</span>{" "}
                  for {quotation.rfq.quantity.toLocaleString()} units of {quotation.rfq.productName}.
                  Upload your payment receipt to confirm.
                </p>
              </div>
            </div>
          </div>
          <div className="px-5 py-4">
            <ApproveQuotationForm quotationId={quotation.id} />
          </div>
        </div>
      )}

      {/* ── Already approved — payment proof link ── */}
      {quotation.isApproved && quotation.paymentProof && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment Proof</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={quotation.paymentProof}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline underline-offset-2 hover:opacity-80"
            >
              View submitted receipt →
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
