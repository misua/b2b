import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In | B2B Sourcing Portal",
  description: "Sign in to your B2B Sourcing Portal account",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex">
      {/* ── Left panel — brand identity ── */}
      <div className="hidden lg:flex lg:w-[52%] brand-gradient flex-col justify-between p-12 relative overflow-hidden">
        {/* Background geometric decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large circle top-right */}
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
            style={{ background: "oklch(0.80 0.16 55)" }}
          />
          {/* Medium circle bottom-left */}
          <div
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-8"
            style={{ background: "oklch(0.75 0.14 60)" }}
          />
          {/* Thin diagonal lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-5"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 60 0 L 0 0 0 60"
                  fill="none"
                  stroke="oklch(0.85 0.12 55)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{
                background: "oklch(0.72 0.17 52)",
                color: "oklch(0.10 0.02 52)",
              }}
            >
              B2B
            </div>
            <span
              className="font-heading font-semibold text-lg tracking-tight"
              style={{ color: "oklch(0.92 0.05 65)" }}
            >
              Sourcing Portal
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1
              className="font-heading text-4xl font-700 leading-tight tracking-tight"
              style={{ color: "oklch(0.97 0.01 70)" }}
            >
              From factory floor
              <br />
              <span style={{ color: "oklch(0.78 0.16 55)" }}>
                to your doorstep.
              </span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-sm"
              style={{ color: "oklch(0.72 0.04 65)" }}
            >
              Track every sourcing request, quotation, and shipment milestone
              in one place — with full visibility for you and your clients.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {[
              "📋 RFQ Management",
              "💰 Cost Transparency",
              "🚢 Live Tracking",
              "🏭 Factory History",
            ].map((f) => (
              <span
                key={f}
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{
                  background: "oklch(1 0 0 / 8%)",
                  color: "oklch(0.85 0.06 65)",
                  border: "1px solid oklch(1 0 0 / 12%)",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p
            className="text-xs"
            style={{ color: "oklch(0.55 0.04 60)" }}
          >
            Trusted B2B sourcing infrastructure
          </p>
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-bold text-xs text-primary-foreground">
            B2B
          </div>
          <span className="font-heading font-semibold text-base">
            Sourcing Portal
          </span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          {/* Heading */}
          <div className="space-y-1">
            <h2 className="font-heading text-2xl font-600 tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <LoginForm />
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground">
            Need access?{" "}
            <span className="font-medium text-foreground">
              Contact your account manager
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
