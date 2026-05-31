"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { LoginSchema } from "@/lib/definitions";
import type { FormState } from "@/lib/definitions";

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  // 1. Validate input
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;

  // 2. Find user in database
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { message: "Invalid email or password." };
  }

  // 3. Verify password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return { message: "Invalid email or password." };
  }

  // 4. Create session cookie
  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // 5. Redirect based on role
  redirect(user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/client");
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
