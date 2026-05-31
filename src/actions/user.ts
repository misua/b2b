"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserFormState =
  | { errors?: { email?: string[]; name?: string[]; password?: string[] }; message?: string; success?: boolean }
  | undefined;

// ─── Create Admin ─────────────────────────────────────────────────────────────

const CreateAdminSchema = z.object({
  email: z.string().email("Enter a valid email address.").trim(),
  name: z.string().min(2, "Name must be at least 2 characters.").trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Must contain an uppercase letter.")
    .regex(/[0-9]/, "Must contain a number."),
});

export async function createAdminUser(
  _state: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireAdmin();

  const validated = CreateAdminSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, name, password } = validated.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["An account with this email already exists."] } };
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, name, password: hashed, role: "ADMIN" },
  });

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

// ─── Change Role ──────────────────────────────────────────────────────────────

export async function changeUserRole(
  _state: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireAdmin();

  const userId = formData.get("userId") as string;
  const role = formData.get("role") as "CLIENT" | "ADMIN";

  if (!userId || !["CLIENT", "ADMIN"].includes(role)) {
    return { message: "Invalid input." };
  }

  // Prevent removing your own admin role
  if (userId === session.userId && role === "CLIENT") {
    return { message: "You cannot remove your own admin role." };
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

// ─── Delete User ──────────────────────────────────────────────────────────────

export async function deleteUser(
  _state: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireAdmin();

  const userId = formData.get("userId") as string;
  if (!userId) return { message: "User ID required." };

  if (userId === session.userId) {
    return { message: "You cannot delete your own account." };
  }

  // Check if user has orders/RFQs — soft protection
  const rfqCount = await prisma.rFQ.count({ where: { userId } });
  const orderCount = await prisma.order.count({ where: { userId } });

  if (rfqCount > 0 || orderCount > 0) {
    return {
      message: `Cannot delete — this user has ${rfqCount} RFQ(s) and ${orderCount} order(s).`,
    };
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}
