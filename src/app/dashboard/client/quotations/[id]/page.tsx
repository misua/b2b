import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Separator } from "@/components/ui/separator";
import { ButtonLink } from "@/components/ui/button-link";
import { ApproveQuotationForm } from "@/components/rfq/approve-quotation-form";
import { CounterOfferForm } from "@/components/client/counter-offer-form";
import { AutoRefresh } from "@/components/ui/auto-refresh";

export const metadata: Metadata = { title: "Quotation | B2B Sourcing Portal" };

function fmt(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtTime(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
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

  const total   = Number(quotation.totalCost);
  const perUnit = quotation.rfq.quantity > 0 ? total / quotation.rfq.quantity : 0;

  const isCounterOffered = quotation.negotiationStatus === "COUNTER_OFFERED";
  const isApproved       = quotation.isApproved;
  const canApprove       = !isApproved && !isCounterOffered;

  const lineItems = [
    { label: "Product Cost",       icon: "🏭", value: Number(quotation.productCost),   desc: "Ex-factory cost" },
    { label: "Shipping & Freight", icon: "🚢", value: Number(quotation.shippingCost),  desc: "Air / sea freight" },
    { label: "Customs & Duties",   icon: "🏛️", value: Number(quotation.customsDuties), desc: "Import taxes" },
    { label: "Other Expenses",     icon: "📦", value: Number(quotation.otherExpenses), desc: "Insurance, packaging" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Auto-refresh: unlocks Approve button within 8s after admin sends revised quote */}
      {!isApproved && <AutoRefresh intervalMs={8000} />}

      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Link href="/dashboard/client" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>›</span>
        <span className="text-foreground font-medium">Quotation</span>
      </nav>

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{quotation.rfq.productName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {quotation.rfq.quantity.toLocaleString("en-PH")} units ·{" "}
            Quoted {new Date(quotation.createdAt).toLocaleDateString("en-US", {
              day: "numeric", month: "long", year: "numeric",
            })}
            {quotation.revisions.length > 0 && (
              <span> · Version {quotation.revisions.length}</span>
            )}
          </p>
        </div>
        {isApproved ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-xs font-semibold text-green-700 shrink-0">
            ✓ Approved
          </span>
        ) : isCounterOffered ? (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-xs font-semibold text-amber-700 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
            </span>
            Awaiting admin response
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 shrink-0">
            Review & Approve
          </span>
        )}
      </div>

      {/* ── Approved banner ── */}
      {isApproved && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-xl shrink-0">✅</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">Quotation Approved — Payment Received</p>
            <p className="text-xs text-green-700 mt-0.5">Your order is being processed.</p>
          </div>
          {quotation.order && (
            <ButtonLink href={`/dashboard/client/orders/${quotation.order.id}`} size="sm"
              className="shrink-0 bg-green-600 hover:bg-green-700 text-white border-0">
              Track Order →
            </ButtonLink>
          )}
        </div>
      )}

      {/* ── 2-column main layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: cost breakdown + history + conversation ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Cost breakdown */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between">
              <p className="text-sm font-semibold">Cost Breakdown</p>
              <a
                href={`/api/quotation/${quotation.id}/pdf`}
                download
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                📄 Download PDF
              </a>
            </div>
            <div className="p-4 space-y-3.5">
              {lineItems.map(({ label, icon, value, desc }) => {
                const pct = total > 0 ? (value / total) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base w-5 text-center">{icon}</span>
                        <div>
                          <p className="text-sm font-medium leading-none">{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">{fmt(value)}</p>
                        <p className="text-xs text-muted-foreground">{pct.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden ml-7">
                      <div className="h-full bg-primary/50 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Version history */}
          {quotation.revisions.length > 1 && (
            <details className="rounded-xl border bg-card overflow-hidden">
              <summary className="px-4 py-3 text-sm font-medium cursor-pointer select-none hover:bg-muted/30 list-none flex items-center justify-between">
                <span>📋 Version History ({quotation.revisions.length} revisions)</span>
                <span className="text-muted-foreground text-xs">expand ▸</span>
              </summary>
              <div className="border-t divide-y">
                {quotation.revisions.map((rev) => (
                  <div key={rev.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground">Version {rev.version}</span>
                      {rev.adminNote && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">"{rev.adminNote}"</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{fmt(Number(rev.totalCost))}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(rev.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Conversation thread */}
          {quotation.messages.length > 0 && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/20">
                <p className="text-sm font-semibold">Conversation</p>
                <p className="text-xs text-muted-foreground mt-0.5">Messages with your account manager</p>
              </div>
              <div className="p-4 space-y-3">
                {quotation.messages.map((msg) => {
                  const isAdmin = msg.senderRole === "ADMIN";
                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isAdmin ? "flex-row" : "flex-row-reverse"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        isAdmin ? "bg-primary text-primary-foreground" : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}>
                        {isAdmin ? "A" : "Y"}
                      </div>
                      <div className={`max-w-[80%] space-y-1 ${isAdmin ? "items-start" : "items-end"} flex flex-col`}>
                        <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          isAdmin
                            ? "bg-muted/60 border border-border rounded-tl-sm"
                            : "bg-blue-50 border border-blue-200 text-blue-950 rounded-tr-sm"
                        }`}>
                          {msg.content}
                          {!isAdmin && msg.targetPrice != null && (
                            <div className="mt-1.5 inline-flex items-center gap-1 bg-blue-100 border border-blue-300 rounded-full px-2 py-0.5 text-xs font-bold text-blue-800">
                              🎯 Target: {fmt(Number(msg.targetPrice))}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground px-1">
                          {isAdmin ? "Admin" : "You"} · {fmtTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: sticky action panel ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-20 rounded-xl border bg-card overflow-hidden">

            {/* Total amount — the focal point */}
            <div className="px-5 py-5 text-center border-b bg-primary/5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Total Amount
              </p>
              <p className="text-4xl font-bold tabular-nums text-foreground">{fmt(total)}</p>
              {perUnit > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{fmt(perUnit)} per unit</p>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* ── APPROVED state ── */}
              {isApproved && (
                <div className="text-center space-y-3">
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                    <p className="text-sm font-semibold text-green-800">Payment Confirmed ✓</p>
                    <p className="text-xs text-green-700 mt-1">Your order is in progress.</p>
                  </div>
                  {quotation.order && (
                    <ButtonLink href={`/dashboard/client/orders/${quotation.order.id}`}
                      className="w-full bg-green-600 hover:bg-green-700 text-white border-0">
                      Track Shipment →
                    </ButtonLink>
                  )}
                  {quotation.paymentProof && (
                    <a href={quotation.paymentProof} target="_blank" rel="noopener noreferrer"
                      className="block text-xs text-center text-primary underline underline-offset-2 hover:opacity-80">
                      View payment receipt →
                    </a>
                  )}
                </div>
              )}

              {/* ── COUNTER_OFFERED state — locked ── */}
              {isCounterOffered && !isApproved && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">⏳</span>
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Waiting for admin</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Your counter-offer is being reviewed. The Approve button
                          will unlock automatically once admin responds.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    disabled
                    className="w-full h-12 rounded-lg bg-muted text-muted-foreground text-sm font-semibold cursor-not-allowed opacity-60"
                  >
                    🔒 Approve & Pay — Locked
                  </button>
                  <p className="text-xs text-center text-muted-foreground">
                    Counter-offer submitted. Awaiting admin response.
                  </p>
                </div>
              )}

              {/* ── APPROVE state — can approve ── */}
              {canApprove && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-muted/30 border px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                    By approving you commit to paying{" "}
                    <span className="font-bold text-foreground">{fmt(total)}</span>{" "}
                    for {quotation.rfq.quantity.toLocaleString("en-PH")} units of {quotation.rfq.productName}.
                    Upload your payment receipt to confirm.
                  </div>
                  <ApproveQuotationForm quotationId={quotation.id} />
                </div>
              )}

              {/* ── Counter-offer section — not approved ── */}
              {!isApproved && (
                <>
                  <Separator />
                  <details className="group">
                    <summary className="text-xs text-center text-muted-foreground hover:text-primary cursor-pointer select-none list-none transition-colors">
                      {isCounterOffered
                        ? "Counter-offer submitted ✓"
                        : "Not happy with the price? Counter-offer ›"}
                    </summary>
                    {!isCounterOffered && (
                      <div className="mt-3">
                        <CounterOfferForm
                          quotationId={quotation.id}
                          isLocked={isCounterOffered}
                        />
                      </div>
                    )}
                  </details>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
