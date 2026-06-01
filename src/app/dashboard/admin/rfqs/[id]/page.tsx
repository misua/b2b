import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Separator } from "@/components/ui/separator";
import { CostingCalculator } from "@/components/admin/costing-calculator";
import { QuotationThread } from "@/components/admin/quotation-thread";
import { AutoRefresh } from "@/components/ui/auto-refresh";

export const metadata: Metadata = {
  title: "RFQ Detail | Admin | B2B Sourcing Portal",
};

// ─── Negotiation status chip config ──────────────────────────────────────────
const NEGO_STATUS: Record<string, { label: string; classes: string; pulse?: boolean }> = {
  PENDING:         { label: "Not yet quoted",              classes: "bg-muted text-muted-foreground border-border" },
  SENT:            { label: "Awaiting client approval",    classes: "bg-blue-50 text-blue-700 border-blue-200" },
  COUNTER_OFFERED: { label: "Counter-offer received",      classes: "bg-amber-50 text-amber-700 border-amber-300", pulse: true },
  REVISED:         { label: "Revised — awaiting approval", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  APPROVED:        { label: "Approved ✓",                  classes: "bg-green-50 text-green-700 border-green-200" },
};

export default async function AdminRFQDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [rfq, factories] = await Promise.all([
    prisma.rFQ.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        quotation: {
          include: {
            factory: true,
            revisions: { orderBy: { version: "asc" } },
            messages:  { orderBy: { createdAt: "asc" } },
          },
        },
      },
    }),
    prisma.factory.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!rfq) notFound();

  const existingQuotation = rfq.quotation
    ? {
        productCost:  Number(rfq.quotation.productCost),
        shippingCost: Number(rfq.quotation.shippingCost),
        customsDuties:Number(rfq.quotation.customsDuties),
        otherExpenses:Number(rfq.quotation.otherExpenses),
        totalCost:    Number(rfq.quotation.totalCost),
        factoryId:    rfq.quotation.factoryId,
      }
    : null;

  const negoStatus = rfq.quotation?.negotiationStatus ?? "PENDING";
  const statusCfg  = NEGO_STATUS[negoStatus] ?? NEGO_STATUS.PENDING;
  const isCounterOffered = negoStatus === "COUNTER_OFFERED";
  const isApproved       = negoStatus === "APPROVED";

  // Latest counter-offer target price (for admin context)
  const counterOfferMsg = rfq.quotation?.messages
    .filter((m) => m.senderRole === "CLIENT" && m.targetPrice)
    .at(-1);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Auto-refresh: keeps thread + status live without page reload */}
      <AutoRefresh intervalMs={8000} />

      {/* ── Breadcrumb ── */}
      <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Link href="/dashboard/admin" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>›</span>
        <Link href="/dashboard/admin/rfqs" className="hover:text-foreground transition-colors">RFQs</Link>
        <span>›</span>
        <span className="text-foreground font-medium truncate max-w-56">{rfq.productName}</span>
      </nav>

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{rfq.productName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {rfq.user.name} · {rfq.user.email} · {rfq.quantity.toLocaleString("en-PH")} units
          </p>
        </div>
        {/* Negotiation status chip */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shrink-0 ${statusCfg.classes}`}>
          {statusCfg.pulse && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
          )}
          {statusCfg.label}
        </div>
      </div>

      {/* ── Counter-offer action banner ── */}
      {isCounterOffered && (
        <div className="rounded-xl bg-amber-50 border border-amber-300 px-5 py-4">
          <div className="flex items-start gap-4">
            <span className="text-2xl shrink-0">🔔</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900">Client has submitted a counter-offer</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Review their message in the thread below. Update the quotation to match their
                price (or negotiate further), then click <strong>Send Revised Quote</strong>.
                The client&apos;s Approve &amp; Pay button is locked until you respond.
              </p>
              {counterOfferMsg?.targetPrice && (
                <p className="mt-2 inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 rounded-lg px-3 py-1.5 text-sm font-bold text-amber-900">
                  Client target price: ₱{Number(counterOfferMsg.targetPrice).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: Negotiation thread + RFQ details ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Negotiation thread — shown as soon as quotation exists */}
          {rfq.quotation && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Negotiation Thread</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rfq.quotation.revisions.length > 0
                      ? `Version ${rfq.quotation.revisions.length} · ${rfq.quotation.messages.length} message${rfq.quotation.messages.length !== 1 ? "s" : ""}`
                      : "Starts when you send the first quote"}
                  </p>
                </div>
                {isApproved && (
                  <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                    ✓ Approved
                  </span>
                )}
              </div>
              <div className="p-4">
                <QuotationThread
                  quotationId={rfq.quotation.id}
                  messages={rfq.quotation.messages.map((m) => ({
                    id:          m.id,
                    senderRole:  m.senderRole,
                    senderName:  m.senderName,
                    content:     m.content,
                    targetPrice: m.targetPrice ? Number(m.targetPrice) : null,
                    createdAt:   m.createdAt,
                  }))}
                  hasCounterOffer={isCounterOffered}
                  isApproved={isApproved}
                />
              </div>
            </div>
          )}

          {/* RFQ details — below thread so context is available without scrolling past it */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/20">
              <p className="text-sm font-semibold">Request Details</p>
            </div>
            <div className="p-4 space-y-4">
              {/* Specs */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Specifications
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">
                  {rfq.specifications}
                </p>
              </div>

              {rfq.quotation?.factory && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Assigned Factory
                    </p>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
                      <span>🏭</span>
                      <span>{rfq.quotation.factory.name}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Reference files */}
              {rfq.imageUrls.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Reference Files ({rfq.imageUrls.length})
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {rfq.imageUrls.map((url) => {
                        const isPdf = url.endsWith(".pdf");
                        return (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block rounded-lg overflow-hidden border bg-muted hover:border-primary transition-colors"
                          >
                            {isPdf ? (
                              <div className="h-20 flex flex-col items-center justify-center gap-1 text-muted-foreground group-hover:text-foreground">
                                <span className="text-xl">📄</span>
                                <span className="text-[10px]">PDF</span>
                              </div>
                            ) : (
                              <div className="relative h-20">
                                <Image src={url} alt="Reference" fill className="object-cover" sizes="100px" />
                              </div>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Quotation editor (sticky) ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-20 rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/20">
              <p className="text-sm font-semibold">
                {existingQuotation ? "Revise Quotation" : "Create Quotation"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Costs in Philippine Pesos (₱). Saved revisions notify the client.
              </p>
            </div>
            <div className="p-4">
              <CostingCalculator
                rfqId={rfq.id}
                factories={factories}
                existingQuotation={existingQuotation}
                isRevision={isCounterOffered}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
