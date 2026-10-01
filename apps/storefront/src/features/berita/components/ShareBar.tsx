import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Facebook, Twitter, Linkedin, Copy, Check } from "lucide-react";
import whatsappLogo from "@/assets/icons/whatsapp_logo.svg";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
};

export default function ShareBar({ title }: Props): React.JSX.Element {
  const { t } = useTranslation("berita");
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  function openShare(shareUrl: string) {
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const btnBase =
    "w-10 h-10 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer";

  return (
    <Box className="flex items-center gap-3 flex-wrap">
      <Text as="span" className="font-inter font-semibold text-[14px] text-white/70 shrink-0">
        {t("detail.share")}
      </Text>

      {/* Facebook */}
      <Box
        as="button"
        type="button"
        aria-label={t("shareLabels.facebook")}
        onClick={() =>
          openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)
        }
        className={btnBase}
      >
        <Facebook className="w-4.5 h-4.5 text-white" />
      </Box>

      {/* X (Twitter) */}
      <Box
        as="button"
        type="button"
        aria-label={t("shareLabels.twitter")}
        onClick={() =>
          openShare(
            `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
          )
        }
        className={btnBase}
      >
        <Twitter className="w-4.5 h-4.5 text-white" />
      </Box>

      {/* LinkedIn */}
      <Box
        as="button"
        type="button"
        aria-label={t("shareLabels.linkedin")}
        onClick={() =>
          openShare(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
          )
        }
        className={btnBase}
      >
        <Linkedin className="w-4.5 h-4.5 text-white" />
      </Box>

      {/* WhatsApp — no lucide icon, use svg asset (same pattern as Footer) */}
      <Box
        as="button"
        type="button"
        aria-label={t("shareLabels.whatsapp")}
        onClick={() =>
          openShare(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`)
        }
        className={btnBase}
      >
        <img src={whatsappLogo} alt="WhatsApp" className="w-4.5 h-4.5" />
      </Box>

      {/* Copy link */}
      <Box
        as="button"
        type="button"
        aria-label={copied ? t("shareLabels.copied") : t("shareLabels.copy")}
        onClick={handleCopy}
        className={cn(
          btnBase,
          copied && "bg-[rgb(208,201,129)]/20 border-[rgb(208,201,129)]/40",
        )}
      >
        {copied ? (
          <Check className="w-4.5 h-4.5 text-[rgb(208,201,129)]" />
        ) : (
          <Copy className="w-4.5 h-4.5 text-white" />
        )}
      </Box>

      {/* Copied feedback label */}
      {copied && (
        <Text as="span" className="font-inter text-[12px] text-[rgb(208,201,129)] select-none">
          {t("shareLabels.copied")}
        </Text>
      )}
    </Box>
  );
}
