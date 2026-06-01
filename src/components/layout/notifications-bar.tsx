import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { DismissiblePill } from "./dismissible-pill";

interface Notification {
  id: string;
  type: "quotation_ready" | "order_update";
  label: string;
  href: string;
  icon: string;
  cta: string;
}

export async function NotificationsBar() {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") return null;

  const [pendingQuotations, activeOrders] = await Promise.all([
    // Quotations ready for the client to review — not yet approved
    prisma.quotation.findMany({
      where: {
        isApproved: false,
        // QUOTED = new quote ready | REVISED = admin responded to counter-offer
        rfq: {
          userId: session.userId,
          status: { in: ["QUOTED"] },
        },
        negotiationStatus: { in: ["SENT", "REVISED"] },
      },
      select: {
        id: true,
        negotiationStatus: true,
        rfq: { select: { productName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Orders that are actively moving (not delivered, not just paid)
    prisma.order.findMany({
      where: {
        userId: session.userId,
        status: {
          notIn: ["DELIVERED", "REQUIREMENTS_SUBMITTED", "AWAITING_PRODUCTION"],
        },
      },
      include: {
        quotation: { include: { rfq: { select: { productName: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const notifications: Notification[] = [
    ...pendingQuotations.map((q) => ({
      id: `quot-${q.id}`,
      type: "quotation_ready" as const,
      label: q.negotiationStatus === "REVISED"
        ? `Updated quote: ${q.rfq.productName}`
        : `Quotation ready: ${q.rfq.productName}`,
      href: `/dashboard/client/quotations/${q.id}`,
      icon: q.negotiationStatus === "REVISED" ? "🔄" : "💰",
      cta: "Review →",
    })),
    ...activeOrders.map((o) => ({
      id: `order-${o.id}`,
      type: "order_update" as const,
      label: `${o.status.replace(/_/g, " ")}: ${o.quotation.rfq.productName}`,
      href: `/dashboard/client/orders/${o.id}`,
      icon: "📦",
      cta: "Track →",
    })),
  ];

  if (notifications.length === 0) return null;

  return (
    <div className="border-b bg-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap gap-2">
        {notifications.map((n) => (
          <DismissiblePill key={n.id} id={n.id} href={n.href}>
            <span>{n.icon}</span>
            <span className="text-muted-foreground line-clamp-1 max-w-[180px]">
              {n.label}
            </span>
            <span className="text-primary font-semibold shrink-0">{n.cta}</span>
          </DismissiblePill>
        ))}
      </div>
    </div>
  );
}
