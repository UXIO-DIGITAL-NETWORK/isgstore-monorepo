export type HeroBannerItem = {
  src: string;
  /** Optional responsive source set (bundled banners only; API banners omit it). */
  srcSet?: string;
  alt: string;
  /**
   * Where the banner points, as the operator typed it in the admin panel.
   * Null when the banner is pure artwork — the slide then stays a plain image
   * rather than an anchor with nowhere to go.
   */
  link?: string | null;
};
