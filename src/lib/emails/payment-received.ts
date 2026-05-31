import { emailShell, emailButton } from "./base";

interface PaymentReceivedAdminData {
  adminName: string;
  clientName: string;
  clientEmail: string;
  productName: string;
  quantity: number;
  totalCost: number;
  paymentProofUrl: string;
  orderManagementUrl: string;
}

function fmt(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function paymentReceivedAdminEmail(data: PaymentReceivedAdminData): {
  subject: string;
  html: string;
} {
  const subject = `🧾 Payment received — ${data.clientName} · ${data.productName}`;

  const content = `
    <tr>
      <td style="padding:32px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;line-height:1.3;">
          Payment Proof Submitted
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
          Hi ${data.adminName}, a client has approved their quotation and submitted payment proof. Please verify the receipt and update the order status to begin production.
        </p>

        <!-- Client details -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:24px;">
          <tr>
            <td colspan="2" style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#71717a;padding-bottom:10px;">Client Details</td>
          </tr>
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
          <tr>
            <td style="font-size:14px;color:#52525b;padding:3px 0;border-top:1px solid #e4e4e7;padding-top:10px;margin-top:4px;">Total Paid</td>
            <td align="right" style="font-size:16px;font-weight:700;color:#18181b;border-top:1px solid #e4e4e7;padding-top:10px;">${fmt(data.totalCost)}</td>
          </tr>
        </table>

        <!-- Action buttons -->
        <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
          <tr>
            <td style="padding-right:12px;">
              ${emailButton(data.orderManagementUrl, "Manage Order →")}
            </td>
            <td>
              <a href="${data.paymentProofUrl}" style="display:inline-block;border:2px solid #18181b;color:#18181b;font-size:14px;font-weight:600;padding:10px 22px;border-radius:8px;text-decoration:none;">
                View Receipt
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0;font-size:13px;color:#71717a;">
          Once verified, update the order status to <strong>In Production</strong> to notify the client.
        </p>
      </td>
    </tr>`;

  return {
    subject,
    html: emailShell(content, `${data.clientName} has submitted payment for ${data.productName}`),
  };
}
