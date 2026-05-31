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

interface NavHeaderProps {
  userName: string;
  userEmail: string;
  role: "CLIENT" | "ADMIN";
  pendingRfqCount?: number;
}

interface NavLink {
  href: string;
  label: string;
  badge?: number;
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
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-16 items-center gap-6">

        {/* ── Logo mark ── */}
        <Link href={role === "ADMIN" ? "/dashboard/admin" : "/dashboard/client"} className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
            <span className="font-heading font-bold text-xs text-primary-foreground tracking-tight">
              B2B
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="font-heading font-semibold text-sm text-foreground">
              Sourcing
            </span>
            <span className="font-heading font-semibold text-sm text-primary ml-0.5">
              Portal
            </span>
          </div>
        </Link>

        {/* ── Divider ── */}
        <div className="hidden sm:block w-px h-5 bg-border/60 shrink-0" />

        {/* ── Nav links ── */}
        <nav className="flex items-center gap-0.5 flex-1">
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
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {link.label}

                {/* Active underline indicator */}
                {isActive && (
                  <span className="absolute bottom-1 left-3 right-3 h-0.5 rounded-full bg-primary" />
                )}

                {/* Notification badge */}
                {link.badge != null && link.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white leading-none shadow-sm">
                    {link.badge > 99 ? "99+" : link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Role chip ── */}
        <span
          className={`hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-widest uppercase shrink-0 ${
            role === "ADMIN"
              ? "bg-primary/15 text-primary border border-primary/25"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          {role}
        </span>

        {/* ── User menu ── */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative h-9 w-9 rounded-full shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-primary/30 transition-all focus-visible:outline-none focus-visible:ring-primary/50"
            aria-label="Open user menu"
          >
            <Avatar className="h-9 w-9 pointer-events-none">
              <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end">
            <div className="px-3 py-2 flex flex-col space-y-0.5">
              <p className="text-sm font-semibold leading-none truncate">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground truncate mt-1">
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
