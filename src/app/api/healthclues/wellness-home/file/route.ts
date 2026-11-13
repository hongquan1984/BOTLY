import { NextResponse } from "next/server";
import path from "node:path";
import { getUploadedImage } from "@/lib/wellness-home-image-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1x1 transparent PNG fallback if file is missing
const TRANSPARENT_PNG_FALLBACK = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  )
);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawName = url.searchParams.get("name") || "";

    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(rawName).replace(/[^a-zA-Z0-9_.-]/g, "");

    if (!safeName) {
      return new NextResponse(TRANSPARENT_PNG_FALLBACK, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const image = await getUploadedImage(safeName);

    if (image) {
      return new NextResponse(new Uint8Array(image.buffer), {
        status: 200,
        headers: {
          "Content-Type": image.mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Fallback if not found
    return new NextResponse(TRANSPARENT_PNG_FALLBACK, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Error serving uploaded furniture image:", err);
    return new NextResponse(TRANSPARENT_PNG_FALLBACK, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  }
}
