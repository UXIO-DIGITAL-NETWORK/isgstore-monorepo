import React from "react";
import { Star } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import type { TestimonialModel } from "@/services/storefront.service";

/**
 * One quote from the testimonial table.
 *
 * The rating is optional in the data — an operator may quote a customer without
 * one — so the stars are simply absent rather than rendered as zero, which
 * would read as a bad review.
 */
export default function TestimonialCard({ testimonial }: { testimonial: TestimonialModel }): React.JSX.Element {
  const { author, title, avatar_url, content, rating, game, is_featured } = testimonial;

  return (
    <Box
      as="figure"
      className={[
        "flex h-full flex-col gap-4 rounded-2xl border p-5",
        is_featured
          ? "border-[rgba(147,51,234,0.5)] bg-[rgba(147,51,234,0.08)]"
          : "border-white/10 bg-white/[0.03]",
      ].join(" ")}
    >
      {rating !== null && rating > 0 && (
        <Box
          className="flex items-center gap-0.5"
          aria-label={`${rating}/5`}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={
                star <= rating
                  ? "h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                  : "h-3.5 w-3.5 text-white/20"
              }
            />
          ))}
        </Box>
      )}

      <Box as="blockquote" className="font-inter text-[13px] leading-relaxed text-white/65">
        {content}
      </Box>

      <Box className="mt-auto flex items-center gap-3">
        {avatar_url ? (
          <img
            src={avatar_url}
            alt=""
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <Box className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
            <Text as="span" className="font-outfit text-[15px] font-bold text-white/70">
              {author.charAt(0).toUpperCase()}
            </Text>
          </Box>
        )}

        <Box className="flex min-w-0 flex-col">
          <Text as="span" className="truncate font-outfit text-[13px] font-semibold text-white">
            {author}
          </Text>
          {title && (
            <Text as="span" className="truncate font-inter text-[11px] text-white/40">
              {title}
            </Text>
          )}
        </Box>

        {game && (
          <Text
            as="span"
            className="ml-auto shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 font-inter text-[10px] text-white/50"
          >
            {game}
          </Text>
        )}
      </Box>
    </Box>
  );
}
