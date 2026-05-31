"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const FactorySchema = z.object({
  name: z
    .string()
    .min(2, "Factory name must be at least 2 characters.")
    .max(100, "Factory name must be under 100 characters.")
    .trim(),
  // All contact fields are optional — empty strings become null in the DB
  contactPerson: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
  whatsapp: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type FactoryFormState =
  | {
      errors?: {
        name?: string[];
        contactPerson?: string[];
        email?: string[];
        whatsapp?: string[];
        notes?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

// ─── Helper: coerce empty string → null for optional fields ──────────────────

function nullIfEmpty(val: FormDataEntryValue | null): string | null {
  if (!val || String(val).trim() === "") return null;
  return String(val).trim();
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createFactory(
  _state: FactoryFormState,
  formData: FormData
): Promise<FactoryFormState> {
  await requireAdmin();

  const validated = FactorySchema.safeParse({
    name: formData.get("name"),
    contactPerson: formData.get("contactPerson") || undefined,
    email: formData.get("email") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name } = validated.data;

  const existing = await prisma.factory.findUnique({ where: { name } });
  if (existing) {
    return { errors: { name: ["A factory with this name already exists."] } };
  }

  await prisma.factory.create({
    data: {
      name,
      contactPerson: nullIfEmpty(formData.get("contactPerson")),
      email: nullIfEmpty(formData.get("email")),
      whatsapp: nullIfEmpty(formData.get("whatsapp")),
      notes: nullIfEmpty(formData.get("notes")),
    },
  });

  revalidatePath("/dashboard/admin/factories");
  return { success: true };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateFactory(
  _state: FactoryFormState,
  formData: FormData
): Promise<FactoryFormState> {
  await requireAdmin();

  const id = formData.get("id") as string;
  if (!id) return { message: "Factory ID is required." };

  const validated = FactorySchema.safeParse({
    name: formData.get("name"),
    contactPerson: formData.get("contactPerson") || undefined,
    email: formData.get("email") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name } = validated.data;

  const existing = await prisma.factory.findFirst({
    where: { name, NOT: { id } },
  });
  if (existing) {
    return { errors: { name: ["A factory with this name already exists."] } };
  }

  await prisma.factory.update({
    where: { id },
    data: {
      name,
      contactPerson: nullIfEmpty(formData.get("contactPerson")),
      email: nullIfEmpty(formData.get("email")),
      whatsapp: nullIfEmpty(formData.get("whatsapp")),
      notes: nullIfEmpty(formData.get("notes")),
    },
  });

  revalidatePath("/dashboard/admin/factories");
  return { success: true };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteFactory(
  _state: FactoryFormState,
  formData: FormData
): Promise<FactoryFormState> {
  await requireAdmin();

  const id = formData.get("id") as string;
  if (!id) return { message: "Factory ID is required." };

  const quotationCount = await prisma.quotation.count({
    where: { factoryId: id },
  });
  if (quotationCount > 0) {
    return {
      message: `Cannot delete — this factory is assigned to ${quotationCount} quotation(s). Reassign them first.`,
    };
  }

  await prisma.factory.delete({ where: { id } });

  revalidatePath("/dashboard/admin/factories");
  return { success: true };
}

// ─── Get all ──────────────────────────────────────────────────────────────────

export async function getAllFactories() {
  await requireAdmin();
  return prisma.factory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { quotations: true } } },
  });
}

// ─── Factory Notes ────────────────────────────────────────────────────────────

export type FactoryNoteFormState =
  | { errors?: { content?: string[] }; message?: string; success?: boolean }
  | undefined;

export async function addFactoryNote(
  _state: FactoryNoteFormState,
  formData: FormData
): Promise<FactoryNoteFormState> {
  await requireAdmin();

  const factoryId = formData.get("factoryId") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!factoryId) return { message: "Factory ID is required." };

  if (!content || content.length < 2) {
    return { errors: { content: ["Note must be at least 2 characters."] } };
  }
  if (content.length > 1000) {
    return { errors: { content: ["Note must be under 1000 characters."] } };
  }

  // Verify the factory exists
  const factory = await prisma.factory.findUnique({ where: { id: factoryId } });
  if (!factory) return { message: "Factory not found." };

  await prisma.factoryNote.create({ data: { factoryId, content } });

  revalidatePath(`/dashboard/admin/factories/${factoryId}`);
  return { success: true };
}

export async function deleteFactoryNote(
  _state: FactoryNoteFormState,
  formData: FormData
): Promise<FactoryNoteFormState> {
  await requireAdmin();

  const noteId = formData.get("noteId") as string;
  const factoryId = formData.get("factoryId") as string;
  if (!noteId) return { message: "Note ID is required." };

  await prisma.factoryNote.delete({ where: { id: noteId } });

  revalidatePath(`/dashboard/admin/factories/${factoryId}`);
  return { success: true };
}

/**
 * Direct form action variant — used in Server Components where useActionState
 * is not available. Accepts FormData directly without the state argument.
 */
export async function deleteFactoryNoteDirect(formData: FormData): Promise<void> {
  await requireAdmin();

  const noteId = formData.get("noteId") as string;
  const factoryId = formData.get("factoryId") as string;
  if (!noteId) return;

  await prisma.factoryNote.delete({ where: { id: noteId } });
  revalidatePath(`/dashboard/admin/factories/${factoryId}`);
}
