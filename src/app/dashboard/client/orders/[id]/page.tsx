import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MilestoneStepper } from "@/components/order-tracker/milestone-stepper";

export const metadata: Metadata = { title: "Order Tracker | B2B Sourcing Portal" };

const STATUS_META: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  REQUIREMENTS_SUBMITTED: { label: "Requirements Submitted", icon: "📋", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
  QUOTATION_READY:        { label: "Quotation Ready",        icon: "💰", bg: "bg-blue-50",  text: "text-blue-700",  border: "border-blue-200" },
  AWAITING_PRODUCTION:    { label: "Payment Confirmed",       icon: "✅", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  IN_PRODUCTION:          { label: "In Production",           icon: "🏭", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  AT_CHINA_WAREHOUSE:     { label: "China Warehouse",         icon: "🏬", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  INTERNATIONAL_TRANSIT:  { label: "International Transit",   icon: "🚢", bg: "bg-blue-50",  text: "text-blue-700",  border: "border-blue-200" },
  OUT_FOR_LOCAL_DELIVERY: { label: "Out for Delivery",        icon: "🚚", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  DELIVERED:              { label: "Delivered",               icon: "🎉", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function OrderTrackerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireClient();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.userId },
    include: {
      quotation: {
        include: {
          rfq: { select: { productName: true, quantity: true } },
        },
      },
    },
  });

  if (!order) notFound();

  const totalCost = Number(order.quotation.totalCost);
  const meta = STATUS_META[order.status] ?? STATUS_META.REQUIREMENTS_SUBMITTED;

  const lineItems = [
    { label: "Product Cost",       value: Number(order.quotation.productCost) },
    { label: "Shipping & Freight", value: Number(order.quotation.shippingCost) },
    { label: "Customs & Duties",   value: Number(order.quotation.customsDuties) },
    { label: "Other Expenses",     value: Number(order.quotation.otherExpenses) },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Link href="/dashboard/client" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>›</span>
        <span className="text-foreground font-medium truncate max-w-56">{order.quotation.rfq.productName}</span>
      </nav>

      {/* ── Full-width status banner ── */}
      <div className={`rounded-xl border ${meta.bg} ${meta.border} px-5 py-4`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-white/60 border ${meta.border} flex items-center justify-center text-2xl shadow-sm`}>
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Current Status
            </p>
            <p className={`text-lg font-bold ${meta.text}`}>{meta.label}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Updated</p>
            <p className="text-sm font-medium">
              {new Date(order.updatedAt).toLocaleDateString("en-US", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Order metadata ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Order ID", value: order.id.slice(0, 8) + "…", mono: true },
          { label: "Quantity", value: order.quotation.rfq.quantity.toLocaleString() + " units" },
          { label: "Total Value", value: "$" + fmtMoney(totalCost) },
        ].map(({ label, value, mono }) => (
          <div key={label} className="rounded-xl border bg-card px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-sm font-semibold ${mono ? "font-mono" : ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Milestone tracker ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Shipment Progress</CardTitle>
          <CardDescription>
            Your order from factory to doorstep — updated in real time.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <MilestoneStepper currentStatus={order.status} updatedAt={order.updatedAt} />
        </CardContent>
      </Card>

      {/* ── Cost summary with proportion bars ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cost Breakdown</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          {lineItems.map(({ label, value }) => {
            const pct = totalCost > 0 ? (value / totalCost) * 100 : 0;
            return (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium tabular-nums">${fmtMoney(value)}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/40 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          <Separator />
          <div className="flex justify-between text-sm font-bold pt-1">
            <span>Total</span>
            <span className="tabular-nums text-base">${fmtMoney(totalCost)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
