"use client";

import { useActionState, useRef, useEffect } from "react";
import { sendAdminMessage } from "@/actions/quotation";
import { Button } from "@/components/ui/button";
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
  hasCounterOffer: boolean;
  isApproved?: boolean;
}

function fmtPrice(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtTime(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function QuotationThread({
  quotationId,
  messages,
  hasCounterOffer,
  isApproved = false,
}: QuotationThreadProps) {
  const [state, formAction, isPending] = useActionState<AdminMessageState, FormData>(
    sendAdminMessage,
    undefined
  );
  const formRef  = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="space-y-3">
      {/* Message list */}
      {messages.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">No messages yet.</p>
          <p className="text-xs mt-1">Send the first quotation to start the thread.</p>
        </div>
      ) : (
        <div ref={scrollRef} className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isAdmin  = msg.senderRole === "ADMIN";
            const isClient = msg.senderRole === "CLIENT";

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                  isAdmin
                    ? "bg-primary text-primary-foreground"
                    : "bg-orange-100 text-orange-800 border border-orange-300"
                }`}>
                  {initials(msg.senderName)}
                </div>

                {/* Bubble */}
                <div className={`max-w-[78%] space-y-1 ${isAdmin ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    isAdmin
                      ? "bg-primary/10 text-foreground rounded-tr-sm"
                      : "bg-orange-50 border border-orange-200 text-orange-950 rounded-tl-sm"
                  }`}>
                    {msg.content}
                    {/* Target price tag for client messages */}
                    {isClient && msg.targetPrice != null && (
                      <div className="mt-1.5 inline-flex items-center gap-1 bg-orange-100 border border-orange-300 rounded-full px-2 py-0.5 text-xs font-bold text-orange-800">
                        🎯 Target: {fmtPrice(msg.targetPrice)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {isAdmin ? "You" : msg.senderName} · {fmtTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply form — hidden if approved */}
      {!isApproved && (
        <form ref={formRef} action={formAction} className="flex gap-2 pt-2 border-t">
          <input type="hidden" name="quotationId" value={quotationId} />
          <textarea
            name="content"
            rows={2}
            placeholder={hasCounterOffer
              ? "Reply to their counter-offer…"
              : "Send a message without changing costs…"}
            disabled={isPending}
            className="flex-1 rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none"
          />
          <Button type="submit" size="sm" disabled={isPending} className="self-end shrink-0">
            {isPending ? "…" : "Send"}
          </Button>
        </form>
      )}
      {state?.errors?.content && (
        <p className="text-xs text-destructive">{state.errors.content[0]}</p>
      )}
      {state?.success && (
        <p className="text-xs text-green-600">✓ Sent.</p>
      )}
    </div>
  );
}
