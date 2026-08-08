/**
 * Triggers a browser download for a Blob. No-ops when the object-URL API is
 * unavailable (jsdom under test), so callers can invoke it unconditionally.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
