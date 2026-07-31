import { useState, useMemo } from "react";
import {
  ALL_CATEGORY,
  type CategoryTab,
  type DiamondPackage,
  type PackageCategory,
} from "@/features/checkout/types/checkout.type";

interface Options {
  packages: DiamondPackage[];
  categories: CategoryTab[];
}

/**
 * Selection state for the checkout page.
 *
 * Order-form values are held as a positional array rather than named
 * `userId`/`serverId`: how many identity fields a game asks for, and what they
 * are called, is decided by the API's `order_form_fields`. Index 0 maps to
 * `target_uid` and index 1 to `target_server` — the only two columns checkout
 * accepts.
 */
export function useCheckoutSelection({ packages, categories }: Options) {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PackageCategory>(ALL_CATEGORY);
  const [fieldValues, setFieldValues] = useState<string[]>([]);
  const [whatsapp, setWhatsapp] = useState("");

  const filteredPackages = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return packages;
    return packages.filter((pkg) => pkg.category === activeCategory);
  }, [packages, activeCategory]);

  /** Sections to render: all of them on "all", otherwise just the active one. */
  const visibleCategories = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return categories;
    return categories.filter((category) => category.key === activeCategory);
  }, [categories, activeCategory]);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );

  const totalPrice = selectedPackage?.price ?? 0;

  const setFieldValue = (index: number, value: string) => {
    setFieldValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSelectPackage = (id: string) => {
    setSelectedPackageId((prev) => (prev === id ? null : id));
  };

  const handleSelectPayment = (id: string) => {
    setSelectedPaymentId((prev) => (prev === id ? null : id));
  };

  return {
    // state
    selectedPackageId,
    selectedPaymentId,
    activeCategory,
    fieldValues,
    userId: fieldValues[0] ?? "",
    serverId: fieldValues[1] ?? "",
    whatsapp,
    // derived
    filteredPackages,
    visibleCategories,
    selectedPackage,
    totalPrice,
    // actions
    setActiveCategory,
    setFieldValue,
    setWhatsapp,
    handleSelectPackage,
    handleSelectPayment,
  };
}
