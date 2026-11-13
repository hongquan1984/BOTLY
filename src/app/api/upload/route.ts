import { NextResponse } from "next/server";
import path from "node:path";
import { saveUploadedImage } from "@/lib/wellness-home-image-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let buffer: Buffer;
    let fileName: string = `upload_${Date.now()}.png`;
    let mimeType: string = "image/png";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      fileName = file.name || fileName;
      mimeType = file.type || "image/png";
    } else if (contentType.includes("application/json")) {
      const json = await request.json();
      const { dataUrl, filename } = json;
      if (!dataUrl) {
        return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 });
      }
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: "Invalid dataUrl format" }, { status: 400 });
      }
      mimeType = match[1] || "image/png";
      buffer = Buffer.from(match[2], "base64");
      if (filename) fileName = filename;
    } else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
    }

    const ext = path.extname(fileName) || ".png";
    const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
    const safeFilename = `upload_${Date.now()}_${baseName}${ext}`;

    await saveUploadedImage(safeFilename, buffer, mimeType);

    const publicUrl = `/api/healthclues/wellness-home/file?name=${safeFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: safeFilename,
      width: 280,
    });
  } catch (err) {
    console.error("Upload API route error:", err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Upload processing error",
    }, { status: 500 });
  }
}
