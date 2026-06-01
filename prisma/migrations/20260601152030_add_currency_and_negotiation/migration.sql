-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PHP',
ADD COLUMN     "negotiationStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "QuotationRevision" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "productCost" DECIMAL(10,2) NOT NULL,
    "shippingCost" DECIMAL(10,2) NOT NULL,
    "customsDuties" DECIMAL(10,2) NOT NULL,
    "otherExpenses" DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationMessage" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "senderRole" "Role" NOT NULL,
    "senderName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "targetPrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuotationRevision" ADD CONSTRAINT "QuotationRevision_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationMessage" ADD CONSTRAINT "QuotationMessage_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Data backfill ──────────────────────────────────────────────────────────────
-- Clean up test data: remove orders, order logs, and quotations in correct FK order.
-- Keeps users, RFQs, and factories intact.
DELETE FROM "OrderStatusLog";
DELETE FROM "Order";
DELETE FROM "Quotation";

-- Reset RFQ statuses so the slate is clean (pending review again)
UPDATE "RFQ" SET "status" = 'PENDING_REVIEW' WHERE "status" IN ('QUOTED','IN_PROGRESS','COMPLETED','COUNTER_OFFERED');
