import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In | B2B Sourcing Portal",
  description: "Sign in to your B2B Sourcing Portal account",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground text-xl font-bold mb-2">
            B2B
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sourcing Portal</h1>
          <p className="text-sm text-muted-foreground">
            Track your orders from factory to doorstep
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Need access?{" "}
          <span className="font-medium text-foreground">
            Contact your account manager
          </span>
        </p>
      </div>
    </main>
  );
}
