"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireClient, requireAdmin } from "@/lib/session";
import { sendEmail, getAdminEmail, getAdminName, getAppUrl } from "@/lib/email";
import { rfqReceivedClientEmail, rfqAdminNotifyEmail } from "@/lib/emails/rfq-received";
import type { RFQFormState } from "@/lib/definitions";

// ─── Submit RFQ (Client) ──────────────────────────────────────────────────────

const SubmitRFQSchema = z.object({
  productName: z.string().min(2, "Product name must be at least 2 characters.").trim(),
  specifications: z.string().min(10, "Please provide at least 10 characters of specifications.").trim(),
  quantity: z.coerce.number({ error: "Quantity must be a number." }).int().positive("Quantity must be a positive integer."),
  imageUrls: z.string().optional(),
});

export async function submitRFQ(
  _state: RFQFormState,
  formData: FormData
): Promise<RFQFormState> {
  const session = await requireClient();

  const validated = SubmitRFQSchema.safeParse({
    productName: formData.get("productName"),
    specifications: formData.get("specifications"),
    quantity: formData.get("quantity"),
    imageUrls: formData.get("imageUrls"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { productName, specifications, quantity, imageUrls } = validated.data;
  const parsedUrls: string[] = imageUrls ? JSON.parse(imageUrls) : [];

  const rfq = await prisma.rFQ.create({
    data: {
      userId: session.userId,
      productName,
      specifications,
      quantity,
      imageUrls: parsedUrls,
      status: "PENDING_REVIEW",
    },
  });

  const appUrl = getAppUrl();

  // ── Email: client confirmation ──
  const clientEmail = rfqReceivedClientEmail({
    clientName: session.name,
    productName,
    quantity,
    dashboardUrl: `${appUrl}/dashboard/client`,
  });
  await sendEmail({ to: session.email, ...clientEmail });

  // ── Email: admin notification ──
  const adminEmail = rfqAdminNotifyEmail({
    adminName: getAdminName(),
    clientName: session.name,
    clientEmail: session.email,
    productName,
    quantity,
    specifications,
    rfqManagementUrl: `${appUrl}/dashboard/admin/rfqs/${rfq.id}`,
  });
  await sendEmail({ to: getAdminEmail(), ...adminEmail });

  revalidatePath("/dashboard/client");
  redirect("/dashboard/client");
}

// ─── Get Client's RFQs ────────────────────────────────────────────────────────

export async function getClientRFQs() {
  const session = await requireClient();
  return prisma.rFQ.findMany({
    where: { userId: session.userId },
    include: { quotation: { include: { order: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Get All RFQs (Admin) ─────────────────────────────────────────────────────

export async function getAllRFQs() {
  await requireAdmin();
  return prisma.rFQ.findMany({
    include: {
      user: { select: { name: true, email: true } },
      quotation: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Get Single RFQ (Admin) ───────────────────────────────────────────────────

export async function getRFQById(rfqId: string) {
  await requireAdmin();
  return prisma.rFQ.findUnique({
    where: { id: rfqId },
    include: {
      user: { select: { name: true, email: true } },
      quotation: true,
    },
  });
}
