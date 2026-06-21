export interface UseIntegrasiReturn {
  apiKey: string;
  isKeyVisible: boolean;
  toggleKeyVisibility: () => void;
  regenerateKey: () => void;
  callbackUrl: string;
  setCallbackUrl: (url: string) => void;
  submitCallback: () => void;
  whitelistIps: string[];
  ipDraft: string;
  setIpDraft: (ip: string) => void;
  addIp: () => void;
  removeIp: (ip: string) => void;
}
