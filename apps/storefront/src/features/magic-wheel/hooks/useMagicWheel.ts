import { useMemo, useState } from "react";
import { MAGIC_WHEEL_CALC_CONSTANTS } from "@/features/magic-wheel/types/magicWheel.type";

const { MAX_POINT, DIAMOND_PER_POINT, DEFAULT_POINT } = MAGIC_WHEEL_CALC_CONSTANTS;

export function useMagicWheel() {
  const [magicPoints, setMagicPoints] = useState<number>(DEFAULT_POINT);

  const diamonds = useMemo(() => {
    return DIAMOND_PER_POINT * (MAX_POINT - magicPoints);
  }, [magicPoints]);

  return { magicPoints, setMagicPoints, diamonds };
}
