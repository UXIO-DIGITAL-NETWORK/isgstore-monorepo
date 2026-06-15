export interface MagicWheelCalcState {
  magicPoints: number;
  diamonds: number;
}

export const MAGIC_WHEEL_CALC_CONSTANTS = {
  MAX_POINT: 200,
  DIAMOND_PER_POINT: 54,
  DEFAULT_POINT: 120,
  SLIDER_MIN: 0,
  SLIDER_MAX: 200,
} as const;
