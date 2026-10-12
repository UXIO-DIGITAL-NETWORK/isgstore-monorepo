/// <reference types="vite/client" />

// vite-imagetools v10 ships no client type entry, so imports carrying its
// directives are declared here. Every directive query is written to end with
// `format=webp`, which is what these two patterns match.
declare module "*?format=webp" {
  const src: string;
  export default src;
}

declare module "*&format=webp" {
  const src: string;
  export default src;
}

// `?…&as=srcset` returns a ready-to-use srcset string.
declare module "*&as=srcset" {
  const srcSet: string;
  export default srcSet;
}
