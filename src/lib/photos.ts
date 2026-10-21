/**
 * Client-side photo helpers. Thumbnails are generated as separate small files;
 * the original File object is never modified, resized or re-encoded.
 */

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];
export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per photo
export const MAX_FILES_PER_BATCH = 50;

export function validatePhotoFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const extOk = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const typeOk = ACCEPTED_TYPES.includes(file.type) || (file.type === "" && extOk);
  if (!typeOk || !extOk) return "Not a supported photo type (JPEG, PNG, WebP, HEIC)";
  if (file.size === 0) return "File is empty";
  if (file.size > MAX_FILE_BYTES) return "Larger than 50 MB";
  return null;
}

/**
 * Generate a small WebP/JPEG thumbnail. Returns null when the browser cannot
 * decode the format (e.g. HEIC on most Android browsers) — the original is
 * still uploaded untouched and a placeholder is shown in the grid.
 * Canvas re-encoding drops EXIF (incl. GPS) from the thumbnail only.
 */
export async function makeThumbnail(file: File, maxEdge = 640): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/webp", 0.8));
  } catch {
    return null;
  }
}

export async function imageSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const b = await createImageBitmap(file);
    const s = { width: b.width, height: b.height };
    b.close();
    return s;
  } catch {
    return null;
  }
}

/** Phase 1 only: originals picked in this session, kept in memory for exact-byte download. */
export const sessionOriginals = new Map<string, File>();

export async function downloadOriginal(photo: { id: string; src: string; originalFilename: string }) {
  const local = sessionOriginals.get(photo.id);
  const blob = local ?? (await (await fetch(photo.src)).blob());
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = photo.originalFilename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
