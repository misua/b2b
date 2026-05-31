import type { OrderStatus } from "@prisma/client";

export type TimelineEvent =
  | {
      type: "rfq_assigned";
      id: string;
      timestamp: Date;
      productName: string;
      quantity: number;
      clientName: string;
      quotationId: string;
    }
  | {
      type: "quotation_sent";
      id: string;
      timestamp: Date;
      productName: string;
      quantity: number;
      totalCost: number;
      clientName: string;
    }
  | {
      type: "payment_received";
      id: string;
      timestamp: Date;
      productName: string;
      totalCost: number;
      clientName: string;
      orderId: string;
    }
  | {
      type: "status_change";
      id: string;
      timestamp: Date;
      productName: string;
      fromStatus: OrderStatus | null;
      toStatus: OrderStatus;
      orderId: string;
    }
  | {
      type: "note";
      id: string;
      timestamp: Date;
      content: string;
      factoryId: string;
    };

const STATUS_LABELS: Record<string, string> = {
  REQUIREMENTS_SUBMITTED: "Requirements Submitted",
  QUOTATION_READY: "Quotation Ready",
  AWAITING_PRODUCTION: "Payment Confirmed",
  IN_PRODUCTION: "In Production",
  AT_CHINA_WAREHOUSE: "China Warehouse",
  INTERNATIONAL_TRANSIT: "International Transit",
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

// Color classes per status for the dot
const STATUS_DOT_COLORS: Record<string, string> = {
  IN_PRODUCTION: "bg-orange-100",
  AT_CHINA_WAREHOUSE: "bg-yellow-100",
  INTERNATIONAL_TRANSIT: "bg-blue-100",
  OUT_FOR_LOCAL_DELIVERY: "bg-indigo-100",
  DELIVERED: "bg-green-100",
  AWAITING_PRODUCTION: "bg-emerald-100",
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Timestamp column ──────────────────────────────────────────────────────────
function TimeStamp({ d }: { d: Date }) {
  return (
    <div className="text-right shrink-0 min-w-[80px]">
      <p className="text-xs text-muted-foreground">{formatDate(d)}</p>
      <p className="text-[10px] text-muted-foreground/70">{formatTime(d)}</p>
    </div>
  );
}

// ── Connector line ────────────────────────────────────────────────────────────
function Connector({ isLast }: { isLast: boolean }) {
  return (
    <div className="flex flex-col items-center">
      {!isLast && <div className="w-px flex-1 bg-border mt-1 min-h-[24px]" />}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerAction = (formData: FormData) => any;

interface EventCardProps {
  event: TimelineEvent;
  isLast: boolean;
  deleteNoteAction?: ServerAction;
}

function EventCard({ event, isLast, deleteNoteAction }: EventCardProps) {
  switch (event.type) {
    case "rfq_assigned":
      return (
        <div className="flex gap-3 min-h-[48px]">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-sm">
              📋
            </div>
            <Connector isLast={isLast} />
          </div>
          <div className="flex-1 min-w-0 pb-5 pt-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">RFQ Assigned to Factory</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground/80">{event.productName}</span>
                  {" · "}{event.quantity.toLocaleString()} units{" · "}{event.clientName}
                </p>
              </div>
              <TimeStamp d={event.timestamp} />
            </div>
          </div>
        </div>
      );

    case "quotation_sent":
      return (
        <div className="flex gap-3 min-h-[48px]">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-sm">
              💰
            </div>
            <Connector isLast={isLast} />
          </div>
          <div className="flex-1 min-w-0 pb-5 pt-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-blue-700">Quotation Sent to Client</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground/80">{event.productName}</span>
                  {" · "}{event.quantity.toLocaleString()} units{" · "}{event.clientName}
                </p>
                <p className="text-sm font-semibold text-blue-600 mt-1">${fmt(event.totalCost)}</p>
              </div>
              <TimeStamp d={event.timestamp} />
            </div>
          </div>
        </div>
      );

    case "payment_received":
      return (
        <div className="flex gap-3 min-h-[48px]">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-emerald-600 flex items-center justify-center text-sm shadow-sm shadow-emerald-200">
              ✓
            </div>
            <Connector isLast={isLast} />
          </div>
          {/* Green card for payment — most important financial event */}
          <div className="flex-1 min-w-0 pb-5 pt-0.5">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Payment Received</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {event.productName}{" · "}{event.clientName}
                  </p>
                  <p className="text-base font-bold text-emerald-700 mt-1">
                    ${fmt(event.totalCost)}
                  </p>
                </div>
                <TimeStamp d={event.timestamp} />
              </div>
            </div>
          </div>
        </div>
      );

    case "status_change": {
      const icon = STATUS_ICONS[event.toStatus] ?? "📦";
      const toLabel = STATUS_LABELS[event.toStatus] ?? event.toStatus.replace(/_/g, " ");
      const fromLabel = event.fromStatus
        ? STATUS_LABELS[event.fromStatus] ?? event.fromStatus.replace(/_/g, " ")
        : null;
      const dotColor = STATUS_DOT_COLORS[event.toStatus] ?? "bg-muted";
      const isDelivered = event.toStatus === "DELIVERED";

      return (
        <div className="flex gap-3 min-h-[48px]">
          <div className="flex flex-col items-center shrink-0">
            <div className={`w-8 h-8 rounded-full ${dotColor} border-2 border-border/50 flex items-center justify-center text-sm`}>
              {icon}
            </div>
            <Connector isLast={isLast} />
          </div>
          <div className="flex-1 min-w-0 pb-5 pt-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`text-sm font-medium ${isDelivered ? "text-green-700" : "text-foreground"}`}>
                  → {toLabel}
                </p>
                {fromLabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Previously: {fromLabel}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{event.productName}</p>
              </div>
              <TimeStamp d={event.timestamp} />
            </div>
          </div>
        </div>
      );
    }

    case "note":
      return (
        <div className="flex gap-3 min-h-[48px]">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-sm">
              📝
            </div>
            <Connector isLast={isLast} />
          </div>
          <div className="flex-1 min-w-0 pb-5 pt-0.5">
            {/* Sticky-note style card for human notes */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Note</span>
                  </div>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
                    {event.content}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <TimeStamp d={event.timestamp} />
                  {deleteNoteAction && (
                    <form action={deleteNoteAction}>
                      <input type="hidden" name="noteId" value={event.id} />
                      <input type="hidden" name="factoryId" value={event.factoryId} />
                      <button
                        type="submit"
                        className="text-[10px] text-amber-400 hover:text-destructive transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  deleteNoteAction?: ServerAction;
}

export function ActivityTimeline({ events, deleteNoteAction }: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
          🕐
        </div>
        <p className="text-sm font-medium">No activity yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Events appear here when RFQs are assigned to this factory, orders
          progress, or you add a note.
        </p>
      </div>
    );
  }

  return (
    <div>
      {events.map((event, idx) => (
        <EventCard
          key={`${event.type}-${event.id}`}
          event={event}
          isLast={idx === events.length - 1}
          deleteNoteAction={deleteNoteAction}
        />
      ))}
      <div className="flex gap-3 items-center pt-1">
        <div className="w-8 flex justify-center shrink-0">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-border" />
        </div>
        <p className="text-xs text-muted-foreground italic">Start of history</p>
      </div>
    </div>
  );
}
