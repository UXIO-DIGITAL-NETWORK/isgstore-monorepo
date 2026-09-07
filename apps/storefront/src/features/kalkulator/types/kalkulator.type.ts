export interface WinRateFormData {
  totalMatch: number;
  currentWR: number;
  targetWR: number;
}

export type WinRateResultStatus = "normal" | "reached" | "impossible";

export interface WinRateResult {
  status: WinRateResultStatus;
  winsNeeded: number;
  targetWR: number;
}
