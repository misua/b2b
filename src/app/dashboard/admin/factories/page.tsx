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
import { FactoryAddForm } from "@/components/admin/factory-add-form";
import { FactoryRow } from "@/components/admin/factory-row";

export const metadata: Metadata = {
  title: "Factories | Admin | B2B Sourcing Portal",
};

export default async function AdminFactoriesPage() {
  await requireAdmin();

  const factories = await prisma.factory.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      contactPerson: true,
      email: true,
      whatsapp: true,
      notes: true,
      createdAt: true,
      _count: { select: { quotations: true } },
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground flex items-center gap-2">
        <Link href="/dashboard/admin" className="hover:text-foreground">
          Dashboard
        </Link>
        <span>›</span>
        <span className="text-foreground">Factories</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Factories</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage the supplier factories used in your quotations.{" "}
          {factories.length > 0 && `${factories.length} registered.`}
        </p>
      </div>

      {/* Add factory */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add New Factory</CardTitle>
          <CardDescription>
            Enter the factory name exactly as you want it to appear on quotations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FactoryAddForm />
        </CardContent>
      </Card>

      {/* Factory list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Registered Factories</CardTitle>
          {factories.length > 0 && (
            <CardDescription>
              Hover over a row to edit or delete. Factories with linked quotations cannot be deleted.
            </CardDescription>
          )}
        </CardHeader>

        {factories.length === 0 ? (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <span className="text-3xl">🏭</span>
              <p className="text-sm font-medium">No factories yet</p>
              <p className="text-xs text-muted-foreground">
                Add your first factory above to start assigning them to quotations.
              </p>
            </div>
          </CardContent>
        ) : (
          <div>
            {factories.map((factory) => (
              <FactoryRow key={factory.id} factory={factory} />
            ))}
          </div>
        )}
      </Card>

      {/* Usage tip */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Tip:</strong> Assign a factory to a quotation when
          you open an RFQ from the{" "}
          <Link href="/dashboard/admin/rfqs" className="text-primary underline underline-offset-2">
            RFQs page
          </Link>
          . The factory will appear on the order detail for your internal reference.
        </p>
      </div>
    </div>
  );
}
