import { useState } from "react";
import {
  MOCK_API_KEY,
  INITIAL_WHITELIST_IPS,
  generateMockApiKey,
} from "@/features/member-dashboard/data/integrasi.mock";
import type { UseIntegrasiReturn } from "@/features/member-dashboard/types/integrasi.type";

export function useIntegrasi(): UseIntegrasiReturn {
  const [apiKey, setApiKey] = useState<string>(MOCK_API_KEY);
  const [isKeyVisible, setIsKeyVisible] = useState<boolean>(false);
  const [callbackUrl, setCallbackUrl] = useState<string>("");
  const [whitelistIps, setWhitelistIps] = useState<string[]>(INITIAL_WHITELIST_IPS);
  const [ipDraft, setIpDraft] = useState<string>("");

  const toggleKeyVisibility = () => setIsKeyVisible((v) => !v);

  const regenerateKey = () => setApiKey(generateMockApiKey());

  const submitCallback = () => {
    // TODO: wire to backend when API integration is ready
    window.alert(`URL Callback "${callbackUrl}" berhasil disimpan!`);
  };

  const addIp = () => {
    const trimmed = ipDraft.trim();
    if (!trimmed || whitelistIps.includes(trimmed)) return;
    setWhitelistIps((prev) => [...prev, trimmed]);
    setIpDraft("");
  };

  const removeIp = (ip: string) => {
    setWhitelistIps((prev) => prev.filter((existing) => existing !== ip));
  };

  return {
    apiKey,
    isKeyVisible,
    toggleKeyVisibility,
    regenerateKey,
    callbackUrl,
    setCallbackUrl,
    submitCallback,
    whitelistIps,
    ipDraft,
    setIpDraft,
    addIp,
    removeIp,
  };
}
