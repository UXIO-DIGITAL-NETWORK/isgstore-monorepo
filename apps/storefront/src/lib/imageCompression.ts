/**
 * Re-encodes an image to WebP before it is uploaded.
 *
 * The API converts every image it receives anyway (App\Services\ImageOptimizer)
 * — this is not the guarantee, it is the shortcut. Compressing here means a
 * 4000x3000 phone photo leaves the browser as a few hundred KB instead of
 * several MB, which is the difference between an upload that feels instant and
 * one that trips the server's upload_max_filesize.
 *
 * The skip rules mirror the server's exactly, so the two never disagree about
 * what an image should end up as. Anything this function declines to touch is
 * still handled server-side.
 *
 * Payment proofs deliberately do NOT go through here — they are evidence, and
 * are uploaded exactly as the customer submitted them.
 */

const MAX_DIMENSION = 1920;
const QUALITY = 0.82;

/** Formats a canvas can decode and we are willing to re-encode. */
const CONVERTIBLE = new Set(["image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp", "image/webp"]);

interface CompressOptions {
  /** Longest edge in pixels. Images below it are never scaled up. */
  maxDimension?: number;
  /** WebP encoder quality, 0-1. */
  quality?: number;
}

export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const maxDimension = options.maxDimension ?? MAX_DIMENSION;
  const quality = options.quality ?? QUALITY;

  // SVG, ICO, PDF, HEIC — anything a canvas cannot faithfully round-trip.
  if (!CONVERTIBLE.has(file.type)) return file;

  // A canvas keeps one frame; an animated GIF would lose its animation.
  if (file.type === "image/gif" && (await isAnimatedGif(file))) return file;

  let bitmap: ImageBitmap;

  try {
    // `from-image` bakes in the EXIF rotation, so a portrait phone photo does
    // not arrive sideways — WebP carries no orientation tag to fix it later.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));

    // Already WebP and small enough: re-encoding would only cost quality.
    if (file.type === "image/webp" && scale === 1) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", quality);
    });

    // A browser without WebP encoding silently hands back a PNG instead.
    if (!blob || blob.size === 0 || blob.type !== "image/webp") return file;

    // Nothing was resized and the result got bigger — keep the original. This
    // happens with small already-optimised PNGs.
    if (scale === 1 && blob.size >= file.size) return file;

    return new File([blob], toWebpName(file.name), { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}

function toWebpName(name: string): string {
  return `${name.replace(/\.[^./\\]+$/, "")}.webp`;
}

/**
 * More than one Graphic Control Extension block means more than one frame.
 */
async function isAnimatedGif(file: File): Promise<boolean> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let found = 0;

    for (let i = 0; i < bytes.length - 2; i += 1) {
      if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 0x04) {
        found += 1;
        if (found > 1) return true;
      }
    }

    return false;
  } catch {
    // Unreadable is not "static" — leave the file alone.
    return true;
  }
}
