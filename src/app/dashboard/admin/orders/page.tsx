import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "All Orders | Admin | B2B Sourcing Portal",
};

const STATUS_LABELS: Record<string, string> = {
  REQUIREMENTS_SUBMITTED: "Submitted",
  QUOTATION_READY: "Quoted",
  AWAITING_PRODUCTION: "Paid",
  IN_PRODUCTION: "In Production",
  AT_CHINA_WAREHOUSE: "China Warehouse",
  INTERNATIONAL_TRANSIT: "In Transit",
  OUT_FOR_LOCAL_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

const STATUS_ICONS: Record<string, string> = {
  REQUIREMENTS_SUBMITTED: "📋",
  QUOTATION_READY: "💰",
  AWAITING_PRODUCTION: "✅",
  IN_PRODUCTION: "🏭",
  AT_CHINA_WAREHOUSE: "🏬",
  INTERNATIONAL_TRANSIT: "🚢",
  OUT_FOR_LOCAL_DELIVERY: "🚚",
  DELIVERED: "🎉",
};

export default async function AdminOrdersPage() {
  await requireAdmin();

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      quotation: {
        include: {
          rfq: { select: { productName: true, quantity: true } },
          factory: { select: { name: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const activeCount = orders.filter((o) => o.status !== "DELIVERED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
          <Link href="/dashboard/admin" className="hover:text-foreground">Dashboard</Link>
          <span>›</span>
          <span className="text-foreground">All Orders</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {orders.length} total · {activeCount} active
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="text-4xl">📦</div>
            <p className="font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground">
              Orders are created when clients approve a quotation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {order.quotation.rfq.productName}
                    </CardTitle>
                    <CardDescription>
                      {order.user.name} · {order.quotation.rfq.quantity.toLocaleString()} units
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-lg">{STATUS_ICONS[order.status]}</span>
                    <Badge
                      className={
                        order.status === "DELIVERED"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-primary/10 text-primary border-primary/20"
                      }
                    >
                      {STATUS_LABELS[order.status] ?? order.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <div>
                    <span className="text-foreground font-medium">Total: </span>
                    ${Number(order.quotation.totalCost).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <div>
                    <span className="text-foreground font-medium">Last updated: </span>
                    {new Date(order.updatedAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  {order.quotation.factory && (
                    <div>
                      <span className="text-foreground font-medium">Factory: </span>
                      🏭 {order.quotation.factory.name}
                    </div>
                  )}
                </div>
                <ButtonLink
                  href={`/dashboard/admin/orders/${order.id}`}
                  size="sm"
                >
                  Manage Status →
                </ButtonLink>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
