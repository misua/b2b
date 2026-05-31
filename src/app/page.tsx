import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

/**
 * Root route — redirects authenticated users to their role-specific dashboard,
 * and unauthenticated users to the login page.
 */
export default async function RootPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  redirect("/dashboard/client");
}
