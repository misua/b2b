import { z } from "zod";

// ─── Session ──────────────────────────────────────────────────────────────────

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: "CLIENT" | "ADMIN";
  expiresAt: Date;
};

// ─── Auth Form State ──────────────────────────────────────────────────────────

export type FormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }).trim(),
  password: z.string().min(1, { message: "Password is required." }),
});

// ─── RFQ ──────────────────────────────────────────────────────────────────────

export const RFQSchema = z.object({
  productName: z
    .string()
    .min(2, { message: "Product name must be at least 2 characters." })
    .trim(),
  specifications: z
    .string()
    .min(10, { message: "Please provide at least 10 characters of specifications." })
    .trim(),
  quantity: z
    .number({ error: "Quantity must be a number." })
    .int()
    .positive({ message: "Quantity must be a positive integer." }),
});

export type RFQFormState =
  | {
      errors?: {
        productName?: string[];
        specifications?: string[];
        quantity?: string[];
        images?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

// ─── Order Status ─────────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<string, string> = {
  REQUIREMENTS_SUBMITTED: "Submitted",
  QUOTATION_READY: "Quoted",
  AWAITING_PRODUCTION: "Paid",
  IN_PRODUCTION: "In Production",
  AT_CHINA_WAREHOUSE: "China Warehouse",
  INTERNATIONAL_TRANSIT: "In Transit",
  OUT_FOR_LOCAL_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
} as const;

export const ORDER_STATUS_SEQUENCE = [
  "REQUIREMENTS_SUBMITTED",
  "QUOTATION_READY",
  "AWAITING_PRODUCTION",
  "IN_PRODUCTION",
  "AT_CHINA_WAREHOUSE",
  "INTERNATIONAL_TRANSIT",
  "OUT_FOR_LOCAL_DELIVERY",
  "DELIVERED",
] as const;

export type OrderStatusKey = (typeof ORDER_STATUS_SEQUENCE)[number];
