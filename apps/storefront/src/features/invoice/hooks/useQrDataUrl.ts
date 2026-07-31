import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface GeneratedQr {
  payload: string;
  url: string;
}

/**
 * Renders a QRIS payload string into a scannable PNG data URL.
 *
 * The API returns `qr_string` — the raw EMV payload — not an image, because the
 * gateway issues the payload and the image is purely presentational. Generating
 * it client-side means the code the customer scans is always the one that
 * belongs to this invoice.
 */
export function useQrDataUrl(payload: string | null | undefined): string | null {
  // The generated URL is stored together with the payload it came from, so a
  // stale code is never shown for a new payload — and no state has to be reset
  // from inside an effect.
  const [generated, setGenerated] = useState<GeneratedQr | null>(null);

  useEffect(() => {
    if (!payload) return;

    let cancelled = false;

    QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 380,   // 2x the 190px render box, so it stays crisp on retina
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setGenerated({ payload, url });
      })
      .catch(() => {
        // A malformed payload must not blank the whole invoice page; the card
        // simply omits the QR block and the other instructions still render.
      });

    return () => {
      cancelled = true;
    };
  }, [payload]);

  return generated && generated.payload === payload ? generated.url : null;
}
