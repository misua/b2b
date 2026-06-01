import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NavHeader } from "@/components/layout/nav-header";
import { NotificationsBar } from "@/components/layout/notifications-bar";
import { AutoRefresh } from "@/components/ui/auto-refresh";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  // Count RFQs that need admin attention:
  // - PENDING_REVIEW: new RFQs awaiting quotation
  // - COUNTER_OFFERED: client has submitted a counter-offer awaiting response
  const pendingRfqCount =
    session.role === "ADMIN"
      ? await prisma.rFQ.count({
          where: { status: { in: ["PENDING_REVIEW", "COUNTER_OFFERED"] } },
        })
      : 0;

  return (
    <div className="min-h-screen brand-gradient-subtle">
      <NavHeader
        userName={session.name}
        userEmail={session.email}
        role={session.role}
        pendingRfqCount={pendingRfqCount}
      />
      {/* Keeps notification pills, badge counts, and order statuses fresh */}
      <AutoRefresh intervalMs={15000} />
      <NotificationsBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
