import { emailShell, emailButton, costRow } from "./base";

interface QuotationReadyData {
  clientName: string;
  productName: string;
  quantity: number;
  productCost: number;
  shippingCost: number;
  customsDuties: number;
  otherExpenses: number;
  totalCost: number;
  quotationUrl: string;
}

function fmt(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function quotationReadyEmail(data: QuotationReadyData): {
  subject: string;
  html: string;
} {
  const subject = `💰 Your quotation is ready — ${data.productName}`;

  const content = `
    <tr>
      <td style="padding:32px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;line-height:1.3;">
          Your quotation is ready
        </h1>
        <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
          Hi ${data.clientName}, we've prepared a detailed cost breakdown for your recent sourcing request. Please review and approve to begin production.
        </p>

        <!-- Product summary -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:24px;">
          <tr>
            <td style="font-size:13px;color:#71717a;padding-bottom:4px;">Product</td>
          </tr>
          <tr>
            <td style="font-size:16px;font-weight:600;color:#18181b;">${data.productName}</td>
            <td align="right" style="font-size:14px;color:#52525b;">${data.quantity.toLocaleString()} units</td>
          </tr>
        </table>

        <!-- Cost breakdown -->
        <p style="margin:0 0 12px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#71717a;">Cost Breakdown</p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
          ${costRow("🏭 Product Cost", fmt(data.productCost))}
          ${costRow("🚢 Shipping & Freight", fmt(data.shippingCost))}
          ${costRow("🏛️ Customs & Duties", fmt(data.customsDuties))}
          ${costRow("📦 Other Expenses", fmt(data.otherExpenses))}
          ${costRow("Total Amount", fmt(data.totalCost), true)}
        </table>

        <!-- Per-unit -->
        <p style="margin:0 0 28px;font-size:13px;color:#71717a;">
          Per unit: <strong style="color:#18181b;">${fmt(data.totalCost / data.quantity)}</strong>
        </p>

        ${emailButton(data.quotationUrl, "Review & Approve Quotation →")}

        <p style="margin:20px 0 0;font-size:13px;color:#71717a;">
          Button not working? Copy this link: <br />
          <a href="${data.quotationUrl}" style="color:#3b82f6;word-break:break-all;">${data.quotationUrl}</a>
        </p>
      </td>
    </tr>`;

  return {
    subject,
    html: emailShell(content, `Your ${data.productName} quotation is ready — ${fmt(data.totalCost)} total`),
  };
}
