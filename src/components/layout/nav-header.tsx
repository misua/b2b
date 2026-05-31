"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface NavHeaderProps {
  userName: string;
  userEmail: string;
  role: "CLIENT" | "ADMIN";
  /** Number of pending (unquoted) RFQs — admin only */
  pendingRfqCount?: number;
}

interface NavLink {
  href: string;
  label: string;
  badge?: number; // optional notification count
}

const CLIENT_LINKS: NavLink[] = [
  { href: "/dashboard/client", label: "Dashboard" },
  { href: "/dashboard/client/rfq/new", label: "New RFQ" },
];

function getAdminLinks(pendingRfqCount: number): NavLink[] {
  return [
    { href: "/dashboard/admin", label: "Dashboard" },
    { href: "/dashboard/admin/rfqs", label: "RFQs", badge: pendingRfqCount },
    { href: "/dashboard/admin/orders", label: "Orders" },
    { href: "/dashboard/admin/factories", label: "Factories" },
    { href: "/dashboard/admin/users", label: "Users" },
  ];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function NavHeader({
  userName,
  userEmail,
  role,
  pendingRfqCount = 0,
}: NavHeaderProps) {
  const pathname = usePathname();
  const links =
    role === "ADMIN" ? getAdminLinks(pendingRfqCount) : CLIENT_LINKS;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-14 items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            B2B
          </div>
          <span className="font-semibold text-sm hidden sm:block">
            Sourcing Portal
          </span>
          <Badge
            variant={role === "ADMIN" ? "default" : "secondary"}
            className="text-xs hidden sm:flex"
          >
            {role}
          </Badge>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {links.map((link) => {
            const isActive =
              link.href === "/dashboard/admin" ||
              link.href === "/dashboard/client"
                ? pathname === link.href
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}

                {/* Notification badge — red dot with count */}
                {link.badge != null && link.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground leading-none">
                    {link.badge > 99 ? "99+" : link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative h-9 w-9 rounded-full shrink-0 cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Open user menu"
          >
            <Avatar className="h-9 w-9 pointer-events-none">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end">
            <div className="px-2 py-1.5 flex flex-col space-y-0.5">
              <p className="text-sm font-medium leading-none truncate">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => logout()}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
