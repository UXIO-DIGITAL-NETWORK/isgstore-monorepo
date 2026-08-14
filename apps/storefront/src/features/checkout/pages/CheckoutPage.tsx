import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
  PromoCode,
  CustomerReviews,
  OrderSummary,
} from "@/features/checkout/components";
import { useCheckoutSelection } from "@/features/checkout/hooks/useCheckoutSelection";
import {
  useCheckoutMutation,
  useGameProductsQuery,
  useGameQuery,
  useGameReviewsQuery,
  usePaymentChannelsQuery,
  useValidateGameIdMutation,
} from "@/features/checkout/hooks/useCheckoutQueries";
import { calculateAdminFee } from "@/features/checkout/lib/mappers";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { GameInfo, PaymentOption } from "@/features/checkout/types/checkout.type";

/** Shown while the game loads, so the header doesn't collapse mid-render. */
const EMPTY_GAME: GameInfo = { name: "", publisher: "", region: "", slug: "", logo: "", thumbnail: "" };

export default function CheckoutPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { t } = useTranslation("checkout");
  const { locale, gameSlug } = useParams({ strict: false }) as { locale: string; gameSlug: string };
  const setPendingOrder = useCheckoutStore((s) => s.setPendingOrder);

  const gameQuery = useGameQuery(gameSlug);
  const productsQuery = useGameProductsQuery(gameSlug);
  const channelsQuery = usePaymentChannelsQuery();
  const reviewsQuery = useGameReviewsQuery(gameSlug);
  const checkoutMutation = useCheckoutMutation();

  const game = gameQuery.data?.info ?? EMPTY_GAME;
  const orderFormFields = gameQuery.data?.detail.order_form_fields ?? [];
  const packages = useMemo(() => productsQuery.data?.packages ?? [], [productsQuery.data]);
  const categories = useMemo(() => productsQuery.data?.categories ?? [], [productsQuery.data]);
  const paymentGroups = useMemo(() => channelsQuery.data?.groups ?? [], [channelsQuery.data]);
  const memberCredits = channelsQuery.data?.memberCredits ?? null;

  const {
    selectedPackageId,
    selectedPaymentId,
    activeCategory,
    userId,
    serverId,
    whatsapp,
    email,
    filteredPackages,
    visibleCategories,
    selectedPackage,
    totalPrice,
    setActiveCategory,
    setFieldValue,
    setWhatsapp,
    setEmail,
    handleSelectPackage,
    handleSelectPayment,
  } = useCheckoutSelection({ packages, categories });

  // Prefill the email for a logged-in member from their account (still editable).
  const authEmail = useAuthStore((s) => s.user?.email);
  useEffect(() => {
    if (authEmail) setEmail(authEmail);
    // Only when the signed-in member changes; the field stays editable after.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authEmail]);

  // "Cek Username" is button-triggered (a paid supplier check for some games),
  // so the resolved name is held locally and cleared whenever the id changes.
  const supportsNicknameCheck = gameQuery.data?.detail.supports_nickname_check ?? false;
  const validateMutation = useValidateGameIdMutation(gameSlug);
  const [nickname, setNickname] = useState<string | null>(null);
  const [nicknameChecked, setNicknameChecked] = useState(false);

  useEffect(() => {
    setNickname(null);
    setNicknameChecked(false);
  }, [userId, serverId]);

  const handleCheckUsername = () => {
    if (!userId.trim()) return;
    validateMutation.mutate(
      { target_uid: userId.trim(), target_server: serverId.trim() || undefined },
      {
        onSuccess: (data) => {
          setNickname(data.nickname ?? null);
          setNicknameChecked(true);
        },
      },
    );
  };

  /** The wallet, or the chip the customer picked out of a group. */
  const selectedPayment = useMemo((): PaymentOption | null => {
    if (!selectedPaymentId) return null;

    if (memberCredits && selectedPaymentId === memberCredits.id) {
      return {
        id: memberCredits.id,
        channelId: memberCredits.channelId,
        name: t("payment.credits"),
        logo: memberCredits.logo,
        minAmount: 0,
        feeFlat: 0,
        feePercent: 0,
      };
    }

    for (const group of paymentGroups) {
      const found = group.options.find((option) => option.id === selectedPaymentId);
      if (found) return found;
    }

    return null;
  }, [selectedPaymentId, memberCredits, paymentGroups, t]);

  // Mirrors CheckoutAction's fee maths so the summary/modal show the exact
  // total the customer is about to be charged: package + the method's fee.
  const adminFee = selectedPayment ? calculateAdminFee(selectedPayment, totalPrice) : 0;

  // Held here rather than inside PromoCode so the code reaches checkout and
  // the summary can show what it is worth. The server re-resolves it, so this
  // figure is display-only.
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);

  const handleConfirmCheckout = () => {
    if (!selectedPackage || !selectedPayment) return;

    checkoutMutation.mutate(
      {
        product_id: selectedPackage.productId,
        payment_channel_id: selectedPayment.channelId,
        target_uid: userId.trim(),
        target_server: serverId.trim() || undefined,
        // Display-only echo of what validate-id returned; the API stores it so
        // the receipt keeps showing the name that was confirmed here.
        target_nickname: nickname ?? undefined,
        guest_contact: whatsapp.trim() || undefined,
        // Required destination for the purchase-receipt email (and a tracking key).
        email: email.trim(),
        // Storefront language, so the receipt email is sent in the buyer's language.
        locale,
        promo_code: appliedPromo?.code,
      },
      {
        onSuccess: (response) => {
          const result = response.data;

          // Seeds the invoice page's first paint. The server stays the source
          // of truth — the invoice query overwrites this once it resolves.
          setPendingOrder({
            invoiceNumber: result.invoice_number,
            gameName: game.name,
            gameRegion: game.region,
            gameThumbnail: game.thumbnail,
            packageLabel: selectedPackage.name,
            userId: userId.trim(),
            serverId: serverId.trim(),
            username: nickname ?? "",
            paymentName: result.payment.channel,
            price: result.product.price,
            adminFee: result.payment.admin_fee,
            total: result.payment.amount,
            createdAt: Date.now(),
          });

          navigate({
            to: "/$locale/invoice/$invoiceNumber",
            params: { locale: locale ?? "id", invoiceNumber: result.invoice_number },
          });
        },
        onError: (error: unknown) => {
          // The API returns a human-readable reason for every business-rule
          // rejection (insufficient balance, product unavailable, duplicate
          // submit) — surface that instead of a generic failure.
          const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            t("errors:generic", { defaultValue: "Terjadi kesalahan. Silakan coba lagi." });
          toast.error(message);
        },
      },
    );
  };

  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      {/* Header banner unit — full-width background, content stays at max-w-6xl */}
      <Box className="w-full">
        <ProductBanner />
        <GameInfoBar game={game} />
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
              fields={orderFormFields}
              values={[userId, serverId]}
              onValueChange={setFieldValue}
              nickname={nickname}
              isValidatingNickname={validateMutation.isPending}
              supportsNicknameCheck={supportsNicknameCheck}
              onCheckUsername={handleCheckUsername}
              nicknameChecked={nicknameChecked}
            />
            {/* Reviews: order-last on mobile (after right col), natural position on desktop */}
            <Box className="order-last lg:order-0">
              <CustomerReviews
                reviews={reviewsQuery.data?.reviews}
                summary={reviewsQuery.data?.summary}
              />
            </Box>
          </Box>

          {/* ── Right column (mobile: order-2 so it sits between AccountDetail and Reviews) ── */}
          <Box className="flex flex-col gap-5 order-2 lg:order-0">
            <DiamondPackages
              packages={filteredPackages}
              categories={visibleCategories}
              selectedPackageId={selectedPackageId}
              activeCategory={activeCategory}
              onSelectPackage={handleSelectPackage}
              onCategoryChange={setActiveCategory}
            />

            <PaymentMethods
              groups={paymentGroups}
              memberCredits={memberCredits}
              selectedPaymentId={selectedPaymentId}
              onSelectPayment={handleSelectPayment}
            />

            <ContactDetail
              whatsapp={whatsapp}
              onWhatsappChange={setWhatsapp}
              email={email}
              onEmailChange={setEmail}
            />

            <PromoCode
              productId={selectedPackage?.productId}
              amount={selectedPackage?.price}
              applied={appliedPromo}
              onApplied={setAppliedPromo}
              onCleared={() => setAppliedPromo(null)}
            />

            <OrderSummary
              selectedPackage={selectedPackage}
              totalPrice={totalPrice}
              adminFee={adminFee}
              gameThumbnail={game.thumbnail}
              gameName={game.name}
              selectedPaymentName={selectedPayment?.name}
              userId={userId}
              serverId={serverId}
              whatsapp={whatsapp}
              nickname={nickname}
              isSubmitting={checkoutMutation.isPending}
              onSubmit={handleConfirmCheckout}
            />
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
