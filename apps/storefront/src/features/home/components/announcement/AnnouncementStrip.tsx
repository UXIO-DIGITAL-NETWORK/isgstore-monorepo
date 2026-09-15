import React from "react";
import { useTranslation } from "react-i18next";
import { Megaphone } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { useAnnouncements } from "@/features/home/hooks/useAnnouncements";

/**
 * The admin panel's announcements, as a strip under the navbar.
 *
 * Every active notice is listed rather than only the newest: an announcement
 * is operational copy (a maintenance window, a schedule change), and hiding one
 * behind another is how a customer misses the one that concerns them.
 *
 * Nothing is rendered when there is nothing published, and no copy is bundled
 * as a fallback — an announcement is a statement of fact, so inventing one
 * would be worse than showing nothing.
 */
export default function AnnouncementStrip(): React.JSX.Element {
  const { t } = useTranslation("home");
  const announcements = useAnnouncements();

  if (announcements.length === 0) return <></>;

  return (
    <Box className="w-full pt-4">
      <Box className="max-w-6xl mx-auto px-4 md:px-8">
        <Box
          as="section"
          aria-label={t("announcement.title")}
          className="flex flex-col gap-3 rounded-2xl border border-[rgba(147,51,234,0.35)] bg-[rgba(147,51,234,0.08)] px-4 py-3.5"
        >
          <Box className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 shrink-0 text-violet-lavender" />
            <Text as="span" className="font-outfit text-[13px] font-semibold text-white">
              {t("announcement.title")}
            </Text>
          </Box>

          <Box className="flex flex-col divide-y divide-white/5">
            {announcements.map((announcement) => (
              <Box key={announcement.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                {announcement.image_url && (
                  <img
                    src={announcement.image_url}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                )}
                <Text
                  as="p"
                  className="font-inter text-[13px] leading-relaxed text-white/70 whitespace-pre-line"
                >
                  {announcement.content}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
