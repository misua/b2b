import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Separator } from "@/components/ui/separator";
import { CreateAdminForm } from "@/components/admin/create-admin-form";
import { UserRow } from "@/components/admin/user-row";

export const metadata: Metadata = {
  title: "User Management | Admin | B2B Sourcing Portal",
};

export default async function AdminUsersPage() {
  const session = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { rfqs: true, orders: true } },
    },
  });

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const clientCount = users.filter((u) => u.role === "CLIENT").length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Link href="/dashboard/admin" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span>›</span>
        <span className="text-foreground font-medium">Users</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {adminCount} admin{adminCount !== 1 ? "s" : ""} ·{" "}
          {clientCount} client{clientCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Create admin */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b bg-muted/30">
          <p className="text-sm font-semibold">Add Admin Account</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Admin accounts have full access to RFQs, orders, factories, and user management.
            Share credentials securely — users should change their password after first login.
          </p>
        </div>
        <div className="p-5">
          <CreateAdminForm />
        </div>
      </div>

      {/* User list */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b bg-muted/30 flex items-center justify-between">
          <p className="text-sm font-semibold">All Users</p>
          <p className="text-xs text-muted-foreground">{users.length} total</p>
        </div>

        {/* Admins */}
        {users.filter((u) => u.role === "ADMIN").length > 0 && (
          <>
            <div className="px-5 py-2 bg-muted/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Admins
              </p>
            </div>
            {users
              .filter((u) => u.role === "ADMIN")
              .map((user, idx, arr) => (
                <div key={user.id}>
                  {idx > 0 && <Separator />}
                  <UserRow user={user} currentUserId={session.userId} />
                </div>
              ))}
          </>
        )}

        {/* Clients */}
        {users.filter((u) => u.role === "CLIENT").length > 0 && (
          <>
            <Separator />
            <div className="px-5 py-2 bg-muted/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Clients
              </p>
            </div>
            {users
              .filter((u) => u.role === "CLIENT")
              .map((user, idx) => (
                <div key={user.id}>
                  {idx > 0 && <Separator />}
                  <UserRow user={user} currentUserId={session.userId} />
                </div>
              ))}
          </>
        )}

        {users.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No users yet.
          </div>
        )}
      </div>

      <div className="rounded-lg bg-muted/30 border px-4 py-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Note:</strong> Client accounts are created when
        clients register or are added here with the CLIENT role. To change a client to an
        admin, hover their row and click <strong>Make Admin</strong>.
      </div>
    </div>
  );
}
