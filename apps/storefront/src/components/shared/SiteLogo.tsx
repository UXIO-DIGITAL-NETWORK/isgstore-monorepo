import React from "react";
import { Gamepad2 } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

interface SiteLogoProps {
  /** Height of the mark, in Tailwind sizing classes (mark and image share it). */
  className?: string;
  /** Wordmark size; the bundled brand splits colour at "ISG|STORE". */
  textClassName?: string;
  showText?: boolean;
}

/**
 * The brand mark, driven by the `logo` / `site_name` settings.
 *
 * The bundled gamepad mark and the two-tone "ISGSTORE" wordmark stay as the
 * fallback rather than being deleted: a site whose admin has not uploaded a
 * logo yet must still render a brand, and an empty header is a worse default
 * than a generic one. Once a logo is uploaded it replaces both — an uploaded
 * logo is normally a full lockup, so repeating the site name beside it would
 * print the brand twice.
 */
export function SiteLogo({
  className = "w-9 h-9",
  textClassName = "text-[22px]",
  showText = true,
}: SiteLogoProps): React.JSX.Element {
  const { text } = useSiteSettings();
  const logo = text("logo");
  const siteName = text("site_name");

  if (logo) {
    return (
      <img
        src={logo}
        alt={siteName ?? "Logo"}
        className={cn("w-auto object-contain", className)}
      />
    );
  }

  return (
    <>
      <Box
        className={cn(
          "rounded-full bg-linear-to-br from-[rgb(67,86,32)] to-[rgb(39,53,15)] flex items-center justify-center shrink-0",
          className,
        )}
      >
        <Gamepad2 className="w-1/2 h-1/2 text-white" />
      </Box>

      {showText && (
        <Text
          as="span"
          className={cn(
            "font-black text-white uppercase tracking-tight leading-none font-outfit",
            textClassName,
          )}
        >
          {siteName ? (
            siteName
          ) : (
            <>
              ISG
              <Text
                as="span"
                className={cn("text-[rgb(208,201,129)] font-outfit font-black", textClassName)}
              >
                STORE
              </Text>
            </>
          )}
        </Text>
      )}
    </>
  );
}
