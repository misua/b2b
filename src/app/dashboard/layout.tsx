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

  const pendingRfqCount =
    session.role === "ADMIN"
      ? await prisma.rFQ.count({ where: { status: "PENDING_REVIEW" } })
      : 0;

  return (
    <div className="min-h-screen brand-gradient-subtle">
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
