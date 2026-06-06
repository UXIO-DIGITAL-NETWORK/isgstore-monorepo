import { useState, useMemo } from "react";
import type { PackageCategory } from "@/features/checkout/types/checkout.type";
import { DIAMOND_PACKAGES_MOCK } from "@/features/checkout/data/diamondPackages.mock";

export function useCheckoutSelection() {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PackageCategory>("all");
  const [userId, setUserId] = useState("");
  const [serverId, setServerId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const filteredPackages = useMemo(() => {
    if (activeCategory === "all") return DIAMOND_PACKAGES_MOCK;
    return DIAMOND_PACKAGES_MOCK.filter((pkg) => pkg.category === activeCategory);
  }, [activeCategory]);

  const selectedPackage = useMemo(
    () => DIAMOND_PACKAGES_MOCK.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [selectedPackageId],
  );

  const totalPrice = selectedPackage?.price ?? 0;

  const handleSelectPackage = (id: string) => {
    setSelectedPackageId((prev) => (prev === id ? null : id));
  };

  const handleSelectPayment = (id: string) => {
    setSelectedPaymentId((prev) => (prev === id ? null : id));
  };

  const handleSubmit = () => {
    // TODO: wire up RHF+Zod validation + useCreateTransactionMutation
    console.log("Checkout submitted:", { selectedPackageId, selectedPaymentId, userId, serverId, whatsapp });
  };

  return {
    // state
    selectedPackageId,
    selectedPaymentId,
    activeCategory,
    userId,
    serverId,
    whatsapp,
    // derived
    filteredPackages,
    selectedPackage,
    totalPrice,
    // actions
    setActiveCategory,
    setUserId,
    setServerId,
    setWhatsapp,
    handleSelectPackage,
    handleSelectPayment,
    handleSubmit,
  };
}
