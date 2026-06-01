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
import { CounterOfferForm } from "@/components/client/counter-offer-form";

export const metadata: Metadata = { title: "Quotation Detail | B2B Sourcing Portal" };

function fmt(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      revisions: { orderBy: { version: "asc" } },
      messages:  { orderBy: { createdAt: "asc" } },
    },
  });

  if (!quotation) notFound();

  const total = Number(quotation.totalCost);
  const perUnit = quotation.rfq.quantity > 0 ? total / quotation.rfq.quantity : 0;
  const isCounterOffered = quotation.negotiationStatus === "COUNTER_OFFERED";
  const canApprove = !quotation.isApproved && quotation.negotiationStatus !== "COUNTER_OFFERED";

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
          <div className="w-9 h-9 rounded-full bg-green-100 border border-green-300 flex items-center justify-center text-lg shrink-0">✅</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">Quotation Approved</p>
            <p className="text-xs text-green-700 mt-0.5">Payment received — your order is being processed.</p>
          </div>
          {quotation.order && (
            <ButtonLink href={`/dashboard/client/orders/${quotation.order.id}`} size="sm"
              className="shrink-0 bg-green-600 hover:bg-green-700 text-white border-0">
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
              {quotation.rfq.quantity.toLocaleString("en-PH")} units · Quoted{" "}
              {new Date(quotation.createdAt).toLocaleDateString("en-US", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant={quotation.isApproved ? "default" : "secondary"}>
              {quotation.isApproved ? "Approved" : "Awaiting Approval"}
            </Badge>
            {quotation.revisions.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Version {quotation.revisions.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Version history (if more than 1 revision) ── */}
      {quotation.revisions.length > 1 && (
        <details className="rounded-xl border bg-card overflow-hidden">
          <summary className="px-4 py-3 text-sm font-medium cursor-pointer select-none hover:bg-muted/30 list-none flex items-center justify-between">
            <span>📋 Version History ({quotation.revisions.length} revisions)</span>
            <span className="text-muted-foreground text-xs">Click to expand</span>
          </summary>
          <div className="border-t divide-y">
            {quotation.revisions.map((rev) => (
              <div key={rev.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Version {rev.version}
                  </span>
                  {rev.adminNote && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">"{rev.adminNote}"</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{fmt(Number(rev.totalCost))}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(rev.createdAt).toLocaleDateString("en-US", {
                      day: "numeric", month: "short",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── Cost breakdown ── */}
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
                    <p className="text-sm font-semibold tabular-nums">{fmt(value)}</p>
                    <p className="text-xs text-muted-foreground">{pct.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-8">
                  <div className="h-full bg-primary/50 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}

          <Separator />

          <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Total Amount</p>
                <p className="text-xs text-muted-foreground mt-0.5">All-in landed cost</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">{fmt(total)}</p>
                {perUnit > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">{fmt(perUnit)} / unit</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Download PDF ── */}
      <div className="flex justify-end">
        <a
          href={`/api/quotation/${quotation.id}/pdf`}
          download
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium text-foreground shadow-sm"
        >
          <span>📄</span>
          <span>Download Quotation PDF</span>
        </a>
      </div>

      {/* ── Negotiation thread ── */}
      {!quotation.isApproved && quotation.messages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">💬 Conversation</CardTitle>
            <CardDescription>Messages between you and your account manager</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {quotation.messages.map((msg) => {
                const isAdmin = msg.senderRole === "ADMIN";
                return (
                  <div
                    key={msg.id}
                    className={`rounded-lg px-3 py-2.5 ${
                      isAdmin
                        ? "bg-muted/50 border border-border"
                        : "bg-blue-50 border border-blue-200 ml-6"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-xs font-semibold ${isAdmin ? "text-foreground" : "text-blue-800"}`}>
                        {isAdmin ? "B2B Admin" : "You"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleDateString("en-US", {
                          day: "numeric", month: "short",
                        })}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${isAdmin ? "text-foreground" : "text-blue-900"}`}>
                      {msg.content}
                    </p>
                    {msg.targetPrice != null && (
                      <p className="text-xs font-semibold text-blue-700 mt-1">
                        Your target: {fmt(Number(msg.targetPrice))}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Waiting for admin response (locked state) ── */}
      {isCounterOffered && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center gap-4">
          <span className="text-2xl shrink-0">⏳</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Counter-offer submitted</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Your counter-offer is with the admin. The Approve &amp; Pay button will
              unlock once they respond with a revised quotation.
            </p>
          </div>
        </div>
      )}

      {/* ── Counter-offer form — visible when not approved and not locked ── */}
      {!quotation.isApproved && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">💬 Counter-Offer</CardTitle>
            <CardDescription>
              Not happy with the price? Send a counter-offer to negotiate.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <CounterOfferForm
              quotationId={quotation.id}
              isLocked={isCounterOffered}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Approve & Pay ── */}
      {!quotation.isApproved && (
        <div className={`rounded-xl border-2 bg-card overflow-hidden transition-opacity ${
          canApprove ? "border-primary/20" : "border-muted opacity-60"
        }`}>
          <div className="bg-primary/5 border-b border-primary/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${
                canApprove ? "bg-primary/10" : "bg-muted"
              }`}>
                {canApprove ? "🔐" : "🔒"}
              </div>
              <div>
                <p className="font-semibold text-sm">Approve &amp; Pay</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {canApprove
                    ? <>You are committing to pay{" "}
                        <span className="font-bold text-foreground">{fmt(total)}</span>{" "}
                        for {quotation.rfq.quantity.toLocaleString("en-PH")} units of {quotation.rfq.productName}.
                        Upload your payment receipt to confirm.</>
                    : "Approve & Pay is locked while your counter-offer is pending admin response."}
                </p>
              </div>
            </div>
          </div>
          {canApprove && (
            <div className="px-5 py-4">
              <ApproveQuotationForm quotationId={quotation.id} />
            </div>
          )}
        </div>
      )}

      {/* ── Payment proof link ── */}
      {quotation.isApproved && quotation.paymentProof && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment Proof</CardTitle>
          </CardHeader>
          <CardContent>
            <a href={quotation.paymentProof} target="_blank" rel="noopener noreferrer"
              className="text-sm text-primary underline underline-offset-2 hover:opacity-80">
              View submitted receipt →
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
