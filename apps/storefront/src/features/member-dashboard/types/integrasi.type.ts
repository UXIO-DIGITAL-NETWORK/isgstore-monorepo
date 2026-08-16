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
}
