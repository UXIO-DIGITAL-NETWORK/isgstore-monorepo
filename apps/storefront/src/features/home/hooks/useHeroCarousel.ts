import { useState, useEffect, useRef, useCallback } from "react";
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

  const restartTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (total <= 0) return;
    intervalRef.current = setInterval(() => setCurrent((prev) => (prev + 1) % total), AUTO_DELAY);
  }, [total]);

  // Depends on restartTimer (i.e. total) only: without the dependency array the
  // interval was torn down and rebuilt on every render.
  useEffect(() => {
    restartTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [restartTimer]);

  const goTo = useCallback(
    (idx: number) => {
      setCurrent(idx);
      restartTimer();
    },
    [restartTimer],
  );

  return { current, containerWidth, trackRef, hasPeek, slideWidth, goTo };
}
