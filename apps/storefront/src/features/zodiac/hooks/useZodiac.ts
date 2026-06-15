import { useMemo, useState } from "react";
import { ZODIAC_CALC_CONSTANTS } from "@/features/zodiac/types/zodiac.type";

const { MAX_DIAMOND, MIN_DIAMOND, ROUND_STEP, DEFAULT_STAR_POWER } =
  ZODIAC_CALC_CONSTANTS;

export function useZodiac() {
  const [starPower, setStarPower] = useState<number>(DEFAULT_STAR_POWER);

  const diamonds = useMemo(() => {
    const raw =
      MAX_DIAMOND - (MAX_DIAMOND - MIN_DIAMOND) * (starPower / 100);
    return Math.round(raw / ROUND_STEP) * ROUND_STEP;
  }, [starPower]);

  return { starPower, setStarPower, diamonds };
}
