import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface GeneratedQr {
  payload: string;
  url: string;
}

/**
 * Renders an `otpauth://` URI into a scannable PNG data URL.
 *
 * Generated in the browser rather than served by the API on purpose: the TOTP
 * secret is inside that payload, and turning it into an image server-side would
 * put it through another log, another cache and another response body for no
 * gain.
 *
 * Mirrors `useQrDataUrl` in the storefront, which does the same for QRIS.
 */
export function useQrDataUrl(payload: string | null | undefined): string | null {
  // Stored with the payload it came from, so a stale image is never shown for a
  // newly generated secret — and no state has to be reset from inside an effect.
  const [generated, setGenerated] = useState<GeneratedQr | null>(null);

  useEffect(() => {
    if (!payload) return;

    let cancelled = false;

    QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 400, // 2x the 200px render box, so it stays crisp on retina
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setGenerated({ payload, url });
      })
      .catch(() => {
        // A failed render must not blank the page: the setup key is shown as
        // selectable text underneath and enrolment still works without the QR.
      });

    return () => {
      cancelled = true;
    };
  }, [payload]);

  return generated && generated.payload === payload ? generated.url : null;
}
