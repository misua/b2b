import { emailShell, emailButton } from "./base";

interface RFQReceivedData {
  // to client
  clientName: string;
  productName: string;
  quantity: number;
  dashboardUrl: string;
}

interface RFQAdminNotifyData {
  // to admin
  adminName: string;
  clientName: string;
  clientEmail: string;
  productName: string;
  quantity: number;
  specifications: string;
  rfqManagementUrl: string;
}

export function rfqReceivedClientEmail(data: RFQReceivedData): {
  subject: string;
  html: string;
} {
  const subject = `📋 RFQ received — ${data.productName}`;

  const content = `
    <tr>
      <td style="padding:32px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;line-height:1.3;">
          We've received your request
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
          Hi ${data.clientName}, thank you for submitting your sourcing request. Our team will review it and prepare a detailed quotation within 1–2 business days.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:28px;">
          <tr>
            <td style="font-size:14px;font-weight:600;color:#18181b;">${data.productName}</td>
            <td align="right" style="font-size:13px;color:#71717a;">${data.quantity.toLocaleString()} units</td>
          </tr>
        </table>

        ${emailButton(data.dashboardUrl, "View Dashboard →")}
      </td>
    </tr>`;

  return {
    subject,
    html: emailShell(content, `RFQ for ${data.productName} received — we'll be in touch soon`),
  };
}

export function rfqAdminNotifyEmail(data: RFQAdminNotifyData): {
  subject: string;
  html: string;
} {
  const subject = `📋 New RFQ — ${data.clientName} · ${data.productName}`;

  const content = `
    <tr>
      <td style="padding:32px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;line-height:1.3;">
          New RFQ Submitted
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
          Hi ${data.adminName}, a new sourcing request has been submitted and is waiting for your costing.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:16px;">
          <tr>
            <td style="font-size:14px;color:#52525b;padding:3px 0;">Client</td>
            <td align="right" style="font-size:14px;font-weight:600;color:#18181b;">${data.clientName}</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#52525b;padding:3px 0;">Email</td>
            <td align="right" style="font-size:14px;color:#18181b;">${data.clientEmail}</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#52525b;padding:3px 0;">Product</td>
            <td align="right" style="font-size:14px;font-weight:600;color:#18181b;">${data.productName}</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#52525b;padding:3px 0;">Quantity</td>
            <td align="right" style="font-size:14px;color:#18181b;">${data.quantity.toLocaleString()} units</td>
          </tr>
        </table>

        <p style="margin:0 0 16px;font-size:13px;color:#71717a;font-style:italic;line-height:1.6;">
          "${data.specifications.slice(0, 200)}${data.specifications.length > 200 ? "…" : ""}"
        </p>

        ${emailButton(data.rfqManagementUrl, "Open Costing Calculator →")}
      </td>
    </tr>`;

  return {
    subject,
    html: emailShell(content, `New RFQ from ${data.clientName}: ${data.productName}`),
  };
}
