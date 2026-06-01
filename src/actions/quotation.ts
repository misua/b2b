"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireClient } from "@/lib/session";
import { sendEmail, getAdminEmail, getAdminName, getAppUrl } from "@/lib/email";
import { quotationReadyEmail } from "@/lib/emails/quotation-ready";
import { paymentReceivedAdminEmail } from "@/lib/emails/payment-received";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CostingSchema = z.object({
  rfqId: z.string().min(1, "RFQ ID is required."),
  productCost: z.coerce.number({ error: "Enter a valid product cost." }).nonnegative(),
  shippingCost: z.coerce.number({ error: "Enter a valid shipping cost." }).nonnegative(),
  customsDuties: z.coerce.number({ error: "Enter a valid customs duties amount." }).nonnegative(),
  otherExpenses: z.coerce.number({ error: "Enter a valid other expenses amount." }).nonnegative(),
  factoryId: z.string().optional(),
  adminNote: z.string().trim().max(500).optional(),
});

export type CostingFormState =
  | {
      errors?: {
        rfqId?: string[];
        productCost?: string[];
        shippingCost?: string[];
        customsDuties?: string[];
        otherExpenses?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

// ─── Save / Update Quotation (Admin) ─────────────────────────────────────────

export async function saveQuotation(
  _state: CostingFormState,
  formData: FormData
): Promise<CostingFormState> {
  const adminSession = await requireAdmin();

  const validated = CostingSchema.safeParse({
    rfqId:        formData.get("rfqId"),
    productCost:  formData.get("productCost"),
    shippingCost: formData.get("shippingCost"),
    customsDuties:formData.get("customsDuties"),
    otherExpenses:formData.get("otherExpenses"),
    factoryId:    formData.get("factoryId") || undefined,
    adminNote:    formData.get("adminNote") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { rfqId, productCost, shippingCost, customsDuties, otherExpenses, factoryId, adminNote } =
    validated.data;
  const totalCost = productCost + shippingCost + customsDuties + otherExpenses;
  const resolvedFactoryId = factoryId && factoryId.length > 0 ? factoryId : null;

  // Check if an existing quotation is in COUNTER_OFFERED state
  const existingQuotation = await prisma.quotation.findUnique({ where: { rfqId } });
  const isRevision = existingQuotation?.negotiationStatus === "COUNTER_OFFERED";
  const newNegotiationStatus = isRevision ? "REVISED" : "SENT";

  // Upsert quotation
  const quotation = await prisma.quotation.upsert({
    where: { rfqId },
    update: {
      productCost, shippingCost, customsDuties, otherExpenses, totalCost,
      factoryId: resolvedFactoryId,
      negotiationStatus: newNegotiationStatus,
    },
    create: {
      rfqId, productCost, shippingCost, customsDuties, otherExpenses, totalCost,
      factoryId: resolvedFactoryId,
      negotiationStatus: "SENT",
    },
  });

  // Create a revision snapshot (version = existing revision count + 1)
  const revisionCount = await prisma.quotationRevision.count({
    where: { quotationId: quotation.id },
  });
  await prisma.quotationRevision.create({
    data: {
      quotationId:  quotation.id,
      version:      revisionCount + 1,
      productCost, shippingCost, customsDuties, otherExpenses, totalCost,
      adminNote:    adminNote ?? null,
    },
  });

  // Add a message to the thread for this revision
  const messageContent = adminNote
    ? adminNote
    : isRevision
    ? `Quotation revised. New total: ₱${totalCost.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
    : `Initial quotation. Total: ₱${totalCost.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  await prisma.quotationMessage.create({
    data: {
      quotationId:  quotation.id,
      senderRole:   "ADMIN",
      senderName:   adminSession.name,
      content:      messageContent,
    },
  });

  // Mark RFQ as QUOTED (or reset from COUNTER_OFFERED back to QUOTED)
  const rfq = await prisma.rFQ.update({
    where: { id: rfqId },
    data: { status: "QUOTED" },
    include: { user: { select: { name: true, email: true } } },
  });

  // Email client: quotation ready / updated
  const appUrl = getAppUrl();
  const email = quotationReadyEmail({
    clientName:   rfq.user.name,
    productName:  rfq.productName,
    quantity:     rfq.quantity,
    productCost, shippingCost, customsDuties, otherExpenses, totalCost,
    quotationUrl: `${appUrl}/dashboard/client/quotations/${quotation.id}`,
  });
  await sendEmail({ to: rfq.user.email, ...email });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/rfqs");
  revalidatePath(`/dashboard/admin/rfqs/${rfqId}`);
  // Revalidate client paths so their quotation page reflects the new state immediately
  revalidatePath(`/dashboard/client/quotations/${quotation.id}`);
  revalidatePath("/dashboard/client");

  return {
    success: true,
    message: isRevision
      ? `Revised quote sent to client. The Approve & Pay button is now unlocked for them.`
      : `Quotation sent to ${rfq.user.name}. They will be notified to review and approve.`,
  };
}

// ─── Get Quotation for Client ─────────────────────────────────────────────────

export async function getClientQuotation(quotationId: string) {
  const session = await requireClient();
  return prisma.quotation.findFirst({
    where: { id: quotationId, rfq: { userId: session.userId } },
    include: { rfq: { select: { productName: true, quantity: true } } },
  });
}

// ─── Submit Counter-Offer (Client) ───────────────────────────────────────────

const CounterOfferSchema = z.object({
  quotationId:  z.string().min(1),
  content:      z.string().min(5, "Please write at least a brief message.").trim(),
  targetPrice:  z.coerce.number().positive().optional().or(z.literal(0).transform(() => undefined)),
});

export type CounterOfferState =
  | {
      errors?: { content?: string[]; targetPrice?: string[] };
      message?: string;
      success?: boolean;
    }
  | undefined;

export async function submitCounterOffer(
  _state: CounterOfferState,
  formData: FormData
): Promise<CounterOfferState> {
  const session = await requireClient();

  const rawTarget = formData.get("targetPrice");
  const validated = CounterOfferSchema.safeParse({
    quotationId: formData.get("quotationId"),
    content:     formData.get("content"),
    targetPrice: rawTarget && String(rawTarget).trim() !== "" ? rawTarget : undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { quotationId, content, targetPrice } = validated.data;

  // Verify ownership and state
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, rfq: { userId: session.userId } },
    include: { rfq: { select: { id: true, productName: true } } },
  });

  if (!quotation) return { message: "Quotation not found." };
  if (quotation.isApproved) return { message: "This quotation has already been approved." };
  if (quotation.negotiationStatus === "COUNTER_OFFERED") {
    return { message: "You already have an active counter-offer. Please wait for the admin to respond." };
  }

  // Create the client message
  await prisma.quotationMessage.create({
    data: {
      quotationId,
      senderRole:  "CLIENT",
      senderName:  session.name,
      content,
      targetPrice: targetPrice ?? null,
    },
  });

  // Update negotiation status + RFQ status
  await prisma.quotation.update({
    where: { id: quotationId },
    data: { negotiationStatus: "COUNTER_OFFERED" },
  });

  await prisma.rFQ.update({
    where: { id: quotation.rfq.id },
    data: { status: "COUNTER_OFFERED" },
  });

  revalidatePath("/dashboard/client");
  revalidatePath(`/dashboard/client/quotations/${quotationId}`);
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/rfqs");
  return { success: true };
}

// ─── Admin Send Message (without revising costs) ──────────────────────────────

const AdminMessageSchema = z.object({
  quotationId: z.string().min(1),
  content:     z.string().min(2, "Message must be at least 2 characters.").trim(),
});

export type AdminMessageState =
  | { errors?: { content?: string[] }; message?: string; success?: boolean }
  | undefined;

export async function sendAdminMessage(
  _state: AdminMessageState,
  formData: FormData
): Promise<AdminMessageState> {
  const session = await requireAdmin();

  const validated = AdminMessageSchema.safeParse({
    quotationId: formData.get("quotationId"),
    content:     formData.get("content"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { quotationId, content } = validated.data;

  const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!quotation) return { message: "Quotation not found." };

  await prisma.quotationMessage.create({
    data: {
      quotationId,
      senderRole: "ADMIN",
      senderName: session.name,
      content,
    },
  });

  revalidatePath(`/dashboard/admin/rfqs/${quotation.rfqId}`);
  return { success: true };
}

// ─── Approve Quotation + Upload Payment Proof (Client) ───────────────────────

const ApproveSchema = z.object({
  quotationId:    z.string().min(1),
  paymentProofUrl:z.string().min(1, "Please upload a payment proof."),
});

export type ApproveFormState =
  | {
      errors?: { paymentProofUrl?: string[] };
      message?: string;
      success?: boolean;
    }
  | undefined;

export async function approveQuotation(
  _state: ApproveFormState,
  formData: FormData
): Promise<ApproveFormState> {
  const session = await requireClient();

  const validated = ApproveSchema.safeParse({
    quotationId:    formData.get("quotationId"),
    paymentProofUrl:formData.get("paymentProofUrl"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { quotationId, paymentProofUrl } = validated.data;

  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, rfq: { userId: session.userId } },
    include: {
      rfq: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  if (!quotation) return { message: "Quotation not found." };
  if (quotation.isApproved) return { message: "This quotation has already been approved." };

  // Guard: cannot approve while waiting for admin to respond to counter-offer
  if (quotation.negotiationStatus === "COUNTER_OFFERED") {
    return { message: "Your counter-offer is pending admin response. Please wait." };
  }

  let orderId: string | undefined;
  await prisma.$transaction(async (tx) => {
    await tx.quotation.update({
      where: { id: quotationId },
      data: { isApproved: true, paymentProof: paymentProofUrl, negotiationStatus: "APPROVED" },
    });

    const existing = await tx.order.findUnique({ where: { quotationId } });
    if (!existing) {
      const order = await tx.order.create({
        data: { userId: session.userId, quotationId, status: "AWAITING_PRODUCTION" },
      });
      orderId = order.id;

      await tx.orderStatusLog.create({
        data: { orderId: order.id, fromStatus: null, toStatus: "AWAITING_PRODUCTION" },
      });
    } else {
      orderId = existing.id;
    }

    await tx.rFQ.update({
      where: { id: quotation.rfqId },
      data: { status: "IN_PROGRESS" },
    });
  });

  // Email admin
  const appUrl = getAppUrl();
  const adminEmail = paymentReceivedAdminEmail({
    adminName:          getAdminName(),
    clientName:         session.name,
    clientEmail:        session.email,
    productName:        quotation.rfq.productName,
    quantity:           quotation.rfq.quantity,
    totalCost:          Number(quotation.totalCost),
    paymentProofUrl,
    orderManagementUrl: `${appUrl}/dashboard/admin/orders/${orderId ?? ""}`,
  });
  await sendEmail({ to: getAdminEmail(), ...adminEmail });

  revalidatePath("/dashboard/client");
  revalidatePath(`/dashboard/client/quotations/${quotationId}`);
  return { success: true };
}
