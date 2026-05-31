import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

/**
 * Serves uploaded files from the Railway volume (UPLOAD_DIR=/data/uploads).
 * In local dev, UPLOAD_DIR is unset so files are served from public/uploads/
 * by Next.js directly — this route is not needed locally.
 *
 * Route: /uploads/[...path]
 * Example: /uploads/1234567890-abc123-product.jpg
 */

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await ctx.params;
  const filename = Array.isArray(segments) ? segments.join("/") : segments;

  // Prevent path traversal attacks
  const safe = path.normalize(filename).replace(/^(\.\.(\/|\\|$))+/, "");

  const uploadDir =
    process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadDir, safe);

  // Resolve canonical paths and verify the file is inside uploadDir
  const resolvedUploadDir = path.resolve(uploadDir);
  const resolvedFilePath = path.resolve(filePath);
  if (!resolvedFilePath.startsWith(resolvedUploadDir)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!existsSync(resolvedFilePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buffer = await readFile(resolvedFilePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        // Cache uploaded files for 7 days — they're immutable (unique filenames)
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
