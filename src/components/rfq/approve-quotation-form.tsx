"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { approveQuotation } from "@/actions/quotation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ApproveFormState } from "@/actions/quotation";

interface ApproveQuotationFormProps {
  quotationId: string;
}

export function ApproveQuotationForm({ quotationId }: ApproveQuotationFormProps) {
  const [state, formAction, isPending] = useActionState<ApproveFormState, FormData>(
    approveQuotation,
    undefined
  );

  const [proofUrl, setProofUrl] = useState<string>("");
  const [proofName, setProofName] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File exceeds the 5 MB limit.");
      return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const fd = new FormData();
      fd.append("files", file);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { urls?: string[]; error?: string };

      if (!res.ok || json.error) {
        setUploadError(json.error ?? "Upload failed.");
        return;
      }

      setProofUrl(json.urls?.[0] ?? "");
      setProofName(file.name);
    } catch {
      setUploadError("Network error during upload.");
    } finally {
      setIsUploading(false);
    }
  }

  if (state?.success) {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center space-y-2">
        <div className="text-3xl">✅</div>
        <p className="font-semibold text-green-800">Payment Submitted!</p>
        <p className="text-sm text-green-700">
          Your payment proof has been received. Our team will verify it and begin
          production shortly.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="quotationId" value={quotationId} />
      <input type="hidden" name="paymentProofUrl" value={proofUrl} />

      {state?.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {/* Upload zone */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Upload Payment Receipt / Bank Slip</p>
        <div
          className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-5 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload payment proof"
        >
          {proofUrl ? (
            <div className="space-y-2">
              {proofUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                <div className="relative h-32 w-full rounded overflow-hidden">
                  <Image src={proofUrl} alt="Payment proof" fill className="object-contain" sizes="300px" />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-2xl">📄</span>
                  <span className="truncate max-w-xs">{proofName}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Click to replace</p>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-2">🧾</div>
              <p className="text-sm font-medium">
                {isUploading ? "Uploading…" : "Click to upload receipt"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, PDF · Max 5 MB
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

        {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        {state?.errors?.paymentProofUrl && (
          <p className="text-sm text-destructive">{state.errors.paymentProofUrl[0]}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || isUploading || !proofUrl}
      >
        {isPending ? "Submitting…" : "Confirm & Submit Payment Proof"}
      </Button>
    </form>
  );
}
