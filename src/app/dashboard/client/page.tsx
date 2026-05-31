import type { Metadata } from "next";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { RFQActivityList } from "@/components/client/rfq-activity-list";

export const metadata: Metadata = { title: "My Dashboard | B2B Sourcing Portal" };

export default async function ClientDashboardPage() {
  const session = await requireClient();

  const [pendingReviewCount, pendingApprovalCount, activeOrderCount, rfqs] =
    await Promise.all([
      prisma.rFQ.count({ where: { userId: session.userId, status: "PENDING_REVIEW" } }),
      prisma.quotation.count({ where: { isApproved: false, rfq: { userId: session.userId } } }),
      prisma.order.count({ where: { userId: session.userId, status: { not: "DELIVERED" } } }),
      // Use select (not include) so Decimal fields are never sent to the client component
      prisma.rFQ.findMany({
        where: { userId: session.userId },
        select: {
          id: true,
          productName: true,
          quantity: true,
          status: true,
          createdAt: true,
          quotation: {
            select: {
              id: true,
              isApproved: true,
              order: { select: { id: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {session.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your sourcing requests and track your shipments.
          </p>
        </div>
        <ButtonLink href="/dashboard/client/rfq/new">+ New RFQ</ButtonLink>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Review — neutral */}
        <div className="rounded-xl border bg-card px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Pending Review
          </p>
          <p className="text-4xl font-bold tabular-nums">{pendingReviewCount}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Submitted — waiting for quotation
          </p>
        </div>

        {/* Awaiting Approval — urgent when > 0 */}
        <div
          className={`rounded-xl border px-5 py-4 transition-colors ${
            pendingApprovalCount > 0
              ? "bg-blue-50 border-blue-200"
              : "bg-card"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className={`text-xs font-medium uppercase tracking-wide ${
              pendingApprovalCount > 0 ? "text-blue-600" : "text-muted-foreground"
            }`}>
              Awaiting Your Approval
            </p>
            {pendingApprovalCount > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
            )}
          </div>
          <p className={`text-4xl font-bold tabular-nums ${
            pendingApprovalCount > 0 ? "text-blue-700" : ""
          }`}>
            {pendingApprovalCount}
          </p>
          <p className={`text-xs mt-2 ${
            pendingApprovalCount > 0
              ? "text-blue-600 font-medium"
              : "text-muted-foreground"
          }`}>
            {pendingApprovalCount > 0
              ? "Action needed — review and pay to proceed"
              : "No quotations awaiting approval"}
          </p>
        </div>

        {/* Active Orders */}
        <div className="rounded-xl border bg-card px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Active Orders
          </p>
          <p className="text-4xl font-bold tabular-nums">{activeOrderCount}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {activeOrderCount > 0 ? "In transit or production" : "No active orders"}
          </p>
        </div>
      </div>

      {/* ── Activity list with filter tabs ── */}
      <Card className="overflow-hidden p-0">
        <CardHeader className="px-6 pt-5 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Requests</CardTitle>
              <CardDescription>
                All your sourcing requests and their current status.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {rfqs.length === 0 ? (
          <CardContent className="py-14">
            <div className="flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                📦
              </div>
              <p className="font-medium">No activity yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Submit your first RFQ and we&apos;ll get back to you with a
                detailed quotation within 1–2 business days.
              </p>
              <ButtonLink href="/dashboard/client/rfq/new" variant="outline" size="sm">
                Submit RFQ
              </ButtonLink>
            </div>
          </CardContent>
        ) : (
          <RFQActivityList rfqs={rfqs} />
        )}
      </Card>
    </div>
  );
}
