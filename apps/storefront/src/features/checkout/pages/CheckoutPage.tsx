import React from "react";
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
import { PAYMENT_GROUPS_MOCK } from "@/features/checkout/data/paymentMethods.mock";

export default function CheckoutPage(): React.JSX.Element {
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
    handleSubmit,
  } = useCheckoutSelection();

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

          {/* ── Left column ── */}
          <Box className="flex flex-col gap-5">
            <AccountDetailForm
              userId={userId}
              serverId={serverId}
              onUserIdChange={setUserId}
              onServerIdChange={setServerId}
            />
            <CustomerReviews />
          </Box>

          {/* ── Right column ── */}
          <Box className="flex flex-col gap-5">
            <DiamondPackages
              packages={filteredPackages}
              selectedPackageId={selectedPackageId}
              activeCategory={activeCategory}
              onSelectPackage={handleSelectPackage}
              onCategoryChange={setActiveCategory}
            />

            <PaymentMethods
              groups={PAYMENT_GROUPS_MOCK}
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
              gameLogo={GAME_INFO_MOCK.logo}
              gameName={GAME_INFO_MOCK.name}
              onSubmit={handleSubmit}
            />
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
