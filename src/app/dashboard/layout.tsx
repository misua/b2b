import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NavHeader } from "@/components/layout/nav-header";
import { NotificationsBar } from "@/components/layout/notifications-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  // Fetch pending RFQ count for admins only — used to show the notification
  // badge on the RFQs nav link. Zero for clients (no extra DB call needed).
  const pendingRfqCount =
    session.role === "ADMIN"
      ? await prisma.rFQ.count({ where: { status: "PENDING_REVIEW" } })
      : 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <NavHeader
        userName={session.name}
        userEmail={session.email}
        role={session.role}
        pendingRfqCount={pendingRfqCount}
      />
      <NotificationsBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
