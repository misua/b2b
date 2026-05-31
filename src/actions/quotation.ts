"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  // Optional — empty string means "no factory selected"
  factoryId: z.string().optional(),
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

// ─── Create / Update Quotation (Admin) ───────────────────────────────────────

export async function saveQuotation(
  _state: CostingFormState,
  formData: FormData
): Promise<CostingFormState> {
  await requireAdmin();

  const validated = CostingSchema.safeParse({
    rfqId: formData.get("rfqId"),
    productCost: formData.get("productCost"),
    shippingCost: formData.get("shippingCost"),
    customsDuties: formData.get("customsDuties"),
    otherExpenses: formData.get("otherExpenses"),
    factoryId: formData.get("factoryId") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { rfqId, productCost, shippingCost, customsDuties, otherExpenses, factoryId } =
    validated.data;
  const totalCost = productCost + shippingCost + customsDuties + otherExpenses;

  // Resolve factoryId — empty string → null (clear factory)
  const resolvedFactoryId = factoryId && factoryId.length > 0 ? factoryId : null;

  // Upsert quotation
  const quotation = await prisma.quotation.upsert({
    where: { rfqId },
    update: { productCost, shippingCost, customsDuties, otherExpenses, totalCost, factoryId: resolvedFactoryId },
    create: { rfqId, productCost, shippingCost, customsDuties, otherExpenses, totalCost, factoryId: resolvedFactoryId },
  });

  // Mark RFQ as QUOTED and fetch client info for email
  const rfq = await prisma.rFQ.update({
    where: { id: rfqId },
    data: { status: "QUOTED" },
    include: { user: { select: { name: true, email: true } } },
  });

  // ── Email: notify client their quotation is ready ──
  const appUrl = getAppUrl();
  const email = quotationReadyEmail({
    clientName: rfq.user.name,
    productName: rfq.productName,
    quantity: rfq.quantity,
    productCost,
    shippingCost,
    customsDuties,
    otherExpenses,
    totalCost,
    quotationUrl: `${appUrl}/dashboard/client/quotations/${quotation.id}`,
  });
  await sendEmail({ to: rfq.user.email, ...email });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/rfqs");
  redirect("/dashboard/admin");
}

// ─── Get Quotation for Client ─────────────────────────────────────────────────

export async function getClientQuotation(quotationId: string) {
  const session = await requireClient();
  return prisma.quotation.findFirst({
    where: {
      id: quotationId,
      rfq: { userId: session.userId },
    },
    include: {
      rfq: { select: { productName: true, quantity: true } },
    },
  });
}

// ─── Approve Quotation + Upload Payment Proof (Client) ───────────────────────

const ApproveSchema = z.object({
  quotationId: z.string().min(1),
  paymentProofUrl: z.string().min(1, "Please upload a payment proof."),
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
    quotationId: formData.get("quotationId"),
    paymentProofUrl: formData.get("paymentProofUrl"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { quotationId, paymentProofUrl } = validated.data;

  // Verify ownership
  const quotation = await prisma.quotation.findFirst({
    where: { id: quotationId, rfq: { userId: session.userId } },
    include: {
      rfq: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  if (!quotation) return { message: "Quotation not found." };
  if (quotation.isApproved) return { message: "This quotation has already been approved." };

  // Approve + create order in a transaction
  let orderId: string | undefined;
  await prisma.$transaction(async (tx) => {
    await tx.quotation.update({
      where: { id: quotationId },
      data: { isApproved: true, paymentProof: paymentProofUrl },
    });

    const existing = await tx.order.findUnique({ where: { quotationId } });
    if (!existing) {
      const order = await tx.order.create({
        data: {
          userId: session.userId,
          quotationId,
          status: "AWAITING_PRODUCTION",
        },
      });
      orderId = order.id;

      // Log the initial order creation as the first status entry
      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          fromStatus: null, // no previous status — this is the first
          toStatus: "AWAITING_PRODUCTION",
        },
      });
    } else {
      orderId = existing.id;
    }

    await tx.rFQ.update({
      where: { id: quotation.rfqId },
      data: { status: "IN_PROGRESS" },
    });
  });

  // ── Email: notify admin that payment proof was submitted ──
  const appUrl = getAppUrl();
  const adminEmail = paymentReceivedAdminEmail({
    adminName: getAdminName(),
    clientName: session.name,
    clientEmail: session.email,
    productName: quotation.rfq.productName,
    quantity: quotation.rfq.quantity,
    totalCost: Number(quotation.totalCost),
    paymentProofUrl,
    orderManagementUrl: `${appUrl}/dashboard/admin/orders/${orderId ?? ""}`,
  });
  await sendEmail({ to: getAdminEmail(), ...adminEmail });

  revalidatePath("/dashboard/client");
  revalidatePath(`/dashboard/client/quotations/${quotationId}`);
  return { success: true };
}
