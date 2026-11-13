import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export interface StoredImage {
  buffer: Buffer;
  mimeType: string;
  updatedAt: number;
}

// Global persistent cache across requests in the Node process
declare global {
  // eslint-disable-next-line no-var
  var __HEALTHCLUES_IMAGE_STORE__: Map<string, StoredImage> | undefined;
}

export function getImageStore(): Map<string, StoredImage> {
  if (!globalThis.__HEALTHCLUES_IMAGE_STORE__) {
    globalThis.__HEALTHCLUES_IMAGE_STORE__ = new Map<string, StoredImage>();
  }
  return globalThis.__HEALTHCLUES_IMAGE_STORE__;
}

const MEMORY_LIMIT = 60; // Keep up to 60 uploaded images in memory

export async function saveUploadedImage(
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  const store = getImageStore();

  if (store.size >= MEMORY_LIMIT) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }

  // 1. Store in memory for instant zero-disk serving
  store.set(filename, {
    buffer,
    mimeType,
    updatedAt: Date.now(),
  });

  // 2. Safe disk persistence (never crash if running on read-only environments like Vercel)
  try {
    const tmpDir = path.resolve(process.platform === "win32" ? process.cwd() : "/tmp", "healthclues_uploads");
    await mkdir(tmpDir, { recursive: true });
    await writeFile(path.join(tmpDir, filename), buffer);
  } catch {
    // Continue
  }

  try {
    const pubDir = path.resolve(process.cwd(), "public", "healthclues", "assets", "home", "items");
    await mkdir(pubDir, { recursive: true });
    await writeFile(path.join(pubDir, filename), buffer);
  } catch {
    // Read-only filesystem is expected on Vercel
  }
}

export async function getUploadedImage(
  filename: string
): Promise<StoredImage | null> {
  const store = getImageStore();

  // 1. Check in-memory store first
  const cached = store.get(filename);
  if (cached) return cached;

  // 2. Try loading from static subfolder
  const safeBase = path.basename(filename);
  const targetFile = path.resolve(process.cwd(), "public", "healthclues", "assets", "home", "items", safeBase);

  try {
    if (existsSync(targetFile)) {
      const buffer = await readFile(targetFile);
      const ext = path.extname(safeBase).toLowerCase();
      let mimeType = "image/png";
      if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
      else if (ext === ".webp") mimeType = "image/webp";
      else if (ext === ".svg") mimeType = "image/svg+xml";

      const stored: StoredImage = { buffer, mimeType, updatedAt: Date.now() };
      store.set(safeBase, stored);
      return stored;
    }
  } catch {
    // Ignore error
  }

  return null;
}
