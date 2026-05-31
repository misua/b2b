import type { Metadata } from "next";
import Link from "next/link";
import { requireClient } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RFQForm } from "@/components/rfq/rfq-form";

export const metadata: Metadata = {
  title: "Submit RFQ | B2B Sourcing Portal",
};

export default async function NewRFQPage() {
  await requireClient();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground flex items-center gap-2">
        <Link href="/dashboard/client" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span>›</span>
        <span className="text-foreground">New RFQ</span>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>Submit a New Request for Quotation</CardTitle>
          <CardDescription>
            Provide as much detail as possible. Our team will review your request and
            send a detailed cost breakdown within 1–2 business days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RFQForm />
        </CardContent>
      </Card>
    </div>
  );
}
