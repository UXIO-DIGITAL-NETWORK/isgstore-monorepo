import React, { useMemo } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import {
  ProductBanner,
  GameInfoBar,
  AccountDetailForm,
  DiamondPackages,
  PaymentMethods,
  ContactDetail,
  CustomerReviews,
  OrderSummary,
} from "@/features/checkout/components";
import { useCheckoutSelection } from "@/features/checkout/hooks/useCheckoutSelection";
import { GAME_INFO_MOCK } from "@/features/checkout/data/gameInfo.mock";
import { PAYMENT_GROUPS_MOCK, MEMBER_CREDITS_MOCK } from "@/features/checkout/data/paymentMethods.mock";
import { useCheckoutStore } from "@/store/useCheckoutStore";

/** Generates a mock invoice number in the format TOPUP-DDMMYYYY-XXXXXXXX */
function generateInvoiceNumber(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  const hex = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `TOPUP-${dd}${mm}${yyyy}-${hex}`;
}

export default function CheckoutPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { locale } = useParams({ strict: false }) as { locale: string };
  const setPendingOrder = useCheckoutStore((s) => s.setPendingOrder);

  const {
    selectedPackageId,
    selectedPaymentId,
    activeCategory,
    userId,
    serverId,
    whatsapp,
    filteredPackages,
    selectedPackage,
    totalPrice,
    setActiveCategory,
    setUserId,
    setServerId,
    setWhatsapp,
    handleSelectPackage,
    handleSelectPayment,
  } = useCheckoutSelection();

  const selectedPaymentName = useMemo(() => {
    if (!selectedPaymentId) return undefined;
    if (selectedPaymentId === MEMBER_CREDITS_MOCK.id) return "Credits";
    for (const group of PAYMENT_GROUPS_MOCK) {
      const found = group.options.find((o) => o.id === selectedPaymentId);
      if (found) return found.name;
    }
    return undefined;
  }, [selectedPaymentId]);

  const handleConfirmCheckout = () => {
    if (!selectedPackage) return;

    const invoiceNumber = generateInvoiceNumber();
    // TODO: replace adminFee with backend-provided value
    const adminFee = Math.round(totalPrice * 0.04);

    setPendingOrder({
      invoiceNumber,
      gameName: GAME_INFO_MOCK.name,
      gameRegion: GAME_INFO_MOCK.region,
      gameThumbnail: GAME_INFO_MOCK.thumbnail,
      packageLabel: selectedPackage.name,
      userId,
      serverId,
      username: "Ramonezz", // TODO: replace with validated nickname from game server
      paymentName: selectedPaymentName ?? "QRIS",
      price: totalPrice,
      adminFee,
      total: totalPrice + adminFee,
      createdAt: Date.now(),
    });

    navigate({
      to: "/$locale/invoice/$invoiceNumber",
      params: { locale: locale ?? "id", invoiceNumber },
    });
  };

  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      {/* Header banner unit — full-width background, content stays at max-w-6xl */}
      <Box className="w-full">
        <ProductBanner />
        <GameInfoBar game={GAME_INFO_MOCK} />
      </Box>

      {/* Two-column layout */}
      <Box className="max-w-6xl mx-auto px-4 md:px-8 mt-14 pb-14">
        <Box className="grid grid-cols-1 lg:grid-cols-[5fr_8fr] gap-5 items-start">

          {/* ── Left column ──
               On desktop: normal flex-col so AccountDetailForm + Reviews stack tightly.
               On mobile: `contents` makes this box transparent — children become direct
               grid items so CSS `order` can place Reviews after the right column. ── */}
          <Box className="contents lg:flex lg:flex-col lg:gap-5">
            <AccountDetailForm
              userId={userId}
              serverId={serverId}
              onUserIdChange={setUserId}
              onServerIdChange={setServerId}
            />
            {/* Reviews: order-last on mobile (after right col), natural position on desktop */}
            <Box className="order-last lg:order-none">
              <CustomerReviews />
            </Box>
          </Box>

          {/* ── Right column (mobile: order-2 so it sits between AccountDetail and Reviews) ── */}
          <Box className="flex flex-col gap-5 order-2 lg:order-none">
            <DiamondPackages
              packages={filteredPackages}
              selectedPackageId={selectedPackageId}
              activeCategory={activeCategory}
              onSelectPackage={handleSelectPackage}
              onCategoryChange={setActiveCategory}
            />

            <PaymentMethods
              groups={PAYMENT_GROUPS_MOCK}
              memberCredits={MEMBER_CREDITS_MOCK}
              selectedPaymentId={selectedPaymentId}
              onSelectPayment={handleSelectPayment}
            />

            <ContactDetail
              whatsapp={whatsapp}
              onWhatsappChange={setWhatsapp}
            />

            <OrderSummary
              selectedPackage={selectedPackage}
              totalPrice={totalPrice}
              gameThumbnail={GAME_INFO_MOCK.thumbnail}
              gameName={GAME_INFO_MOCK.name}
              selectedPaymentName={selectedPaymentName}
              userId={userId}
              serverId={serverId}
              onSubmit={handleConfirmCheckout}
            />
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
