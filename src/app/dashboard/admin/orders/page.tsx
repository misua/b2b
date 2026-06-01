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
  QUOTATION_READY:        "Quoted",
  AWAITING_PRODUCTION:    "Paid",
  IN_PRODUCTION:          "In Production",
  AT_CHINA_WAREHOUSE:     "China Warehouse",
  INTERNATIONAL_TRANSIT:  "In Transit",
  OUT_FOR_LOCAL_DELIVERY: "Out for Delivery",
  DELIVERED:              "Delivered",
};

const STATUS_ICONS: Record<string, string> = {
  REQUIREMENTS_SUBMITTED: "📋",
  QUOTATION_READY:        "💰",
  AWAITING_PRODUCTION:    "✅",
  IN_PRODUCTION:          "🏭",
  AT_CHINA_WAREHOUSE:     "🏬",
  INTERNATIONAL_TRANSIT:  "🚢",
  OUT_FOR_LOCAL_DELIVERY: "🚚",
  DELIVERED:              "🎉",
};

function OrderCard({ order }: { order: Awaited<ReturnType<typeof getOrders>>[0] }) {
  const isDelivered = order.status === "DELIVERED";

  return (
    <Card
      className={`transition-shadow ${
        isDelivered
          ? "border-green-200 bg-green-50/30 hover:shadow-md hover:shadow-green-100"
          : "hover:shadow-md"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base truncate flex items-center gap-2">
              {order.quotation.rfq.productName}
              {isDelivered && (
                <span className="text-green-600 text-sm font-normal">✓ Delivered</span>
              )}
            </CardTitle>
            <CardDescription>
              {order.user.name} · {order.quotation.rfq.quantity.toLocaleString()} units
              {order.quotation.factory && (
                <span> · 🏭 {order.quotation.factory.name}</span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg">{STATUS_ICONS[order.status]}</span>
            <Badge
              className={
                isDelivered
                  ? "bg-green-100 text-green-800 border-green-300 font-semibold"
                  : "bg-primary/10 text-primary border-primary/20"
              }
            >
              {STATUS_LABELS[order.status] ?? order.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <Separator className={isDelivered ? "bg-green-200" : ""} />
      <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <div>
            <span className="text-foreground font-medium">Total: </span>
            ₱{Number(order.quotation.totalCost).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
          </div>
          <div>
            <span className="text-foreground font-medium">
              {isDelivered ? "Delivered: " : "Last updated: "}
            </span>
            {new Date(order.updatedAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
          {order.quotation.paymentProof && (
            <div>
              <a
                href={order.quotation.paymentProof}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 font-medium hover:opacity-80 flex items-center gap-1"
              >
                🧾 View Receipt
              </a>
            </div>
          )}
        </div>
        <ButtonLink
          href={`/dashboard/admin/orders/${order.id}`}
          size="sm"
          variant={isDelivered ? "outline" : "default"}
        >
          {isDelivered ? "View Details" : "Manage Status →"}
        </ButtonLink>
      </CardContent>
    </Card>
  );
}

async function getOrders() {
  return prisma.order.findMany({
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
}

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getOrders();

  const activeOrders = orders.filter((o) => o.status !== "DELIVERED");
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <nav className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
          <Link href="/dashboard/admin" className="hover:text-foreground">Dashboard</Link>
          <span>›</span>
          <span className="text-foreground">All Orders</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {orders.length} total · {activeOrders.length} active · {deliveredOrders.length} delivered
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
        <>
          {/* Active orders */}
          {activeOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Active — {activeOrders.length}
              </h2>
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}

          {/* Delivered orders */}
          {deliveredOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wide flex items-center gap-2">
                <span>✓</span>
                <span>Delivered — {deliveredOrders.length}</span>
              </h2>
              {deliveredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
