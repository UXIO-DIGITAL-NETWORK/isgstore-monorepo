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
import { invoiceStatusLabelKey } from "@/lib/invoiceStatus";
import { subscriptionStatusLabelKey } from "@/lib/subscriptionStatus";
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
        <StatusBadge
          status={subscription.status}
          label={
            subscriptionStatusLabelKey(subscription.status)
              ? t(subscriptionStatusLabelKey(subscription.status) as string)
              : undefined
          }
        />
      </Box>
      {subscription.lifetime ? (
        // Bought outright: no period to print and nothing counting down, so the
        // card says so. Rendering "– --" beside a warning-red "0 hari tersisa"
        // was telling a client who had paid in full that their subscription had
        // run out.
        <Text variant="small">{t("services.lifetime")}</Text>
      ) : (
        <>
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
        </>
      )}
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

function CatalogCard({ service, subscribed }: { service: Service; subscribed: boolean }) {
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

      {/* Already held: the CTA becomes a statement rather than a way in. The
          client's bill for this service comes from their plan, so a second
          subscription would be a second bill for one thing. */}
      {subscribed ? (
        <Button
          variant="outline"
          className="w-full"
          disabled
        >
          {t("services.alreadySubscribed")}
        </Button>
      ) : (
        <Button
          asChild
          className="w-full"
        >
          <Link href={`/app/payment-admin/services/${service.id}/checkout`}>{t("services.subscribe")}</Link>
        </Button>
      )}
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
function ServicePlanSummary({
  lines,
  isLoading,
  onViewBills,
}: {
  lines: ServicePlanLine[];
  isLoading?: boolean;
  /** Takes the client to the tab that actually pays the amount shown here. */
  onViewBills: () => void;
}) {
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
              {/* Lifetime first: a licence bought outright has no date, and an
                  empty date here would read as "never paid" on the one screen
                  that should be confirming the client HAS paid. */}
              {line.lifetime
                ? t("plan.lifetime")
                : line.active_until
                  ? t("plan.activeUntil", { date: formatDate(line.active_until) })
                  : t("plan.notYetPaid")}
            </Text>
            {line.outstanding_total > 0 && (
              // A restated figure with no way through is a dead end; this now
              // opens the tab where the debt is settled.
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-warning"
                onClick={onViewBills}
              >
                {t("plan.outstanding", { amount: money(line.outstanding_total) })}
              </Button>
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
  /** Decides which next step a client with nothing active is actually offered. */
  const hasOutstanding = (plan ?? []).some((line) => line.outstanding_total > 0);
  const { data: catalog, isLoading: loadingCatalog } = useMerchantServices({ page: 1, per_page: 50 });

  /**
   * Services the client already holds — so the catalogue offers a statement
   * rather than a way to buy the same thing twice.
   *
   * Two shapes, both of which count: an ACTIVE subscription (they bought it) and
   * a live plan line (the Hub bills them for it, paid or not — the plan IS the
   * agreement). A retired line does not, or the catalogue would be closed to
   * something the client no longer pays for.
   */
  const heldCodes = new Set<string>([
    ...(plan ?? []).filter((line) => line.is_active).map((line) => line.service_code),
    ...(subscriptions?.rows ?? [])
      .filter((row) => row.status === "ACTIVE" && row.service !== undefined)
      .map((row) => row.service?.code as string),
  ]);
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
    {
      key: "status",
      header: t("services.colStatus"),
      // Wording rather than the enum — see lib/invoiceStatus.
      cell: (r) => (
        <StatusBadge
          status={r.status}
          label={invoiceStatusLabelKey(r.status) ? t(invoiceStatusLabelKey(r.status) as string) : undefined}
        />
      ),
    },
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
          <ServicePlanSummary
            lines={plan ?? []}
            isLoading={loadingPlan}
            onViewBills={() => goToTab("bills")}
          />

          {loadingSubs ? (
            <Text variant="small">{t("services.loading")}</Text>
          ) : (subscriptions?.rows.length ?? 0) === 0 ? (
            <Box className="flex flex-col gap-1">
              <Text variant="small">{t("services.noActiveSubscriptions")}</Text>
              {/* The plan line above can show money owed for a service nobody
                  has paid for yet, so "nothing active" must not read as
                  "nothing to do" — the next step depends on which it is. */}
              <Text
                as="span"
                variant="small"
                className={hasOutstanding ? "text-warning" : undefined}
              >
                {hasOutstanding ? t("services.outstandingHint") : t("services.noActiveSubscriptionsCta")}
              </Text>
            </Box>
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
                  subscribed={heldCodes.has(service.code)}
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
