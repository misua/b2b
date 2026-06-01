import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Separator } from "@/components/ui/separator";
import { ButtonLink } from "@/components/ui/button-link";
import { ActivityTimeline } from "@/components/admin/activity-timeline";
import { FactoryNoteForm } from "@/components/admin/factory-note-form";
import { deleteFactoryNoteDirect } from "@/actions/factory";
import type { TimelineEvent } from "@/components/admin/activity-timeline";

export const metadata: Metadata = {
  title: "Factory History | Admin | B2B Sourcing Portal",
};

function fmtCurrency(n: number) {
  return n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function FactoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const factory = await prisma.factory.findUnique({
    where: { id },
    include: {
      factoryNotes: { orderBy: { createdAt: "desc" } },
      quotations: {
        include: {
          rfq: { include: { user: { select: { name: true } } } },
          order: { include: { statusLogs: { orderBy: { changedAt: "asc" } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!factory) notFound();

  // ── Timeline events ────────────────────────────────────────────────────────
  const events: TimelineEvent[] = [];

  for (const quotation of factory.quotations) {
    const rfq = quotation.rfq;
    const clientName = rfq.user.name;

    events.push({
      type: "rfq_assigned",
      id: `rfq-${rfq.id}`,
      timestamp: quotation.createdAt,
      productName: rfq.productName,
      quantity: rfq.quantity,
      clientName,
      quotationId: quotation.id,
    });

    events.push({
      type: "quotation_sent",
      id: `quot-${quotation.id}`,
      timestamp: quotation.createdAt,
      productName: rfq.productName,
      quantity: rfq.quantity,
      totalCost: Number(quotation.totalCost),
      clientName,
    });

    if (quotation.isApproved && quotation.order) {
      events.push({
        type: "payment_received",
        id: `pay-${quotation.id}`,
        timestamp: quotation.order.createdAt,
        productName: rfq.productName,
        totalCost: Number(quotation.totalCost),
        clientName,
        orderId: quotation.order.id,
      });

      for (const log of quotation.order.statusLogs) {
        events.push({
          type: "status_change",
          id: log.id,
          timestamp: log.changedAt,
          productName: rfq.productName,
          fromStatus: log.fromStatus,
          toStatus: log.toStatus,
          orderId: quotation.order.id,
        });
      }
    }
  }

  for (const note of factory.factoryNotes) {
    events.push({
      type: "note",
      id: note.id,
      timestamp: note.createdAt,
      content: note.content,
      factoryId: factory.id,
    });
  }

  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // ── Stats ─────────────────────────────────────────────────────────────────
  // Total quoted = all quotations assigned to factory (regardless of approval)
  const totalQuotedValue = factory.quotations.reduce(
    (sum, q) => sum + Number(q.totalCost),
    0
  );
  // Confirmed = client approved and payment submitted
  const confirmedValue = factory.quotations
    .filter((q) => q.isApproved)
    .reduce((sum, q) => sum + Number(q.totalCost), 0);

  const totalOrders = factory.quotations.filter((q) => q.isApproved).length;
  const activeOrders = factory.quotations.filter(
    (q) => q.order && q.order.status !== "DELIVERED"
  ).length;
  const completedOrders = factory.quotations.filter(
    (q) => q.order?.status === "DELIVERED"
  ).length;
  const firstOrder = [...factory.quotations]
    .filter((q) => q.isApproved)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

  const hasContact = factory.contactPerson || factory.email || factory.whatsapp;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <nav className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
            <Link href="/dashboard/admin" className="hover:text-foreground transition-colors">Dashboard</Link>
            <span>›</span>
            <Link href="/dashboard/admin/factories" className="hover:text-foreground transition-colors">Factories</Link>
            <span>›</span>
            <span className="text-foreground font-medium">{factory.name}</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
              🏭
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{factory.name}</h1>
              <p className="text-sm text-muted-foreground">
                Registered{" "}
                {new Date(factory.createdAt).toLocaleDateString("en-US", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
        <ButtonLink href="/dashboard/admin/factories" variant="outline" size="sm">
          ← Factories
        </ButtonLink>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Orders", value: totalOrders.toString(), color: "text-foreground" },
          { label: "Active", value: activeOrders.toString(), color: "text-blue-600" },
          { label: "Delivered", value: completedOrders.toString(), color: "text-green-600" },
          {
            label: "Confirmed Value",
            value: `₱${fmtCurrency(confirmedValue)}`,
            color: "text-foreground",
            sub: totalQuotedValue !== confirmedValue
              ? `₱${fmtCurrency(totalQuotedValue)} quoted`
              : undefined,
          },
        ].map(({ label, value, color, sub }) => (
          <div
            key={label}
            className="rounded-xl border bg-card px-4 py-3"
          >
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Contact card */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <p className="text-sm font-semibold">Contact Details</p>
            </div>
            <div className="p-4 space-y-3">
              {hasContact ? (
                <>
                  {factory.contactPerson && (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm shrink-0">
                        👤
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Contact</p>
                        <p className="text-sm font-medium truncate">{factory.contactPerson}</p>
                      </div>
                    </div>
                  )}
                  {factory.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm shrink-0">
                        ✉️
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <a
                          href={`mailto:${factory.email}`}
                          className="text-sm font-medium text-primary hover:underline underline-offset-2 truncate block"
                        >
                          {factory.email}
                        </a>
                      </div>
                      <a
                        href={`mailto:${factory.email}`}
                        className="shrink-0 text-xs px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                      >
                        Email
                      </a>
                    </div>
                  )}
                  {factory.whatsapp && (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-sm shrink-0">
                        💬
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">WhatsApp</p>
                        <p className="text-sm font-medium">{factory.whatsapp}</p>
                      </div>
                      <a
                        href={`https://wa.me/${factory.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs px-2.5 py-1 rounded-md bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
                      >
                        Chat
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-2">
                  No contact details yet.{" "}
                  <Link
                    href="/dashboard/admin/factories"
                    className="text-primary underline underline-offset-2"
                  >
                    Edit factory →
                  </Link>
                </p>
              )}

              {factory.notes && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                    <p className="text-xs font-medium text-amber-800 mb-1">Internal Notes</p>
                    <p className="text-xs text-amber-700 leading-relaxed">{factory.notes}</p>
                  </div>
                </>
              )}

              {firstOrder && (
                <>
                  <Separator />
                  <p className="text-xs text-muted-foreground text-center">
                    First order:{" "}
                    <span className="font-medium text-foreground">
                      {new Date(firstOrder.createdAt).toLocaleDateString("en-US", {
                        month: "long", year: "numeric",
                      })}
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Add note */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <p className="text-sm font-semibold">Add a Note</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Log calls, delays, or any update about this factory.
              </p>
            </div>
            <div className="p-4">
              <FactoryNoteForm factoryId={factory.id} />
            </div>
          </div>
        </div>

        {/* ── Right: Timeline ── */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border bg-card overflow-hidden h-full">
            <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Activity History</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {events.length > 0
                    ? `${events.length} events · newest first`
                    : "No activity yet"}
                </p>
              </div>
              {events.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {events.length}
                </span>
              )}
            </div>
            <div className="p-4">
              <ActivityTimeline
                events={events}
                deleteNoteAction={deleteFactoryNoteDirect}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
