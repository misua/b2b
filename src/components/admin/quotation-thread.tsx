"use client";

import { useActionState, useRef, useEffect } from "react";
import { sendAdminMessage } from "@/actions/quotation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AdminMessageState } from "@/actions/quotation";

interface Message {
  id: string;
  senderRole: "CLIENT" | "ADMIN";
  senderName: string;
  content: string;
  targetPrice: number | null;
  createdAt: Date;
}

interface QuotationThreadProps {
  quotationId: string;
  messages: Message[];
  hasCounterOffer: boolean; // whether negotiationStatus === "COUNTER_OFFERED"
}

function fmt(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function QuotationThread({ quotationId, messages, hasCounterOffer }: QuotationThreadProps) {
  const [state, formAction, isPending] = useActionState<AdminMessageState, FormData>(
    sendAdminMessage,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <div className="space-y-4">
      {/* Counter-offer alert */}
      {hasCounterOffer && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-3 flex items-center gap-3">
          <span className="text-xl shrink-0">🔔</span>
          <div>
            <p className="text-sm font-semibold text-orange-800">Client has submitted a counter-offer</p>
            <p className="text-xs text-orange-700 mt-0.5">
              Review their message below, then revise the quotation or send a reply.
              The Approve button is disabled for the client until you respond.
            </p>
          </div>
        </div>
      )}

      {/* Message thread */}
      {messages.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-3">
          No messages yet — thread starts when the quotation is sent.
        </p>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isAdmin = msg.senderRole === "ADMIN";
            return (
              <div
                key={msg.id}
                className={`rounded-lg px-3 py-2.5 ${
                  isAdmin
                    ? "bg-muted/50 border border-border"
                    : "bg-orange-50 border border-orange-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-xs font-semibold ${isAdmin ? "text-foreground" : "text-orange-800"}`}>
                    {isAdmin ? `${msg.senderName} (Admin)` : msg.senderName}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString("en-US", {
                      day: "numeric", month: "short",
                    })}{" "}
                    {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${isAdmin ? "text-foreground" : "text-orange-900"}`}>
                  {msg.content}
                </p>
                {msg.targetPrice != null && (
                  <p className="text-xs font-semibold text-orange-700 mt-1">
                    Target price: {fmt(msg.targetPrice)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin reply form */}
      <form ref={formRef} action={formAction} className="space-y-2">
        <input type="hidden" name="quotationId" value={quotationId} />
        <Label className="text-xs font-medium text-muted-foreground">Send a message (without changing costs)</Label>
        <div className="flex gap-2">
          <textarea
            name="content"
            rows={2}
            placeholder="e.g. We'll review your request and get back to you shortly…"
            disabled={isPending}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none"
          />
          <Button type="submit" size="sm" disabled={isPending} className="self-end shrink-0">
            {isPending ? "…" : "Send"}
          </Button>
        </div>
        {state?.errors?.content && (
          <p className="text-xs text-destructive">{state.errors.content[0]}</p>
        )}
        {state?.message && (
          <p className="text-xs text-destructive">{state.message}</p>
        )}
        {state?.success && (
          <p className="text-xs text-green-600">✓ Message sent.</p>
        )}
      </form>
    </div>
  );
}
