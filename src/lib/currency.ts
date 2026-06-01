/**
 * Shared currency formatting for the B2B Sourcing Portal.
 * All monetary values are in Philippine Pesos (PHP / ₱).
 *
 * Usage:
 *   import { fmt, CURRENCY_SYMBOL } from "@/lib/currency";
 *   fmt(1234.5)  → "₱1,234.50"
 */

export const CURRENCY_SYMBOL = "₱";
export const CURRENCY_CODE = "PHP";

/**
 * Format a number as Philippine Pesos.
 * e.g. fmt(1234.5) → "₱1,234.50"
 */
export function fmt(n: number): string {
  return `₱${n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format for PDF documents — uses PHP prefix since ₱ is not
 * supported in jsPDF's default Helvetica font.
 * e.g. fmtPdf(1234.5) → "PHP 1,234.50"
 */
export function fmtPdf(n: number): string {
  return `PHP ${n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
