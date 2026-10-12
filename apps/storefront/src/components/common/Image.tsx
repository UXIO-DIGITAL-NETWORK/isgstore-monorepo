import React, { useState } from "react";
import { cn } from "@/lib/utils";

// ============================================
// IMAGE COMPONENT WITH OPTIMIZATION
// ============================================

type ImageFit = "cover" | "contain" | "fill" | "none" | "scale-down";
type ImagePriority = "eager" | "lazy";

interface ImageOwnProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  objectFit?: ImageFit;
  priority?: ImagePriority;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  /**
   * Reserves space before the image loads, which is what stops a late swap
   * from shifting the layout. Accepts any CSS `aspect-ratio` value.
   */
  aspectRatio?: string | number;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  fallback?: string;
}

type ImageProps = ImageOwnProps & Omit<React.ComponentPropsWithRef<"img">, keyof ImageOwnProps>;

const OBJECT_FIT_CLASS: Record<ImageFit, string> = {
  cover: "object-cover",
  contain: "object-contain",
  fill: "object-fill",
  none: "object-none",
  "scale-down": "object-scale-down",
};

const DEFAULT_FALLBACK =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="18"%3EImage%3C/text%3E%3C/svg%3E';

const ImageContent = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      className,
      objectFit,
      priority = "lazy",
      placeholder = "empty",
      blurDataURL,
      aspectRatio,
      onLoad,
      onError,
      sizes,
      fallback = DEFAULT_FALLBACK,
      ...restProps
    },
    ref,
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    const isEager = priority === "eager";

    // The `<img src>` is set immediately — the browser loads and paints it
    // without waiting on JS. Below-the-fold images fade in; the LCP image
    // (eager) paints the moment its bytes arrive.
    const shouldFade = !isEager && !isLoaded;

    return (
      <div
        className={cn("relative overflow-hidden", className)}
        style={{
          width: width ? `${width}px` : undefined,
          height: height ? `${height}px` : undefined,
          aspectRatio: aspectRatio ?? undefined,
        }}
      >
        {placeholder === "blur" && blurDataURL && !isLoaded && (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
            style={{ backgroundImage: `url(${blurDataURL})` }}
          />
        )}

        {placeholder === "empty" && !isLoaded && !isError && (
          <div
            aria-hidden
            className="absolute inset-0 bg-gray-200 animate-pulse"
          />
        )}

        <img
          ref={ref}
          src={isError ? fallback : src}
          alt={alt}
          width={width}
          height={height}
          loading={isEager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={isEager ? "high" : undefined}
          sizes={sizes}
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            setIsError(true);
            setIsLoaded(true);
            onError?.();
          }}
          className={cn(
            // Deliberately no z-index: the skeleton above is rendered *before*
            // this img, so painting order already keeps the image on top of it.
            // A `z-10` here would float every image above sibling content that
            // comes later in the DOM — the CTA copy, card scrims, hero arrows.
            "relative w-full h-full transition-opacity duration-300",
            objectFit && OBJECT_FIT_CLASS[objectFit],
            shouldFade ? "opacity-0" : "opacity-100",
          )}
          {...restProps}
        />
      </div>
    );
  },
);

ImageContent.displayName = "ImageContent";

/**
 * Keyed on `src` so a source change remounts the inner component and its
 * load/error state resets naturally, without a state-syncing effect.
 */
const Image = React.forwardRef<HTMLImageElement, ImageProps>((props, ref) => (
  <ImageContent
    key={props.src}
    {...props}
    ref={ref}
  />
));

Image.displayName = "Image";

export { Image };
export type { ImageProps, ImageFit, ImagePriority };
