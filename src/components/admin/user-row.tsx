"use client";

import { useActionState } from "react";
import { changeUserRole, deleteUser } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UserFormState } from "@/actions/user";

interface UserRowProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "CLIENT" | "ADMIN";
    createdAt: Date;
    _count: { rfqs: number; orders: number };
  };
  currentUserId: string;
}

export function UserRow({ user, currentUserId }: UserRowProps) {
  const [roleState, roleAction, isRolePending] = useActionState<UserFormState, FormData>(
    changeUserRole,
    undefined
  );
  const [deleteState, deleteAction, isDeletePending] = useActionState<UserFormState, FormData>(
    deleteUser,
    undefined
  );

  const isSelf = user.id === currentUserId;
  const canDelete = !isSelf && user._count.rfqs === 0 && user._count.orders === 0;

  return (
    <div className="px-5 py-3.5 hover:bg-muted/20 transition-colors group">
      {/* User info */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{user.name}</p>
            {isSelf && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                You
              </span>
            )}
            <Badge
              variant={user.role === "ADMIN" ? "default" : "secondary"}
              className="text-xs"
            >
              {user.role}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Joined {new Date(user.createdAt).toLocaleDateString("en-US", {
              day: "numeric", month: "short", year: "numeric",
            })}
            {" · "}
            {user._count.rfqs} RFQ{user._count.rfqs !== 1 ? "s" : ""}
            {" · "}
            {user._count.orders} order{user._count.orders !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Toggle role */}
          {!isSelf && (
            <form action={roleAction}>
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="role" value={user.role === "ADMIN" ? "CLIENT" : "ADMIN"} />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={isRolePending}
              >
                {isRolePending
                  ? "…"
                  : user.role === "ADMIN"
                  ? "Make Client"
                  : "Make Admin"}
              </Button>
            </form>
          )}

          {/* Delete */}
          <form action={deleteAction}>
            <input type="hidden" name="userId" value={user.id} />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="h-7 text-xs text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
              disabled={isDeletePending || !canDelete}
              title={
                isSelf
                  ? "Cannot delete your own account"
                  : !canDelete
                  ? "User has RFQs or orders — cannot delete"
                  : "Delete user"
              }
            >
              {isDeletePending ? "…" : "Delete"}
            </Button>
          </form>
        </div>
      </div>

      {/* Error messages */}
      {(roleState?.message || deleteState?.message) && (
        <p className="text-xs text-destructive mt-1.5">
          {roleState?.message ?? deleteState?.message}
        </p>
      )}
    </div>
  );
}
