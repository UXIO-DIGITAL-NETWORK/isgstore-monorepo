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
 * Order-form values are held as a map keyed by the field's own `key`, because
 * how many identity fields a game asks for — and what they are called — is
 * decided by the API's `order_form_fields`, and it is no longer limited to the
 * two columns the schema started with. The page derives the first two values
 * (the mirrored columns and the nickname lookup) from the field list it renders.
 */
export function useCheckoutSelection({ packages, categories }: Options) {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PackageCategory>(ALL_CATEGORY);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

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

  const setFieldValue = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
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
    whatsapp,
    email,
    // derived
    filteredPackages,
    visibleCategories,
    selectedPackage,
    totalPrice,
    // actions
    setActiveCategory,
    setFieldValue,
    setWhatsapp,
    setEmail,
    handleSelectPackage,
    handleSelectPayment,
  };
}
