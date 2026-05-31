import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MilestoneStepper } from "@/components/order-tracker/milestone-stepper";
import { StatusSelector } from "@/components/admin/status-selector";

export const metadata: Metadata = {
  title: "Manage Order | Admin | B2B Sourcing Portal",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      quotation: {
        include: {
          factory: { select: { name: true } },
          rfq: {
            select: {
              productName: true,
              quantity: true,
              specifications: true,
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground flex items-center gap-2">
        <Link href="/dashboard/admin" className="hover:text-foreground">Dashboard</Link>
        <span>›</span>
        <Link href="/dashboard/admin/orders" className="hover:text-foreground">Orders</Link>
        <span>›</span>
        <span className="text-foreground truncate max-w-48">
          {order.quotation.rfq.productName}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: order tracker preview ── */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{order.quotation.rfq.productName}</CardTitle>
              <CardDescription>
                Client: {order.user.name} ({order.user.email})
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 flex flex-wrap gap-6 text-sm mb-2">
              <div>
                <p className="text-xs text-muted-foreground">Quantity</p>
                <p className="font-semibold">
                  {order.quotation.rfq.quantity.toLocaleString()} units
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="font-semibold">
                  ${Number(order.quotation.totalCost).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              {order.quotation.factory && (
                <div>
                  <p className="text-xs text-muted-foreground">Factory</p>
                  <p className="font-semibold flex items-center gap-1">
                    <span>🏭</span>
                    <span>{order.quotation.factory.name}</span>
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Order Created</p>
                <p className="font-semibold">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment receipt — shown prominently when available */}
          {order.quotation.paymentProof && (
            <div className="rounded-xl border-2 border-green-200 bg-green-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-lg shrink-0">
                    🧾
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-800">Payment Receipt Submitted</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Client has uploaded proof of payment
                    </p>
                  </div>
                </div>
                <a
                  href={order.quotation.paymentProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm shrink-0"
                >
                  View Receipt →
                </a>
              </div>
            </div>
          )}

          {/* Live preview of what the client sees */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Client View Preview</CardTitle>
                <Badge variant="outline" className="text-xs">Live</Badge>
              </div>
              <CardDescription>
                This is exactly what the client sees on their tracker.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <MilestoneStepper
                currentStatus={order.status}
                updatedAt={order.updatedAt}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Right: status management ── */}
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Update Order Status</CardTitle>
              <CardDescription>
                Select the new milestone. The client&apos;s tracker updates instantly.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-6">
              <StatusSelector
                orderId={order.id}
                currentStatus={order.status}
              />

              <Separator />

              {/* Quick status guide */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status Guide
                </p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p>🏭 <strong>In Production</strong> — Factory confirmed start</p>
                  <p>🏬 <strong>China Warehouse</strong> — QC passed, packed for export</p>
                  <p>🚢 <strong>International Transit</strong> — Booking confirmed, in transit</p>
                  <p>🚚 <strong>Out for Delivery</strong> — Local courier has the package</p>
                  <p>🎉 <strong>Delivered</strong> — Client has confirmed receipt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
