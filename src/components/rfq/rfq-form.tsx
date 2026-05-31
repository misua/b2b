"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { submitRFQ } from "@/actions/rfq";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { RFQFormState } from "@/lib/definitions";

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

export function RFQForm() {
  const [state, formAction, isPending] = useActionState<RFQFormState, FormData>(
    submitRFQ,
    undefined
  );

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadError, setUploadError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // Client-side size limit check
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        setUploadError(`"${f.name}" exceeds the 5 MB limit.`);
        return;
      }
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as { urls?: string[]; error?: string };

      if (!res.ok || json.error) {
        setUploadError(json.error ?? "Upload failed.");
        return;
      }

      const newUploads: UploadedFile[] = (json.urls ?? []).map((url, i) => ({
        name: files[i]?.name ?? url,
        url,
        type: files[i]?.type ?? "",
      }));

      setUploadedFiles((prev) => [...prev, ...newUploads]);
    } catch {
      setUploadError("Network error during upload.");
    } finally {
      setIsUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeFile(url: string) {
    setUploadedFiles((prev) => prev.filter((f) => f.url !== url));
  }

  const imageUrls = uploadedFiles.map((f) => f.url);

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden field carries uploaded URLs to server action */}
      <input type="hidden" name="imageUrls" value={JSON.stringify(imageUrls)} />

      {/* Global error */}
      {state?.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="productName">Product Name *</Label>
        <Input
          id="productName"
          name="productName"
          placeholder="e.g. Custom Printed Tote Bags"
          required
        />
        {state?.errors?.productName && (
          <p className="text-sm text-destructive">{state.errors.productName[0]}</p>
        )}
      </div>

      {/* Specifications */}
      <div className="space-y-2">
        <Label htmlFor="specifications">Specifications *</Label>
        <textarea
          id="specifications"
          name="specifications"
          rows={5}
          placeholder="Describe your product in detail: material, dimensions, colors, printing method, packaging requirements, etc."
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          required
        />
        {state?.errors?.specifications && (
          <p className="text-sm text-destructive">{state.errors.specifications[0]}</p>
        )}
      </div>

      {/* Target Quantity */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Target Quantity *</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min="1"
          placeholder="e.g. 500"
          required
        />
        {state?.errors?.quantity && (
          <p className="text-sm text-destructive">{state.errors.quantity[0]}</p>
        )}
        <p className="text-xs text-muted-foreground">Minimum order quantities vary by product.</p>
      </div>

      {/* File Upload */}
      <div className="space-y-3">
        <Label>Reference Images / Files</Label>
        <p className="text-xs text-muted-foreground">
          Upload product photos, design files, or spec sheets. JPG, PNG, WebP, PDF · Max 5 MB each.
        </p>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload files"
        >
          <div className="text-3xl mb-2">📎</div>
          <p className="text-sm font-medium">
            {isUploading ? "Uploading…" : "Click to select files"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

        {uploadError && (
          <p className="text-sm text-destructive">{uploadError}</p>
        )}

        {/* File preview list */}
        {uploadedFiles.length > 0 && (
          <ul className="space-y-2">
            {uploadedFiles.map((file) => (
              <li
                key={file.url}
                className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2"
              >
                {file.type.startsWith("image/") ? (
                  <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden border bg-white">
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded border bg-white text-lg">
                    📄
                  </div>
                )}
                <span className="text-sm flex-1 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(file.url)}
                  className="text-muted-foreground hover:text-destructive text-xs shrink-0"
                  aria-label={`Remove ${file.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {state?.errors?.images && (
          <p className="text-sm text-destructive">{state.errors.images[0]}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending || isUploading}
          className="flex-1 sm:flex-none"
        >
          {isPending ? "Submitting…" : "Submit RFQ"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
