import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CostingCalculator } from "@/components/admin/costing-calculator";

export const metadata: Metadata = {
  title: "Costing Calculator | Admin | B2B Sourcing Portal",
};

export default async function AdminRFQDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [rfq, factories] = await Promise.all([
    prisma.rFQ.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        quotation: { include: { factory: true } },
      },
    }),
    prisma.factory.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!rfq) notFound();

  const existingQuotation = rfq.quotation
    ? {
        productCost: Number(rfq.quotation.productCost),
        shippingCost: Number(rfq.quotation.shippingCost),
        customsDuties: Number(rfq.quotation.customsDuties),
        otherExpenses: Number(rfq.quotation.otherExpenses),
        totalCost: Number(rfq.quotation.totalCost),
        factoryId: rfq.quotation.factoryId,
      }
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground flex items-center gap-2">
        <Link href="/dashboard/admin" className="hover:text-foreground">Dashboard</Link>
        <span>›</span>
        <Link href="/dashboard/admin/rfqs" className="hover:text-foreground">RFQs</Link>
        <span>›</span>
        <span className="text-foreground truncate max-w-48">{rfq.productName}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── Left: RFQ Details ───────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {/* RFQ summary */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{rfq.productName}</CardTitle>
                  <CardDescription className="mt-1">
                    Submitted by {rfq.user.name} ({rfq.user.email})
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {new Date(rfq.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Badge>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Target Quantity
                </p>
                <p className="text-2xl font-bold">
                  {rfq.quantity.toLocaleString()} <span className="text-base font-normal text-muted-foreground">units</span>
                </p>
              </div>

              {rfq.quotation?.factory && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Assigned Factory
                  </p>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
                    <span>🏭</span>
                    <span>{rfq.quotation.factory.name}</span>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Specifications
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">
                  {rfq.specifications}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reference files */}
          {rfq.imageUrls.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Reference Files ({rfq.imageUrls.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {rfq.imageUrls.map((url) => {
                    const isPdf = url.endsWith(".pdf");
                    return (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-lg overflow-hidden border bg-muted hover:border-primary transition-colors"
                      >
                        {isPdf ? (
                          <div className="h-24 flex flex-col items-center justify-center gap-1 text-muted-foreground group-hover:text-foreground">
                            <span className="text-2xl">📄</span>
                            <span className="text-xs">PDF</span>
                          </div>
                        ) : (
                          <div className="relative h-24">
                            <Image
                              src={url}
                              alt="Reference"
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 33vw, 150px"
                            />
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─── Right: Costing Calculator ───────────────────────────── */}
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">
                {existingQuotation ? "Edit Quotation" : "Create Quotation"}
              </CardTitle>
              <CardDescription>
                Enter costs in USD. The total is sent to the client for approval.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <CostingCalculator
                rfqId={rfq.id}
                factories={factories}
                existingQuotation={existingQuotation}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
