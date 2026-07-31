import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { integrasiService } from "@/features/member-dashboard/services/integrasi.service";
import type { UseIntegrasiReturn } from "@/features/member-dashboard/types/integrasi.type";

const QUERY_KEY = ["api-credentials"];

/**
 * The API stores only a hash of each key, so a key can be displayed exactly
 * once — at creation or regeneration. There is no endpoint that can return it
 * again, and `apiKey` therefore holds the masked form except in the moment
 * right after it was issued.
 *
 * That is a deliberate trade: a key the server can re-display is a key the
 * server is storing in plaintext. `isKeyVisible` now reveals the freshly
 * issued secret rather than un-masking a stored one.
 */
export function useIntegrasi(): UseIntegrasiReturn {
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: QUERY_KEY, queryFn: integrasiService.list });

  const credential = data?.data.credentials[0];
  const [issuedSecret, setIssuedSecret] = useState<string | null>(null);
  const [isKeyVisible, setIsKeyVisible] = useState<boolean>(false);
  // `null` means "not edited yet", so the saved value shows through until the
  // member types. Deriving it beats seeding state from an effect, which would
  // add a render and fight the query cache on every refetch.
  const [callbackDraft, setCallbackDraft] = useState<string | null>(null);
  const [ipDraft, setIpDraft] = useState<string>("");

  const callbackUrl = callbackDraft ?? credential?.callback_url ?? "";

  const whitelistIps = data?.data.whitelist_ips ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createCredential = useMutation({
    mutationFn: () => integrasiService.create(),
    onSuccess: (response) => {
      setIssuedSecret(response.data.secret);
      setIsKeyVisible(true);
      invalidate();
    },
  });

  const regenerate = useMutation({
    mutationFn: (id: number) => integrasiService.regenerate(id),
    onSuccess: (response) => {
      setIssuedSecret(response.data.secret);
      setIsKeyVisible(true);
      invalidate();
    },
  });

  const updateCredential = useMutation({
    mutationFn: (input: { callback_url?: string | null; whitelist_ips?: string[] }) =>
      integrasiService.update(credential!.id, input),
    onSuccess: invalidate,
  });

  return {
    // The freshly issued secret while it is still in memory, otherwise the
    // masked form the API is willing to return.
    apiKey: issuedSecret ?? credential?.masked_key ?? "",
    isKeyVisible,
    toggleKeyVisibility: () => setIsKeyVisible((visible) => !visible),
    regenerateKey: () => {
      if (credential) regenerate.mutate(credential.id);
      else createCredential.mutate();
    },
    callbackUrl,
    setCallbackUrl: setCallbackDraft,
    submitCallback: () => {
      if (!credential) return;
      updateCredential.mutate({ callback_url: callbackUrl || null });
    },
    whitelistIps,
    ipDraft,
    setIpDraft,
    addIp: () => {
      const trimmed = ipDraft.trim();
      if (!trimmed || !credential || whitelistIps.includes(trimmed)) return;
      updateCredential.mutate({ whitelist_ips: [...whitelistIps, trimmed] });
      setIpDraft("");
    },
    removeIp: (ip: string) => {
      if (!credential) return;
      updateCredential.mutate({ whitelist_ips: whitelistIps.filter((existing) => existing !== ip) });
    },
  };
}
