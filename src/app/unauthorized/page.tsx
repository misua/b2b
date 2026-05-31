import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = {
  title: "Unauthorized | B2B Sourcing Portal",
};

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-6xl font-bold text-muted-foreground">403</div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground text-sm">
          You don&apos;t have permission to view this page.
        </p>
        <ButtonLink href="/" variant="outline">
          Go to Dashboard
        </ButtonLink>
      </div>
    </main>
  );
}
