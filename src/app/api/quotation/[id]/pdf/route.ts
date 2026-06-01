import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

async function getJsPDF() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}

// ─── Company details (hardcoded from LAJ Konnect) ────────────────────────────
const CO_NAME    = "LAJ GLOBAL KONECT TRADING CORPORATION";
const CO_ADDR1   = "Blk 20 Lot 1, Pumice St., Wellspring Village 1";
const CO_ADDR2   = "Catalunan Pequeño, Davao City";
const CO_TIN     = "TIN: 010-952-151-000";

// ─── Colours ──────────────────────────────────────────────────────────────────
const NAVY  : [number,number,number] = [26,  57,  96];
const WHITE : [number,number,number] = [255, 255, 255];
const LIGHT : [number,number,number] = [240, 245, 252];
const LGREY : [number,number,number] = [248, 249, 251];
const GREY  : [number,number,number] = [110, 110, 110];
const BLACK : [number,number,number] = [25,  25,  25];

function nf(v: number) {
  return v.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        include: { user: { select: { name: true } } },
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

  const JsPDF = await getJsPDF();
  const doc   = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = 210;
  const PH = 297;
  const ML = 14;   // left margin
  const MR = 196;  // right margin
  const CW = MR - ML; // content width = 182

  // ── Helpers ────────────────────────────────────────────────────────────────
  function tc(r: number, g: number, b: number) { doc.setTextColor(r, g, b); }
  function fc(r: number, g: number, b: number) { doc.setFillColor(r, g, b); }
  function dc(r: number, g: number, b: number) { doc.setDrawColor(r, g, b); }
  function txt(s: string, x: number, y: number, opts?: { align?: "left"|"right"|"center", maxWidth?: number }) {
    doc.text(s, x, y, opts as Parameters<typeof doc.text>[3]);
  }
  function rect(x: number, y: number, w: number, h: number, style: "F"|"S"|"FD") {
    doc.rect(x, y, w, h, style);
  }
  function line(x1: number, y1: number, x2: number, y2: number) {
    doc.line(x1, y1, x2, y2);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 1
  // ══════════════════════════════════════════════════════════════════════════
  let y = 16;

  // ── Company name (left, bold, navy) ───────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  tc(...NAVY);
  txt(CO_NAME, ML, y);

  // ── "QUOTATION" (right, bold, navy, large) ────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  tc(...NAVY);
  txt("QUOTATION", MR, y, { align: "right" });

  // ── Address block ─────────────────────────────────────────────────────────
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  tc(...GREY);
  txt(CO_ADDR1, ML, y);
  y += 4;
  txt(CO_ADDR2, ML, y);
  y += 4;
  txt(CO_TIN, ML, y);
  y += 8;

  // ── Info grid ─────────────────────────────────────────────────────────────
  // 3 rows, 4 columns: [Label | Value | Label | Value]
  // Col positions
  const G = {
    x1: ML,         // col1 label start
    x2: ML + 26,    // col1 value start
    x3: ML + 95,    // col2 label start
    x4: ML + 115,   // col2 value start
    rH: 10,         // row height
    w:  CW,
  };

  dc(...NAVY);
  doc.setLineWidth(0.3);

  type Row4 = [string, string, string, string];
  const gridData: Row4[] = [
    ["Date:",    dateStr,    "Quotation No.:", refNo],
    ["Client:",  clientName, "Product:",       productName],
    ["Address:", "",         "",               ""],
  ];

  gridData.forEach((row, i) => {
    const ry = y + i * G.rH;
    // Background
    fc(...(i % 2 === 0 ? LIGHT : LGREY));
    rect(ML, ry, G.w, G.rH, "FD");

    // Labels
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    tc(...NAVY);
    txt(row[0], G.x1 + 2, ry + 6.5);
    txt(row[2], G.x3 + 2, ry + 6.5);

    // Values
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    tc(...BLACK);
    if (row[1]) {
      const lines = doc.splitTextToSize(row[1], G.x3 - G.x2 - 4) as string[];
      txt(lines[0], G.x2, ry + 6.5);
    }
    if (row[3]) {
      const lines = doc.splitTextToSize(row[3], MR - G.x4 - 2) as string[];
      txt(lines[0], G.x4, ry + 6.5);
    }
  });

  y += gridData.length * G.rH + 8;

  // ── Section: QUOTATION DETAILS ────────────────────────────────────────────
  fc(...NAVY);
  rect(ML, y - 3, 3, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  tc(...NAVY);
  txt("QUOTATION DETAILS", ML + 6, y + 2);
  y += 9;

  // ── Table columns ─────────────────────────────────────────────────────────
  // Desc | Qty | Unit | Unit Price (PHP) | Amount (PHP)
  const T = {
    x:    ML,
    hH:   9,   // header height
    rH:   8.5, // row height
    // column x-starts
    c1: ML,          // Description
    c2: ML + 79,     // Qty
    c3: ML + 92,     // Unit
    c4: ML + 114,    // Unit Price
    c5: ML + 149,    // Amount
    // widths
    w1: 79, w2: 13, w3: 22, w4: 35, w5: MR - (ML + 149),
    W:  CW,
  };

  // Header row
  fc(...NAVY);
  rect(T.x, y, T.W, T.hH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  tc(...WHITE);
  txt("DESCRIPTION",       T.c1 + 2,  y + 5.5);
  txt("QTY",               T.c2 + 2,  y + 5.5);
  txt("UNIT",              T.c3 + 2,  y + 5.5);
  txt("UNIT PRICE (PHP)",  T.c4 + 2,  y + 3.5);
  txt("AMOUNT (PHP)",      T.c5 + 2,  y + 3.5);
  y += T.hH;

  // Data rows
  const items = [
    { desc: `${productName} (Product Cost)`, qty: qty,  unit: "units", up: productCost,   amt: productCost   },
    { desc: "Shipping & Freight",             qty: 1,    unit: "lot",   up: shippingCost,  amt: shippingCost  },
    { desc: "Customs & Duties",               qty: 1,    unit: "lot",   up: customsDuties, amt: customsDuties },
    { desc: "Other Expenses",                 qty: 1,    unit: "lot",   up: otherExpenses, amt: otherExpenses },
  ];

  dc(200, 212, 230);
  doc.setLineWidth(0.2);

  items.forEach((item, i) => {
    const ry = y + i * T.rH;
    fc(...(i % 2 === 0 ? [247, 250, 255] as [number,number,number] : WHITE));
    rect(T.x, ry, T.W, T.rH, "FD");

    // Vertical dividers
    dc(200, 212, 230);
    [T.c2, T.c3, T.c4, T.c5].forEach(cx => line(cx, ry, cx, ry + T.rH));

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    tc(...BLACK);
    // Truncate description if too wide
    const descLines = doc.splitTextToSize(item.desc, T.w1 - 4) as string[];
    txt(descLines[0], T.c1 + 2, ry + 5.5);
    txt(String(item.qty), T.c2 + 2, ry + 5.5);
    txt(item.unit,        T.c3 + 2, ry + 5.5);
    txt(nf(item.up),      T.c4 + 2, ry + 5.5);
    txt(nf(item.amt),     T.c5 + 2, ry + 5.5);
  });

  y += items.length * T.rH;

  // ── Total row ──────────────────────────────────────────────────────────────
  const totH = 11;
  fc(235, 241, 250);
  dc(...NAVY);
  doc.setLineWidth(0.4);
  rect(T.x, y, T.W, totH, "FD");

  // "TOTAL AMOUNT:" label spanning first 3 cols
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  tc(...NAVY);
  txt("TOTAL AMOUNT:", T.c5 - 38, y + 7.5, { align: "left" });

  // Amount cell — navy fill
  fc(...NAVY);
  rect(T.c5, y, T.w5, totH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  tc(...WHITE);
  txt("PHP",      T.c5 + 2, y + 4.5);
  doc.setFontSize(10);
  txt(nf(totalCost), T.c5 + 2, y + 10);

  y += totH + 4;

  // Per-unit note
  if (perUnit > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    tc(...GREY);
    txt(`Per unit: PHP ${nf(perUnit)}`, MR, y, { align: "right" });
    y += 5;
  }

  y += 6;

  // ── WARRANTY & AFTER-SALES SUPPORT ────────────────────────────────────────
  if (y > PH - 90) { doc.addPage(); y = 18; }

  fc(...NAVY);
  rect(ML, y - 3, 3, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  tc(...NAVY);
  txt("WARRANTY & AFTER-SALES SUPPORT:", ML + 6, y + 2);
  y += 10;

  const warranty = [
    "1-Year Warranty on major engine and mechanical components against factory defects",
    "Free Technical Support Assistance during operational setup and deployment",
    "Priority Spare Parts Assistance for long-term operational reliability",
    "Dedicated After-Sales Coordination for maintenance concerns and technical inquiries",
    "Factory Direct Import Advantage ensuring competitive pricing and premium-grade units",
    "Pre-Delivery Quality Inspection performed prior to shipment release",
    "Units Customization Available based on preferred specifications, color, and project requirements",
    "Continuous Client Support Commitment to ensure smooth project operations and customer satisfaction",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  tc(...BLACK);
  for (const pt of warranty) {
    if (y > PH - 20) { doc.addPage(); y = 18; }
    const lines = doc.splitTextToSize(`• ${pt}`, CW - 6) as string[];
    doc.text(lines, ML + 4, y);
    y += lines.length * 4.8 + 0.5;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 2 (or continue if space)
  // ══════════════════════════════════════════════════════════════════════════
  if (y > PH - 80) { doc.addPage(); y = 18; } else { y += 8; }

  // ── Thank you ─────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  tc(...BLACK);
  const ty = "Thank you for the opportunity to submit our proposal. We look forward to building a strong and long-term " +
    "partnership by providing reliable, premium-quality sourcing solutions with competitive project pricing and " +
    "dependable after-sales support.";
  const tyL = doc.splitTextToSize(ty, CW) as string[];
  doc.text(tyL, ML, y);
  y += tyL.length * 5 + 8;

  // ── TERMS AND CONDITIONS ───────────────────────────────────────────────────
  if (y > PH - 60) { doc.addPage(); y = 18; }

  fc(...NAVY);
  rect(ML, y - 3, 3, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  tc(...NAVY);
  txt("TERMS AND CONDITIONS", ML + 6, y + 2);
  y += 10;

  const terms = [
    "Pricing is ALL-IN and inclusive of shipping, delivery charges, and applicable costs.",
    "Quotation validity: Fifteen (15) days from the date of issuance.",
    "100% payment upon placement of order.",
    "VAT Inclusive.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  tc(...BLACK);
  for (const t of terms) {
    const lines = doc.splitTextToSize(`• ${t}`, CW - 6) as string[];
    doc.text(lines, ML + 4, y);
    y += lines.length * 5 + 0.5;
  }

  y += 16;

  // ── Prepared By ───────────────────────────────────────────────────────────
  if (y > PH - 35) { doc.addPage(); y = 18; }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  tc(...GREY);
  txt("Prepared By:", ML, y);
  y += 16;

  dc(...BLACK);
  doc.setLineWidth(0.5);
  line(ML, y, ML + 72, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  tc(...NAVY);
  txt(CO_NAME, ML, y);

  // ── Footer on all pages ───────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc.internal as any).getNumberOfPages() as number;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    dc(200, 210, 225);
    doc.setLineWidth(0.2);
    line(ML, PH - 11, MR, PH - 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    tc(...GREY);
    txt(
      `${CO_NAME}  |  Ref: ${refNo}  |  Page ${p} of ${totalPages}`,
      PW / 2, PH - 7, { align: "center" }
    );
  }

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="quotation-${refNo}.pdf"`,
      "Cache-Control":       "private, no-cache",
    },
  });
}
