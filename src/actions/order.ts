"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { sendEmail, getAppUrl } from "@/lib/email";
import { orderStatusUpdateEmail } from "@/lib/emails/order-status-update";
import { OrderStatus } from "@prisma/client";

// ─── Update Order Status (Admin) ──────────────────────────────────────────────

const UpdateStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required."),
  status: z.nativeEnum(OrderStatus),
});

export type UpdateStatusState =
  | { success?: boolean; message?: string }
  | undefined;

export async function updateOrderStatus(
  _state: UpdateStatusState,
  formData: FormData
): Promise<UpdateStatusState> {
  await requireAdmin();

  const validated = UpdateStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });

  if (!validated.success) {
    return { message: validated.error.flatten().formErrors[0] ?? "Invalid input." };
  }

  const { orderId, status } = validated.data;

  // Fetch order with client and product info for email
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      quotation: {
        include: {
          rfq: { select: { productName: true, quantity: true } },
        },
      },
    },
  });

  if (!order) return { message: "Order not found." };

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  // Log the status transition for history tracking
  await prisma.orderStatusLog.create({
    data: {
      orderId,
      fromStatus: order.status, // captured before the update above
      toStatus: status,
    },
  });

  // ── Email: notify client of status change ──
  const appUrl = getAppUrl();
  const email = orderStatusUpdateEmail({
    clientName: order.user.name,
    productName: order.quotation.rfq.productName,
    quantity: order.quotation.rfq.quantity,
    newStatus: status,
    trackingUrl: `${appUrl}/dashboard/client/orders/${orderId}`,
  });
  await sendEmail({ to: order.user.email, ...email });

  // Revalidate all relevant paths
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/orders");
  revalidatePath(`/dashboard/admin/orders/${orderId}`);
  revalidatePath(`/dashboard/client/orders/${orderId}`);
  revalidatePath("/dashboard/client");

  return { success: true };
}

// ─── Get All Orders (Admin) ───────────────────────────────────────────────────

export async function getAllOrders() {
  await requireAdmin();
  return prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      quotation: {
        include: {
          rfq: { select: { productName: true, quantity: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}
