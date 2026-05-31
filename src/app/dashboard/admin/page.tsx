import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Admin Dashboard | B2B Sourcing Portal" };

const ORDER_STATUS_LABELS: Record<string, string> = {
  REQUIREMENTS_SUBMITTED: "Requirements Submitted",
  QUOTATION_READY: "Quotation Ready",
  AWAITING_PRODUCTION: "Payment Received",
  IN_PRODUCTION: "In Production",
  AT_CHINA_WAREHOUSE: "China Warehouse",
  INTERNATIONAL_TRANSIT: "International Transit",
  OUT_FOR_LOCAL_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

const ORDER_STATUS_DOT: Record<string, string> = {
  AWAITING_PRODUCTION: "bg-amber-400",
  IN_PRODUCTION: "bg-orange-400",
  AT_CHINA_WAREHOUSE: "bg-yellow-400",
  INTERNATIONAL_TRANSIT: "bg-blue-400",
  OUT_FOR_LOCAL_DELIVERY: "bg-indigo-400",
  DELIVERED: "bg-green-400",
};

function daysSince(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

function AgeIndicator({ date }: { date: Date }) {
  const days = daysSince(date);
  if (days < 2) return null;
  const color = days >= 5 ? "text-red-600 bg-red-50 border-red-200" : "text-amber-600 bg-amber-50 border-amber-200";
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${color}`}>
      {days}d old
    </span>
  );
}

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  const [rfqs, orders, pendingRFQCount, quotedCount, activeOrderCount, deliveredCount] =
    await Promise.all([
      prisma.rFQ.findMany({
        where: { status: "PENDING_REVIEW" },
        include: { user: { select: { name: true } }, quotation: true },
        orderBy: { createdAt: "asc" },
        take: 5,
      }),
      prisma.order.findMany({
        where: { status: { not: "DELIVERED" } },
        include: {
          user: { select: { name: true } },
          quotation: {
            include: {
              rfq: { select: { productName: true } },
              factory: { select: { name: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.rFQ.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.rFQ.count({ where: { status: "QUOTED" } }),
      prisma.order.count({ where: { status: { not: "DELIVERED" } } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
    ]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Welcome back, {session.name}.
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending RFQs — amber when > 0 */}
        <div
          className={`rounded-xl border px-5 py-4 transition-colors ${
            pendingRFQCount > 0 ? "bg-amber-50 border-amber-200" : "bg-card"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className={`text-xs font-medium uppercase tracking-wide ${
              pendingRFQCount > 0 ? "text-amber-700" : "text-muted-foreground"
            }`}>
              Pending RFQs
            </p>
            {pendingRFQCount > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            )}
          </div>
          <p className={`text-4xl font-bold tabular-nums ${pendingRFQCount > 0 ? "text-amber-700" : ""}`}>
            {pendingRFQCount}
          </p>
          <p className={`text-xs mt-2 ${pendingRFQCount > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
            {pendingRFQCount > 0 ? "Need your quotation" : "All caught up"}
          </p>
        </div>

        {/* Quotes Sent */}
        <div className="rounded-xl border bg-card px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Quotes Sent</p>
          <p className="text-4xl font-bold tabular-nums">{quotedCount}</p>
          <p className="text-xs text-muted-foreground mt-2">Awaiting client approval</p>
        </div>

        {/* Active Orders — blue when > 0 */}
        <div
          className={`rounded-xl border px-5 py-4 transition-colors ${
            activeOrderCount > 0 ? "bg-blue-50 border-blue-200" : "bg-card"
          }`}
        >
          <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${
            activeOrderCount > 0 ? "text-blue-600" : "text-muted-foreground"
          }`}>
            Active Orders
          </p>
          <p className={`text-4xl font-bold tabular-nums ${activeOrderCount > 0 ? "text-blue-700" : ""}`}>
            {activeOrderCount}
          </p>
          <p className="text-xs text-muted-foreground mt-2">In transit or production</p>
        </div>

        {/* Delivered — muted (historical) */}
        <div className="rounded-xl border bg-card px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Delivered</p>
          <p className="text-4xl font-bold tabular-nums text-muted-foreground">{deliveredCount}</p>
          <p className="text-xs text-muted-foreground mt-2">All time</p>
        </div>
      </div>

      {/* ── Incoming RFQs ── */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-amber-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Incoming RFQs
                {pendingRFQCount > 0 && (
                  <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {pendingRFQCount}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {pendingRFQCount > 5
                  ? `Showing 5 of ${pendingRFQCount} pending — oldest first`
                  : "Requests needing a quotation · oldest first"}
              </CardDescription>
            </div>
            <ButtonLink href="/dashboard/admin/rfqs" variant="outline" size="sm">
              View all
            </ButtonLink>
          </div>
        </CardHeader>

        {rfqs.length === 0 ? (
          <CardContent className="py-10">
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <span className="text-xl">🎉</span>
              <span>No pending RFQs — all caught up!</span>
            </div>
          </CardContent>
        ) : (
          <div>
            {rfqs.map((rfq, idx) => (
              <div key={rfq.id}>
                {idx > 0 && <Separator />}
                <div className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-amber-50/40 transition-colors border-l-4 border-l-amber-400">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{rfq.productName}</p>
                      <AgeIndicator date={rfq.createdAt} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rfq.user.name} · {rfq.quantity.toLocaleString()} units ·{" "}
                      {new Date(rfq.createdAt).toLocaleDateString("en-US", {
                        day: "numeric", month: "short",
                      })}
                    </p>
                  </div>
                  <ButtonLink href={`/dashboard/admin/rfqs/${rfq.id}`} size="sm">
                    Quote →
                  </ButtonLink>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Active Shipments ── */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-blue-50/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Active Shipments
                {activeOrderCount > 0 && (
                  <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {activeOrderCount}
                  </span>
                )}
              </CardTitle>
              <CardDescription>Update statuses to keep clients informed.</CardDescription>
            </div>
            <ButtonLink href="/dashboard/admin/orders" variant="outline" size="sm">
              View all
            </ButtonLink>
          </div>
        </CardHeader>

        {orders.length === 0 ? (
          <CardContent className="py-10">
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              No active orders yet.
            </div>
          </CardContent>
        ) : (
          <div>
            {orders.map((order, idx) => {
              const statusLabel = ORDER_STATUS_LABELS[order.status] ?? order.status.replace(/_/g, " ");
              const dotColor = ORDER_STATUS_DOT[order.status] ?? "bg-muted-foreground";
              return (
                <div key={order.id}>
                  {idx > 0 && <Separator />}
                  <div className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-blue-50/30 transition-colors border-l-4 border-l-blue-400">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {order.quotation.rfq.productName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.user.name}
                        {order.quotation.factory && (
                          <span> · 🏭 {order.quotation.factory.name}</span>
                        )}
                        {" · "}
                        {new Date(order.updatedAt).toLocaleDateString("en-US", {
                          day: "numeric", month: "short",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {statusLabel}
                        </span>
                      </div>
                      <ButtonLink
                        href={`/dashboard/admin/orders/${order.id}`}
                        size="sm"
                        variant="outline"
                      >
                        Update →
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
