import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof buttonVariants> &
  Omit<ComponentPropsWithoutRef<typeof Button>, "render" | "href">;

/**
 * A Button that renders as a Next.js Link (<a> tag).
 * Sets nativeButton={false} to suppress the base-ui accessibility warning
 * that fires when a non-<button> element is used as the render target.
 */
export function ButtonLink({
  href,
  children,
  variant,
  size,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Button
      render={<Link href={href} />}
      nativeButton={false}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}
