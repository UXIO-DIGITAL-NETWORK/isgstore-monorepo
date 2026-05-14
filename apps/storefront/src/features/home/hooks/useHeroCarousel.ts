import { useState, useEffect, useRef } from "react";
import { AUTO_DELAY, SIDE_VISIBLE } from "@/features/home/constants/heroBanner";

type IntervalRef = ReturnType<typeof setInterval>;

interface UseHeroCarouselReturn {
  current: number;
  containerWidth: number;
  trackRef: React.RefObject<HTMLDivElement | null>;
  hasPeek: boolean;
  slideWidth: number;
  goTo: (idx: number) => void;
}

export function useHeroCarousel(total: number): UseHeroCarouselReturn {
  const [current, setCurrent] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const intervalRef = useRef<IntervalRef | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const hasPeek = total >= 3;
  const slideWidth = containerWidth > 0 ? containerWidth - 2 * SIDE_VISIBLE : 0;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0);
    });

    observer.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  const restartTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setCurrent((prev) => (prev + 1) % total), AUTO_DELAY);
  };

  useEffect(() => {
    restartTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  });

  const goTo = (idx: number) => {
    setCurrent(idx);
    restartTimer();
  };

  return { current, containerWidth, trackRef, hasPeek, slideWidth, goTo };
}
