import { useTranslation } from "react-i18next";
import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/utils/currency";
import { formatDate, formatDateTime } from "@/utils/date";
import type { Service, ServiceInvoice, ServicePlanLine, ServiceSubscription } from "@/types/service.type";
import { SERVICES_TABS, type ServicesTab } from "../types/merchant.type";

import { OutstandingBillsPanel } from "../components/OutstandingBillsPanel";
import {
  useMerchantServiceInvoices,
  useMerchantServices,
  useMerchantSubscriptions,
  useServicePlan,
} from "../hooks/useMerchant";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const CARD = "flex flex-col gap-3 rounded-xl border border-border bg-card p-5";

function SubscriptionCard({ subscription }: { subscription: ServiceSubscription }) {
  const { t } = useTranslation("merchant");

  return (
    <Box className={CARD}>
      <Box className="flex items-start justify-between gap-2">
        <Heading level={3}>{subscription.service?.name ?? t("services.fallbackServiceName")}</Heading>
        <StatusBadge status={subscription.status} />
      </Box>
      <Text variant="small">
        {formatDate(subscription.starts_at)} – {formatDate(subscription.ends_at)}
      </Text>
      <Text
        as="span"
        variant="small"
        className={
          subscription.days_remaining <= 14
            ? "text-warning tabular-nums"
            : "text-success tabular-nums"
        }
      >
        {t("services.daysRemaining", { count: subscription.days_remaining })}
      </Text>
      {/* No invoice means the term was granted rather than bought here — the
          website licence the Hub keeps in step. Saying so beats a blank line
          where every other card shows a purchase. */}
      {!subscription.invoice_number && (
        <Text
          as="span"
          variant="small"
          className="text-muted-foreground"
        >
          {t("services.includedWithWebsite")}
        </Text>
      )}
    </Box>
  );
}

