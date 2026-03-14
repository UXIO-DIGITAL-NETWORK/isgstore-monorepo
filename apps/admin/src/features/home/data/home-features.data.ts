import { PlayCircle, Newspaper, Globe } from "lucide-react";
import type { HomeFeature } from "../types/home-feature.type";

export const HOME_FEATURES: HomeFeature[] = [
  {
    id: "video-tutorials",
    title: "Video Tutorials",
    description:
      "Watch thousands of video tutorials on React, TypeScript, and modern web development. Check them out, see for yourself, and massively level up your development skills in the process.",
    icon: PlayCircle,
    hasHoverArrow: true,
  },
  {
    id: "latest-news",
    title: "Latest News",
    description:
      "A community driven portal and newsletter aggregating all of the latest and most important news in the React ecosystem, including new package releases and tutorials.",
    icon: Newspaper,
    hasHoverArrow: true,
  },
  {
    id: "vibrant-ecosystem",
    title: "Vibrant Ecosystem",
    description:
      "A robust library of first-party tools and libraries help you take your projects to the next level. Pair them with powerful open source libraries like React Router, TanStack Query, Zustand, TailwindCSS, and more.",
    icon: Globe,
    hasHoverArrow: false,
  },
];
