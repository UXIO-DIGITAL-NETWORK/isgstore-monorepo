export interface ZodiacCalcState {
  starPower: number;
  diamonds: number;
}

export const ZODIAC_CALC_CONSTANTS = {
  MAX_DIAMOND: 6500,
  MIN_DIAMOND: 0,
  ROUND_STEP: 50,
  DEFAULT_STAR_POWER: 74,
  SLIDER_MIN: 0,
  SLIDER_MAX: 100,
} as const;
