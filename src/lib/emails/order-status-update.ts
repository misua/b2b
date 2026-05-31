import { emailShell, emailButton } from "./base";
import type { OrderStatus } from "@prisma/client";

interface StatusUpdateData {
  clientName: string;
  productName: string;
  quantity: number;
  newStatus: OrderStatus;
  trackingUrl: string;
}

const STATUS_META: Record<
  OrderStatus,
  { label: string; icon: string; message: string; previewText: string }
> = {
  REQUIREMENTS_SUBMITTED: {
    label: "Requirements Submitted",
    icon: "📋",
    message: "We've received your sourcing request and our team will review it shortly.",
    previewText: "Your request has been received",
  },
  QUOTATION_READY: {
    label: "Quotation Ready",
    icon: "💰",
    message: "Your cost breakdown is ready. Please log in to review and approve it.",
    previewText: "Your quotation is ready for review",
  },
  AWAITING_PRODUCTION: {
    label: "Payment Received",
    icon: "✅",
    message: "Your payment has been confirmed. Production will begin shortly.",
    previewText: "Payment confirmed — production starting soon",
  },
  IN_PRODUCTION: {
    label: "In Production",
    icon: "🏭",
    message: "Great news! Your order is now being manufactured at the factory.",
    previewText: "Your order is in production",
  },
  AT_CHINA_WAREHOUSE: {
    label: "Arrived at China Warehouse",
    icon: "🏬",
    message: "Your goods have passed quality inspection and are now packed at our export warehouse, ready for shipment.",
    previewText: "Your goods are at the China warehouse",
  },
  INTERNATIONAL_TRANSIT: {
    label: "International Transit",
    icon: "🚢",
    message: "Your shipment has departed and is now on its way to you internationally. Estimated transit time is 2–4 weeks depending on the shipping method.",
    previewText: "Your shipment is on its way!",
  },
  OUT_FOR_LOCAL_DELIVERY: {
    label: "Out for Local Delivery",
    icon: "🚚",
    message: "Your package has been handed to the local courier and is out for delivery today.",
    previewText: "Your package is out for delivery today",
  },
  DELIVERED: {
    label: "Delivered!",
    icon: "🎉",
    message: "Your order has been delivered. We hope everything arrived in perfect condition. Thank you for choosing B2B Sourcing Portal!",
    previewText: "Your order has been delivered",
  },
};

export function orderStatusUpdateEmail(data: StatusUpdateData): {
  subject: string;
  html: string;
} {
  const meta = STATUS_META[data.newStatus];
  const subject = `${meta.icon} Order update: ${meta.label} — ${data.productName}`;

  // Progress indicator: calculate step number
  const allStatuses: OrderStatus[] = [
    "REQUIREMENTS_SUBMITTED",
    "QUOTATION_READY",
    "AWAITING_PRODUCTION",
    "IN_PRODUCTION",
    "AT_CHINA_WAREHOUSE",
    "INTERNATIONAL_TRANSIT",
    "OUT_FOR_LOCAL_DELIVERY",
    "DELIVERED",
  ];
  const stepNum = allStatuses.indexOf(data.newStatus) + 1;
  const totalSteps = allStatuses.length;
  const progressPct = ((stepNum - 1) / (totalSteps - 1)) * 100;

  const isDelivered = data.newStatus === "DELIVERED";
  const accentColor = isDelivered ? "#16a34a" : "#18181b";

  const content = `
    <tr>
      <td style="padding:32px;">
        <!-- Icon + heading -->
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:48px;line-height:1;margin-bottom:12px;">${meta.icon}</div>
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${accentColor};line-height:1.3;">
            ${meta.label}
          </h1>
          <p style="margin:0;font-size:13px;color:#71717a;">Step ${stepNum} of ${totalSteps}</p>
        </div>

        <!-- Progress bar -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
          <tr>
            <td>
              <div style="background:#e4e4e7;border-radius:4px;height:6px;width:100%;overflow:hidden;">
                <div style="background:${accentColor};height:6px;width:${progressPct}%;border-radius:4px;"></div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Message -->
        <p style="margin:0 0 8px;font-size:15px;color:#18181b;line-height:1.6;">
          Hi ${data.clientName},
        </p>
        <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
          ${meta.message}
        </p>

        <!-- Order details pill -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:28px;">
          <tr>
            <td style="font-size:14px;font-weight:600;color:#18181b;">${data.productName}</td>
            <td align="right" style="font-size:13px;color:#71717a;">${data.quantity.toLocaleString()} units</td>
          </tr>
        </table>

        ${emailButton(data.trackingUrl, isDelivered ? "View Order Details →" : "Track Your Order →")}

        <p style="margin:20px 0 0;font-size:13px;color:#71717a;">
          <a href="${data.trackingUrl}" style="color:#3b82f6;word-break:break-all;">${data.trackingUrl}</a>
        </p>
      </td>
    </tr>`;

  return {
    subject,
    html: emailShell(content, meta.previewText),
  };
}
