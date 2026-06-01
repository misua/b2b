import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

async function getJsPDF() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}

// ─── Company details ──────────────────────────────────────────────────────────
const COMPANY_NAME    = process.env.COMPANY_NAME    ?? "B2B SOURCING PORTAL";
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS ?? "Davao City, Philippines";
const COMPANY_TIN     = process.env.COMPANY_TIN     ?? "";

// ─── Colours (matching the LAJ format: navy blue accents) ────────────────────
const NAVY  = [26,  57,  96]  as const;  // #1A3960
const WHITE = [255, 255, 255] as const;
const LIGHT = [240, 244, 250] as const;  // table header bg
const GREY  = [120, 120, 120] as const;
const BLACK = [30,  30,  30]  as const;

// ─── Number formatter (PHP, no ₱ symbol — jsPDF Helvetica can't render it) ──
function n(val: number): string {
  return val.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: quotationId } = await ctx.params;

  const quotation = await prisma.quotation.findFirst({
    where:
      session.role === "CLIENT"
        ? { id: quotationId, rfq: { userId: session.userId } }
        : { id: quotationId },
    include: {
      rfq: {
        include: {
          user: { select: { name: true } },
        },
      },
      factory: { select: { name: true } },
    },
  });

  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const productCost   = Number(quotation.productCost);
  const shippingCost  = Number(quotation.shippingCost);
  const customsDuties = Number(quotation.customsDuties);
  const otherExpenses = Number(quotation.otherExpenses);
  const totalCost     = Number(quotation.totalCost);
  const qty           = quotation.rfq.quantity;
  const perUnit       = qty > 0 ? totalCost / qty : 0;
  const clientName    = quotation.rfq.user.name;
  const productName   = quotation.rfq.productName;
  const refNo         = `QT-${quotationId.slice(0, 8).toUpperCase()}`;
  const dateStr       = new Date(quotation.createdAt).toLocaleDateString("en-PH", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ── Build PDF ──────────────────────────────────────────────────────────────
  const JsPDF = await getJsPDF();
  const doc   = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = doc.internal.pageSize.getWidth();   // 210
  const PH = doc.internal.pageSize.getHeight();  // 297
  const ML = 15;  // margin left
  const MR = PW - ML; // margin right = 195

  // ── Helper shortcuts ───────────────────────────────────────────────────────
  const setColor = (r: number, g: number, b: number) => doc.setTextColor(r, g, b);
  const setFill  = (r: number, g: number, b: number) => doc.setFillColor(r, g, b);
  const setDraw  = (r: number, g: number, b: number) => doc.setDrawColor(r, g, b);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1
  // ═══════════════════════════════════════════════════════════════════════════
  let y = 18;

  // ── Company name (bold, navy, large) ──────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setColor(...NAVY);
  doc.text(COMPANY_NAME, ML, y);

  // ── "QUOTATION" title — right side, very large ────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  setColor(...NAVY);
  doc.text("QUOTATION", MR, y, { align: "right" });

  // ── Address lines ─────────────────────────────────────────────────────────
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setColor(...GREY);
  const addressLines = COMPANY_ADDRESS.split("\n");
  for (const line of addressLines) {
    doc.text(line, ML, y);
    y += 4;
  }
  if (COMPANY_TIN) {
    doc.text(`TIN: ${COMPANY_TIN}`, ML, y);
    y += 4;
  }

  y += 5;

  // ── Info grid table ────────────────────────────────────────────────────────
  // 4 rows: Date / Quotation No., Client / Product, Address
  const col1 = ML;
  const col2 = ML + 30;
  const col3 = ML + 95;
  const col4 = ML + 120;
  const rowH = 12;
  const tableW = MR - ML;

  type GridRow = [string, string, string, string];
  const gridRows: GridRow[] = [
    ["Date:",          dateStr,     "Quotation No.:", refNo],
    ["Client:",        clientName,  "Product:",       productName],
    ["Address:",       "",          "",               ""],
  ];

  setDraw(...NAVY);
  doc.setLineWidth(0.3);

  for (let i = 0; i < gridRows.length; i++) {
    const [l1, v1, l2, v2] = gridRows[i];
    const rowY = y + i * rowH;

    // Row background — alternating very light
    if (i % 2 === 0) {
      setFill(248, 250, 253);
      doc.rect(col1, rowY - rowH + 2, tableW, rowH, "F");
    }

    // Border rect
    doc.rect(col1, rowY - rowH + 2, tableW, rowH, "S");

    // Labels (bold)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setColor(...NAVY);
    doc.text(l1, col1 + 3, rowY - 2);
    doc.text(l2, col3 + 3, rowY - 2);

    // Values (normal)
    doc.setFont("helvetica", "normal");
    setColor(...BLACK);
    // Wrap product name if long
    const v1Lines = doc.splitTextToSize(v1, col3 - col2 - 4) as string[];
    doc.text(v1Lines, col2, rowY - 2);
    if (v2) {
      const v2Lines = doc.splitTextToSize(v2, MR - col4 - 2) as string[];
      doc.text(v2Lines, col4, rowY - 2);
    }
  }

  y += gridRows.length * rowH + 8;

  // ── Section heading: QUOTATION DETAILS ────────────────────────────────────
  // Left navy accent bar
  setFill(...NAVY);
  doc.rect(ML, y - 4, 3, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setColor(...NAVY);
  doc.text("QUOTATION DETAILS", ML + 6, y + 1);
  y += 8;

  // ── Line items table header ────────────────────────────────────────────────
  const tML  = ML;
  const tMR  = MR;
  const tW   = tMR - tML;
  const hH   = 10; // header height
  const rH   = 9;  // row height

  // Column widths (matching the sample: desc wide, qty/unit narrow, price/amount)
  const cDesc  = tML;
  const wDesc  = 78;
  const cQty   = cDesc + wDesc;
  const wQty   = 16;
  const cUnit  = cQty + wQty;
  const wUnit  = 22;
  const cPrice = cUnit + wUnit;
  const wPrice = 37;
  const cAmt   = cPrice + wPrice;
  const wAmt   = tMR - cAmt;

  // Header row — navy background
  setFill(...NAVY);
  doc.rect(tML, y, tW, hH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  setColor(...WHITE);
  doc.text("DESCRIPTION",      cDesc  + 3, y + 6.5);
  doc.text("QTY",              cQty   + 2, y + 6.5);
  doc.text("UNIT",             cUnit  + 2, y + 6.5);
  doc.text("UNIT PRICE\n(PHP)", cPrice + 2, y + 4);
  doc.text("AMOUNT\n(PHP)",    cAmt   + 2, y + 4);
  y += hH;

  // ── Line item rows ─────────────────────────────────────────────────────────
  const lineItems = [
    { desc: "Product Cost",       qty: qty, unit: "units", unitPrice: productCost,   amount: productCost },
    { desc: "Shipping & Freight", qty: 1,   unit: "lot",   unitPrice: shippingCost,  amount: shippingCost },
    { desc: "Customs & Duties",   qty: 1,   unit: "lot",   unitPrice: customsDuties, amount: customsDuties },
    { desc: "Other Expenses",     qty: 1,   unit: "lot",   unitPrice: otherExpenses,  amount: otherExpenses },
  ];

  setDraw(...NAVY);
  doc.setLineWidth(0.2);

  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i];
    const ry = y + i * rH;

    // Alternating row bg
    if (i % 2 === 0) {
      setFill(247, 250, 255);
      doc.rect(tML, ry, tW, rH, "F");
    } else {
      setFill(...WHITE);
      doc.rect(tML, ry, tW, rH, "F");
    }

    // Row border
    doc.rect(tML, ry, tW, rH, "S");

    // Vertical dividers
    setDraw(200, 210, 225);
    doc.line(cQty,   ry, cQty,   ry + rH);
    doc.line(cUnit,  ry, cUnit,  ry + rH);
    doc.line(cPrice, ry, cPrice, ry + rH);
    doc.line(cAmt,   ry, cAmt,   ry + rH);
    setDraw(...NAVY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setColor(...BLACK);
    doc.text(item.desc,          cDesc  + 3, ry + 6);
    doc.text(String(item.qty),   cQty   + 2, ry + 6);
    doc.text(item.unit,          cUnit  + 2, ry + 6);
    doc.text(n(item.unitPrice),  cPrice + 2, ry + 6);
    doc.text(n(item.amount),     cAmt   + 2, ry + 6);
  }

  y += lineItems.length * rH;

  // ── Total row ──────────────────────────────────────────────────────────────
  const totH = 12;
  setFill(235, 241, 250);
  doc.rect(tML, y, tW, totH, "F");
  doc.setLineWidth(0.4);
  doc.rect(tML, y, tW, totH, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setColor(...NAVY);
  doc.text("TOTAL AMOUNT:", cAmt - 35, y + 8, { align: "left" });

  setFill(...NAVY);
  doc.rect(cAmt, y, wAmt, totH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setColor(...WHITE);
  doc.text(`PHP`, cAmt + 2, y + 5);
  doc.setFontSize(11);
  doc.text(n(totalCost), cAmt + 2, y + 11);

  y += totH + 6;

  // Per-unit note
  if (perUnit > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    setColor(...GREY);
    doc.text(`Per unit: PHP ${n(perUnit)}`, MR, y, { align: "right" });
    y += 6;
  }

  y += 4;

  // ── WARRANTY & AFTER-SALES SUPPORT ────────────────────────────────────────
  // Check if we have space — if not, add a new page
  if (y > PH - 80) {
    doc.addPage();
    y = 20;
  }

  // Section heading
  setFill(...NAVY);
  doc.rect(ML, y - 4, 3, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setColor(...NAVY);
  doc.text("WARRANTY & AFTER-SALES SUPPORT:", ML + 6, y + 1);
  y += 8;

  const warrantyPoints = [
    "1-Year Warranty on major components against factory defects",
    "Free Technical Support Assistance during operational setup and deployment",
    "Priority Spare Parts Assistance for long-term operational reliability",
    "Dedicated After-Sales Coordination for maintenance and technical inquiries",
    "Factory Direct Import Advantage ensuring competitive pricing and premium-grade units",
    "Pre-Delivery Quality Inspection performed prior to shipment release",
    "Units Customization Available based on preferred specifications and project requirements",
    "Continuous Client Support Commitment to ensure smooth project operations",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setColor(...BLACK);
  for (const pt of warrantyPoints) {
    doc.text(`• ${pt}`, ML + 4, y);
    y += 5.5;
  }

  y += 6;

  // ── Check if we need page 2 for terms ─────────────────────────────────────
  if (y > PH - 70) {
    doc.addPage();
    y = 20;
  }

  // ── Thank you paragraph ────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(...BLACK);
  const thankYou =
    "Thank you for the opportunity to submit our proposal. We look forward to building a strong and long-term " +
    "partnership by providing reliable, premium-quality sourcing solutions with competitive pricing and " +
    "dependable after-sales support.";
  const tyLines = doc.splitTextToSize(thankYou, tW) as string[];
  doc.text(tyLines, ML, y);
  y += tyLines.length * 5 + 8;

  // ── TERMS AND CONDITIONS ───────────────────────────────────────────────────
  setFill(...NAVY);
  doc.rect(ML, y - 4, 3, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setColor(...NAVY);
  doc.text("TERMS AND CONDITIONS", ML + 6, y + 1);
  y += 8;

  const terms = [
    "Pricing is ALL-IN and inclusive of all applicable costs.",
    "Quotation validity: Fifteen (15) days from the date of issuance.",
    "100% payment upon placement of order.",
    "VAT Inclusive.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setColor(...BLACK);
  for (const t of terms) {
    doc.text(`• ${t}`, ML + 4, y);
    y += 5.5;
  }

  y += 14;

  // ── Prepared By signature block ────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(...GREY);
  doc.text("Prepared By:", ML, y);
  y += 16;

  // Signature line
  setDraw(...BLACK);
  doc.setLineWidth(0.5);
  doc.line(ML, y, ML + 70, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setColor(...NAVY);
  doc.text(COMPANY_NAME, ML, y);

  // ── Footer on every page ───────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc.internal as any).getNumberOfPages() as number;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setColor(...GREY);
    doc.text(
      `${COMPANY_NAME}  |  Ref: ${refNo}  |  Page ${p} of ${totalPages}`,
      PW / 2, PH - 8, { align: "center" }
    );
    // Bottom rule
    setDraw(200, 210, 225);
    doc.setLineWidth(0.2);
    doc.line(ML, PH - 11, MR, PH - 11);
  }

  // ── Return ─────────────────────────────────────────────────────────────────
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="quotation-${refNo}.pdf"`,
      "Cache-Control":       "private, no-cache",
    },
  });
}
