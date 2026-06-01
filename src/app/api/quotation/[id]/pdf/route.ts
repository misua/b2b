import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fmtPdf } from "@/lib/currency";

// jsPDF is a CommonJS module — use dynamic import to avoid ESM issues
// in Next.js App Router route handlers.
async function getJsPDF() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: quotationId } = await ctx.params;

  // ── Fetch quotation (ownership check included) ────────────────────────────
  const quotation = await prisma.quotation.findFirst({
    where:
      session.role === "CLIENT"
        ? { id: quotationId, rfq: { userId: session.userId } }
        : { id: quotationId }, // admins can download any quotation
    include: {
      rfq: {
        select: {
          productName: true,
          quantity: true,
          specifications: true,
        },
      },
      factory: { select: { name: true } },
    },
  });

  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  // ── Build values ──────────────────────────────────────────────────────────
  const productCost   = Number(quotation.productCost);
  const shippingCost  = Number(quotation.shippingCost);
  const customsDuties = Number(quotation.customsDuties);
  const otherExpenses = Number(quotation.otherExpenses);
  const totalCost     = Number(quotation.totalCost);
  const perUnit       = quotation.rfq.quantity > 0 ? totalCost / quotation.rfq.quantity : 0;

  const refNo = `QT-${quotationId.slice(0, 8).toUpperCase()}`;
  const dateStr = new Date(quotation.createdAt).toLocaleDateString("en-PH", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ── Generate PDF ──────────────────────────────────────────────────────────
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const colRight = pageW - margin;
  let y = 20;

  // Helper — draw a full-width horizontal rule
  function hr(yPos: number, weight = 0.3) {
    doc.setLineWidth(weight);
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, yPos, colRight, yPos);
  }

  // Helper — right-aligned text
  function textRight(text: string, yPos: number, size = 10) {
    doc.setFontSize(size);
    doc.text(text, colRight, yPos, { align: "right" });
  }

  // ── HEADER ────────────────────────────────────────────────────────────────
  // Brand name (bold)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text("B2B SOURCING PORTAL", margin, y);

  // Date (right-aligned, same line)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  textRight(dateStr, y, 9);

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("OFFICIAL QUOTATION", margin, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Reference: ${refNo}`, margin, y);

  y += 4;
  hr(y);
  y += 7;

  // ── CLIENT & PRODUCT INFO ─────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("DETAILS", margin, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);

  const infoRows: [string, string][] = [
    ["Product",          quotation.rfq.productName],
    ["Quantity",         `${quotation.rfq.quantity.toLocaleString("en-PH")} units`],
    ["Quotation Date",   dateStr],
    ["Status",           quotation.isApproved ? "APPROVED" : "PENDING APPROVAL"],
  ];
  if (quotation.factory) {
    infoRows.splice(2, 0, ["Factory", quotation.factory.name]);
  }

  for (const [label, value] of infoRows) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(value, margin + 38, y);
    y += 6;
  }

  y += 3;
  hr(y);
  y += 7;

  // ── COST BREAKDOWN TABLE ──────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("COST BREAKDOWN", margin, y);
  y += 6;

  const costRows: [string, number][] = [
    ["Product Cost",       productCost],
    ["Shipping & Freight", shippingCost],
    ["Customs & Duties",   customsDuties],
    ["Other Expenses",     otherExpenses],
  ];

  for (const [label, value] of costRows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    textRight(fmtPdf(value), y, 10);
    y += 7;
  }

  // Separator before total
  y += 1;
  hr(y, 0.5);
  y += 7;

  // Total row (bold + larger)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text("TOTAL", margin, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  textRight(fmtPdf(totalCost), y, 12);
  y += 6;

  // Per unit
  if (perUnit > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Per unit: ${fmtPdf(perUnit)}`, margin, y);
    y += 5;
  }

  y += 4;
  hr(y);
  y += 9;

  // ── FOOTER NOTES ──────────────────────────────────────────────────────────
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text("This quotation is valid for 30 days from the date of issue.", margin, y);
  y += 5;
  doc.text("For questions, please contact your account manager.", margin, y);
  y += 5;
  doc.text(`Generated by B2B Sourcing Portal  |  Ref: ${refNo}`, margin, y);

  // ── Return PDF as download ────────────────────────────────────────────────
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const filename = `quotation-${refNo}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
