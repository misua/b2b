import type { OrderStatus } from "@prisma/client";

// ─── Step definitions ─────────────────────────────────────────────────────────

interface Step {
  status: OrderStatus;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

const STEPS: Step[] = [
  {
    status: "REQUIREMENTS_SUBMITTED",
    label: "Requirements Submitted",
    shortLabel: "Submitted",
    icon: "📋",
    description: "Your sourcing request has been received.",
  },
  {
    status: "QUOTATION_READY",
    label: "Quotation Ready",
    shortLabel: "Quoted",
    icon: "💰",
    description: "Your cost breakdown is ready for review.",
  },
  {
    status: "AWAITING_PRODUCTION",
    label: "Payment Received",
    shortLabel: "Paid",
    icon: "✅",
    description: "Payment confirmed. Production will begin shortly.",
  },
  {
    status: "IN_PRODUCTION",
    label: "In Production",
    shortLabel: "Producing",
    icon: "🏭",
    description: "Your order is being manufactured at the factory.",
  },
  {
    status: "AT_CHINA_WAREHOUSE",
    label: "China Warehouse",
    shortLabel: "China Whse",
    icon: "🏬",
    description: "Goods have arrived at the export warehouse.",
  },
  {
    status: "INTERNATIONAL_TRANSIT",
    label: "International Transit",
    shortLabel: "In Transit",
    icon: "🚢",
    description: "Your shipment is on its way internationally.",
  },
  {
    status: "OUT_FOR_LOCAL_DELIVERY",
    label: "Out for Delivery",
    shortLabel: "Out for Delivery",
    icon: "🚚",
    description: "Your package is with the local courier.",
  },
  {
    status: "DELIVERED",
    label: "Delivered",
    shortLabel: "Arrived",
    icon: "🎉",
    description: "Your order has been delivered. Enjoy!",
  },
];

// ─── Index helpers ────────────────────────────────────────────────────────────

function getStepIndex(status: OrderStatus): number {
  return STEPS.findIndex((s) => s.status === status);
}

// ─── Step state types ─────────────────────────────────────────────────────────

type StepState = "completed" | "current" | "upcoming";

function getStepState(stepIdx: number, currentIdx: number): StepState {
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "current";
  return "upcoming";
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MilestoneStepperProps {
  currentStatus: OrderStatus;
  updatedAt: Date;
}

export function MilestoneStepper({ currentStatus, updatedAt }: MilestoneStepperProps) {
  const currentIdx = getStepIndex(currentStatus);
  const currentStep = STEPS[currentIdx];
  const isDelivered = currentStatus === "DELIVERED";
  const progress = ((currentIdx) / (STEPS.length - 1)) * 100;

  return (
    <div className="space-y-6">
      {/* ── Status headline ── */}
      <div
        className={`rounded-xl px-5 py-4 flex items-center gap-4 ${
          isDelivered
            ? "bg-green-50 border border-green-200"
            : "bg-primary/5 border border-primary/20"
        }`}
      >
        <span className="text-3xl">{currentStep?.icon}</span>
        <div>
          <p
            className={`font-semibold text-base ${
              isDelivered ? "text-green-800" : "text-foreground"
            }`}
          >
            {currentStep?.label}
          </p>
          <p
            className={`text-sm mt-0.5 ${
              isDelivered ? "text-green-700" : "text-muted-foreground"
            }`}
          >
            {currentStep?.description}
          </p>
        </div>
        <div className="ml-auto text-right shrink-0">
          <p className="text-xs text-muted-foreground">Last updated</p>
          <p className="text-xs font-medium">
            {new Date(updatedAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Submitted</span>
          <span>Delivered</span>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
              isDelivered ? "bg-green-500" : "bg-primary"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          Step {currentIdx + 1} of {STEPS.length}
        </p>
      </div>

      {/* ── Vertical milestone list ── */}
      <ol className="relative space-y-0">
        {STEPS.map((step, idx) => {
          const state = getStepState(idx, currentIdx);
          const isLast = idx === STEPS.length - 1;

          return (
            <li key={step.status} className="relative flex gap-4">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-[18px] top-9 bottom-0 w-px">
                  <div
                    className={`h-full w-full transition-colors duration-300 ${
                      state === "completed" ? "bg-primary" : "bg-border"
                    }`}
                  />
                </div>
              )}

              {/* Step indicator */}
              <div className="relative z-10 shrink-0 mt-1">
                {state === "completed" ? (
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <svg
                      className="w-4 h-4 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : state === "current" ? (
                  <div
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-md ${
                      isDelivered
                        ? "border-green-500 bg-green-50"
                        : "border-primary bg-primary/10"
                    }`}
                  >
                    <span className="text-base leading-none">{step.icon}</span>
                    {/* Pulse ring */}
                    {!isDelivered && (
                      <span className="absolute w-9 h-9 rounded-full border-2 border-primary animate-ping opacity-30" />
                    )}
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full border-2 border-border bg-background flex items-center justify-center opacity-50">
                    <span className="text-sm leading-none">{step.icon}</span>
                  </div>
                )}
              </div>

              {/* Step content */}
              <div
                className={`pb-7 pt-1 flex-1 min-w-0 ${
                  isLast ? "pb-0" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm font-medium leading-tight ${
                      state === "current"
                        ? isDelivered
                          ? "text-green-700"
                          : "text-primary font-semibold"
                        : state === "completed"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  {state === "current" && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        isDelivered
                          ? "bg-green-100 text-green-700"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isDelivered ? "Complete" : "Current"}
                    </span>
                  )}
                </div>
                {state !== "upcoming" && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Export step data for reuse ───────────────────────────────────────────────
export { STEPS, getStepIndex };
export type { Step };
