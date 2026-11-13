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
        return NextResponse.json({ error: "Không tìm thấy tệp tải lên." }, { status: 400 });
      }

      const isImage = (file.type && file.type.startsWith("image/")) || /\.(png|jpe?g|webp|svg|gif|bmp)$/i.test(file.name);
      if (!isImage) {
        return NextResponse.json({ error: "Chỉ chấp nhận tệp hình ảnh (PNG, WebP, JPG, JPEG, SVG)." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      fileName = file.name || fileName;
      mimeType = file.type || "image/png";
    } else if (contentType.includes("application/json")) {
      const json = await request.json();
      const { dataUrl, filename } = json;
      if (!dataUrl) {
        return NextResponse.json({ error: "Thiếu dữ liệu dataUrl." }, { status: 400 });
      }
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: "Định dạng dataUrl không hợp lệ." }, { status: 400 });
      }
      mimeType = match[1] || "image/png";
      buffer = Buffer.from(match[2], "base64");
      if (filename) fileName = filename;
    } else {
      return NextResponse.json({ error: "Định dạng yêu cầu không được hỗ trợ." }, { status: 400 });
    }

    // Sanitize filename
    const ext = path.extname(fileName) || ".png";
    const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
    const safeFilename = `upload_${Date.now()}_${baseName}${ext}`;

    // Save image to memory cache and storage safely
    await saveUploadedImage(safeFilename, buffer, mimeType);

    // Reliable dynamic serving URL (< 255 chars for Supabase)
    const publicUrl = `/api/healthclues/wellness-home/file?name=${safeFilename}`;
    const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      dataUrl,
      filename: safeFilename,
      size: buffer.length,
      mimeType,
    });
  } catch (err) {
    console.error("Admin furniture upload failed:", err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Lỗi khi xử lý tải lên tệp.",
    }, { status: 500 });
  }
}