function CatalogCard({ service }: { service: Service }) {
  const { t } = useTranslation("merchant");

  return (
    <Box className={CARD}>
      <Box className="flex items-start justify-between gap-2">
        <Heading level={3}>{service.name}</Heading>
        <Badge variant="secondary">{service.category_label}</Badge>
      </Box>

      {service.description && <Text variant="small">{service.description}</Text>}

      {service.features.length > 0 && (
        <Box
          as="ul"
          className="flex flex-col gap-1"
        >
          {service.features.map((feature) => (
            <Box
              as="li"
              key={feature}
            >
              <Text
                as="span"
                variant="small"
                className="text-muted-foreground"
              >
                • {feature}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      <Text
        as="span"
        className="tabular-nums font-medium"
      >
        {money(service.selling_price)}{" "}
        <Text
          as="span"
          variant="small"
          className="text-muted-foreground"
        >
          {t("services.perDays", { count: service.duration_days })}
        </Text>
      </Text>

      <Button
        asChild
        className="w-full"
      >
        <Link href={`/app/payment-admin/services/${service.id}/checkout`}>{t("services.subscribe")}</Link>
      </Button>
    </Box>
  );
}

interface MerchantServicesPageProps {
  /** Controlled by the route from ?tab=. Absent in tests → local state. */
  tab?: ServicesTab;
  onTabChange?: (tab: ServicesTab) => void;
}

/**
 * Every service in the site's plan, paid or not.
 *
 * The subscription cards below only exist once a period has been PAID for — so
 * a service the client has been sold and has not settled yet is invisible there,
 * which is precisely the row they need to see.
 */
function ServicePlanSummary({ lines, isLoading }: { lines: ServicePlanLine[]; isLoading?: boolean }) {
  const { t } = useTranslation("merchant");

  if (isLoading) return <Text variant="small">{t("services.loading")}</Text>;
  if (lines.length === 0) return null;

  return (
    <Box className="flex flex-col gap-2 rounded-xl border border-border p-4">
      <Heading level={3}>{t("plan.title")}</Heading>
      {lines.map((line) => (
        <Box
          key={line.service_code}
          className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-2"
        >
          <Box className="flex min-w-0 flex-col">
            <Text as="span" className="font-medium">{line.service_name}</Text>
            <Text as="span" variant="small" className="text-muted-foreground">
              {money(line.amount)} / {line.duration_days} {t("plan.days")}
              {line.governs_licence && ` · ${t("plan.governsSite")}`}
            </Text>
          </Box>
          <Box className="flex flex-col items-end">
            <Text as="span" variant="small">
              {line.active_until
                ? t("plan.activeUntil", { date: formatDate(line.active_until) })
                : t("plan.notYetPaid")}
            </Text>
            {line.outstanding_total > 0 && (
              <Text as="span" variant="small" className="text-warning tabular-nums">
                {t("plan.outstanding", { amount: money(line.outstanding_total) })}
              </Text>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function MerchantServicesPage({ tab, onTabChange }: MerchantServicesPageProps = {}) {
  const { t } = useTranslation("merchant");
  const [internalTab, setInternalTab] = useState<ServicesTab>(tab ?? "subscriptions");
  const [invoicePage, setInvoicePage] = useState(1);

  // Controlled when a host supplies onTabChange (the route, writing ?tab=);
  // uncontrolled otherwise, which is what keeps a bare render() working.
  const activeTab = onTabChange ? (tab ?? "subscriptions") : internalTab;

  const goToTab = (next: string) => {
    const value = (SERVICES_TABS as readonly string[]).includes(next) ? (next as ServicesTab) : "subscriptions";

    if (onTabChange) {
      onTabChange(value);
    } else {
      setInternalTab(value);
    }
  };

  const { data: subscriptions, isLoading: loadingSubs } = useMerchantSubscriptions({ page: 1, per_page: 50 });
  const { data: plan, isLoading: loadingPlan } = useServicePlan();
  const { data: catalog, isLoading: loadingCatalog } = useMerchantServices({ page: 1, per_page: 50 });
  const {
    data: invoices,
    isLoading: loadingInvoices,
    isError: invoicesError,
  } = useMerchantServiceInvoices({ page: invoicePage, per_page: 20 });

  const invoiceColumns: Column<ServiceInvoice>[] = [
    {
      key: "invoice",
      header: t("services.colInvoice"),
      cell: (r) => (
        <Link
          href={`/app/payment-admin/service-invoices/${r.id}`}
          className="font-medium underline"
        >
          {r.invoice_number}
        </Link>
      ),
    },
    { key: "service", header: t("services.colService"), cell: (r) => r.service_name },
    { key: "amount", header: t("services.colAmount"), className: "text-right tabular-nums", cell: (r) => money(r.amount) },
    { key: "status", header: t("services.colStatus"), cell: (r) => <StatusBadge status={r.status} /> },
    { key: "due", header: t("services.colDue"), cell: (r) => formatDateTime(r.due_at) },
    {
      key: "actions",
      header: t("services.colAction"),
      // An unpaid bill is settled on its own page, where the QR or VA lives —
      // there is nothing to do from a table row any more.
      cell: (r) => (
        <Button
          asChild
          size="sm"
          variant={r.status === "UNPAID" ? "default" : "outline"}
        >
          <Link href={`/app/payment-admin/service-invoices/${r.id}`}>
            {r.status === "UNPAID" ? t("services.pay") : t("services.detail")}
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>{t("services.title")}</Heading>

      <Tabs
        value={activeTab}
        onValueChange={goToTab}
      >
        <TabsList>
          <TabsTrigger value="subscriptions">{t("services.tabSubscriptions")}</TabsTrigger>
          <TabsTrigger value="bills">{t("services.tabBills")}</TabsTrigger>
          <TabsTrigger value="catalog">{t("services.tabCatalog")}</TabsTrigger>
          <TabsTrigger value="invoices">{t("services.tabInvoices")}</TabsTrigger>
        </TabsList>

        <TabsContent
          value="subscriptions"
          className="mt-6 flex flex-col gap-6"
        >
          {/*
            Every planned service, paid or not. The cards below only exist once
            a period has been paid for, so on their own they cannot answer the
            question a client opens this page with.
          */}
          <ServicePlanSummary lines={plan ?? []} isLoading={loadingPlan} />

          {loadingSubs ? (
            <Text variant="small">{t("services.loading")}</Text>
          ) : (subscriptions?.rows.length ?? 0) === 0 ? (
            <Text variant="small">{t("services.noActiveSubscriptions")}</Text>
          ) : (
            <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subscriptions?.rows.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                />
              ))}
            </Box>
          )}
        </TabsContent>

        <TabsContent
          value="bills"
          className="mt-6"
        >
          {loadingPlan ? (
            <Text variant="small">{t("services.loading")}</Text>
          ) : (
            <OutstandingBillsPanel lines={plan ?? []} />
          )}
        </TabsContent>

        <TabsContent
          value="catalog"
          className="mt-6"
        >
          {loadingCatalog ? (
            <Text variant="small">{t("services.loading")}</Text>
          ) : (catalog?.rows.length ?? 0) === 0 ? (
            <Text variant="small">{t("services.noServicesAvailable")}</Text>
          ) : (
            <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catalog?.rows.map((service) => (
                <CatalogCard
                  key={service.id}
                  service={service}
                />
              ))}
            </Box>
          )}
        </TabsContent>

        <TabsContent
          value="invoices"
          className="mt-6 flex flex-col gap-6"
        >
          <SimpleTable
            columns={invoiceColumns}
            rows={invoices?.rows ?? []}
            isLoading={loadingInvoices}
            isError={invoicesError}
            emptyLabel={t("services.noPurchases")}
            rowKey={(r) => r.id}
          />
          <Pager
            page={invoices?.page ?? invoicePage}
            lastPage={invoices?.lastPage ?? 1}
            total={invoices?.total ?? 0}
            onPageChange={setInvoicePage}
          />
        </TabsContent>
      </Tabs>
    </Box>
  );
}
