import type { UseQueryResult } from "@tanstack/react-query";
import type { ApiCredentialListResponse } from "@/features/member-dashboard/services/integrasi.service";
import type { ApiResponse } from "@/types/api.type";

export interface UseIntegrasiReturn {
  apiKey: string;
  isKeyVisible: boolean;
  toggleKeyVisibility: () => void;
  regenerateKey: () => void;
  isRegenerating: boolean;
  callbackUrl: string;
  setCallbackUrl: (url: string) => void;
  submitCallback: () => void;
  isSavingCallback: boolean;
  whitelistIps: string[];
  ipDraft: string;
  setIpDraft: (ip: string) => void;
  addIp: () => void;
  removeIp: (ip: string) => void;
  isMutatingWhitelist: boolean;
  /** The raw credentials query, for the page's loading / error / empty states. */
  query: UseQueryResult<ApiResponse<ApiCredentialListResponse>>;
}
