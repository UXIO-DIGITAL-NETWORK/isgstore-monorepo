import { useTranslation } from "react-i18next";
import { useMemo, useState, type ComponentType } from "react";
import { CreditCard, Globe, Mail, Plug, Truck, Unplug } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { StatCard, type StatCardData } from "@/components/common/StatCard";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChannelCard } from "../components/ChannelCard";
import { useChannels } from "../hooks/useIntegration";
import type { ChannelType } from "../types/integration.type";

type CategoryFilter = "all" | ChannelType;

// `labelKey`, not `label`: a module constant would freeze whichever language
// was loaded at import.
const CATEGORIES: { value: CategoryFilter; labelKey: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: "all", labelKey: "all", icon: Globe },
  { value: "supplier", labelKey: "supplier", icon: Truck },
  { value: "payment_gateway", labelKey: "paymentGateway", icon: CreditCard },
  { value: "email_gateway", labelKey: "emailGateway", icon: Mail },
];

export default function IntegrationPage() {
  const { t } = useTranslation("integration");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const { data: channels, isLoading, isError, refetch } = useChannels();

  const statCards = useMemo<StatCardData[]>(() => {
    if (!channels) return [];

    const active = channels.filter((channel) => channel.connection_status === "connected").length;
    const disconnected = channels.filter((channel) => channel.connection_status === "disconnected").length;
    const supplierCount = channels.filter((channel) => channel.type === "supplier").length;
    const paymentCount = channels.filter((channel) => channel.type === "payment_gateway").length;

    return [
      {
        id: "total-channels",
        label: t("totalChannels"),
        value: channels.length,
        format: "count",
        icon: Plug,
        caption: `${supplierCount} Supplier, ${paymentCount} Payment`,
      },
      {
        id: "active-channels",
        label: t("active"),
        value: active,
        format: "count",
        icon: Plug,
        iconClassName: "size-4 text-success",
        caption: t("activeCaption"),
      },
      {
        id: "disconnected-channels",
        label: t("disconnected"),
        value: disconnected,
        format: "count",
        icon: Unplug,
        iconClassName: "size-4 text-destructive",
        caption: t("disconnectedCaption"),
      },
    ];
  }, [channels, t]);

  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    return category === "all" ? channels : channels.filter((channel) => channel.type === category);
  }, [channels, category]);

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >{t("title")}</Heading>
        <Text variant="muted">
          Manage digital supplier connections and payment gateways. Ping status and balances update per channel.
        </Text>
      </Box>

      <Box className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isError ? (
          <Box className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 md:col-span-3">
            <Text variant="muted">{t("overviewFailed")}</Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >{t("retry")}</Button>
          </Box>
        ) : isLoading || !channels ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Box
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))
        ) : (
          statCards.map((card) => (
            <StatCard
              key={card.id}
              data={card}
            />
          ))
        )}
      </Box>

      <Tabs
        value={category}
        onValueChange={(value) => setCategory(value as CategoryFilter)}
      >
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {CATEGORIES.map(({ value, labelKey, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex-none gap-1.5"
            >
              <Icon className="size-4" />
              {t(labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={category}>
          <Box className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3">
            {isError ? (
              <Box className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 md:col-span-2 xl:col-span-3">
                <Text variant="muted">{t("channelsFailed")}</Text>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                >{t("retry")}</Button>
              </Box>
            ) : isLoading || !channels ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Box
                  key={index}
                  className="h-40 animate-pulse rounded-xl border border-border bg-card"
                />
              ))
            ) : filteredChannels.length === 0 ? (
              <Text
                variant="muted"
                className="md:col-span-2 xl:col-span-3"
              >{t("noChannels")}</Text>
            ) : (
              filteredChannels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                />
              ))
            )}
          </Box>
        </TabsContent>
      </Tabs>
    </Box>
  );
}
