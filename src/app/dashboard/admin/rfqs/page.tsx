import type { Metadata } from "next";
import Link from "next/link";
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
import { ButtonLink } from "@/components/ui/button-link";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "All RFQs | Admin | B2B Sourcing Portal",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  QUOTED: "bg-blue-100 text-blue-800 border-blue-200",
  IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending Review",
  QUOTED: "Quoted",
  IN_PROGRESS: "In Progress",
  REJECTED: "Rejected",
};

export default async function AdminRFQsPage() {
  await requireAdmin();

  const rfqs = await prisma.rFQ.findMany({
    include: {
      user: { select: { name: true, email: true } },
      quotation: { include: { factory: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingCount = rfqs.filter((r) => r.status === "PENDING_REVIEW").length;
  const quotedCount = rfqs.filter((r) => r.status === "QUOTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
            <Link href="/dashboard/admin" className="hover:text-foreground">Dashboard</Link>
            <span>›</span>
            <span className="text-foreground">All RFQs</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight">Client RFQs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {rfqs.length} total · {pendingCount} pending review · {quotedCount} quoted
          </p>
        </div>
      </div>

      {rfqs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="text-4xl">📋</div>
            <p className="font-medium">No RFQs yet</p>
            <p className="text-sm text-muted-foreground">
              Client submissions will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rfqs.map((rfq) => (
            <Card key={rfq.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-base truncate">{rfq.productName}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>{rfq.user.name}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span>{rfq.user.email}</span>
                    </CardDescription>
                  </div>
                  <Badge className={STATUS_STYLES[rfq.status] ?? "bg-muted"}>
                    {STATUS_LABELS[rfq.status] ?? rfq.status}
                  </Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                    <div>
                      <span className="text-foreground font-medium">Qty:</span>{" "}
                      {rfq.quantity.toLocaleString()} units
                    </div>
                    <div>
                      <span className="text-foreground font-medium">Submitted:</span>{" "}
                      {new Date(rfq.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    {rfq.imageUrls.length > 0 && (
                      <div>
                        <span className="text-foreground font-medium">Files:</span>{" "}
                        {rfq.imageUrls.length} attached
                      </div>
                    )}
                    {rfq.quotation && (
                      <div>
                        <span className="text-foreground font-medium">Total:</span>{" "}
                        ${Number(rfq.quotation.totalCost).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    )}
                    {rfq.quotation?.factory && (
                      <div className="flex items-center gap-1">
                        <span>🏭</span>
                        <span className="text-foreground font-medium">
                          {rfq.quotation.factory.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <ButtonLink
                    href={`/dashboard/admin/rfqs/${rfq.id}`}
                    size="sm"
                    variant={rfq.quotation ? "outline" : "default"}
                  >
                    {rfq.quotation ? "Edit Quotation" : "Create Quotation →"}
                  </ButtonLink>
                </div>

                {/* Spec preview */}
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {rfq.specifications}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
