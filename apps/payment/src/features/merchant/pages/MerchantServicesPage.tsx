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
import type { Service, ServiceInvoice, ServiceSubscription } from "@/types/service.type";

import { UploadProofDialog } from "../components/UploadProofDialog";
import { useMerchantServiceInvoices, useMerchantServices, useMerchantSubscriptions } from "../hooks/useMerchant";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const CARD = "flex flex-col gap-3 rounded-xl border border-border bg-card p-5";

function SubscriptionCard({ subscription }: { subscription: ServiceSubscription }) {
  return (
    <Box className={CARD}>
      <Box className="flex items-start justify-between gap-2">
        <Heading level={3}>{subscription.service?.name ?? "Service"}</Heading>
        <StatusBadge status={subscription.status} />
      </Box>
      <Text variant="small">
        {formatDate(subscription.starts_at)} – {formatDate(subscription.ends_at)}
      </Text>
      <Text
        as="span"
        variant="small"
        className="text-success tabular-nums"
      >
        {subscription.days_remaining} hari tersisa
      </Text>
    </Box>
  );
}

function CatalogCard({ service }: { service: Service }) {
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
        {money(service.price)}{" "}
        <Text
          as="span"
          variant="small"
          className="text-muted-foreground"
        >
          / {service.duration_days} hari
        </Text>
      </Text>

      <Button
        asChild
        className="w-full"
      >
        <Link href={`/app/payment-admin/services/${service.id}/checkout`}>Berlangganan</Link>
      </Button>
    </Box>
  );
}

export default function MerchantServicesPage() {
  const [tab, setTab] = useState("subscriptions");
  const [invoicePage, setInvoicePage] = useState(1);

  const { data: subscriptions, isLoading: loadingSubs } = useMerchantSubscriptions({ page: 1, per_page: 50 });
  const { data: catalog, isLoading: loadingCatalog } = useMerchantServices({ page: 1, per_page: 50 });
  const {
    data: invoices,
    isLoading: loadingInvoices,
    isError: invoicesError,
  } = useMerchantServiceInvoices({ page: invoicePage, per_page: 20 });

  const invoiceColumns: Column<ServiceInvoice>[] = [
    {
      key: "invoice",
      header: "No. Invoice",
      cell: (r) => (
        <Link
          href={`/app/payment-admin/service-invoices/${r.id}`}
          className="font-medium underline"
        >
          {r.invoice_number}
        </Link>
      ),
    },
    { key: "service", header: "Service", cell: (r) => r.service_name },
    { key: "amount", header: "Nominal", className: "text-right tabular-nums", cell: (r) => money(r.amount) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "due", header: "Jatuh Tempo", cell: (r) => formatDateTime(r.due_at) },
    {
      key: "actions",
      header: "Aksi",
      cell: (r) =>
        r.status === "UNPAID" || r.status === "REJECTED" ? (
          <UploadProofDialog invoice={r} />
        ) : (
          <Text
            as="span"
            className="text-muted-foreground"
          >
            —
          </Text>
        ),
    },
  ];

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Services</Heading>

      <Tabs
        value={tab}
        onValueChange={setTab}
      >
        <TabsList>
          <TabsTrigger value="subscriptions">Langganan Saya</TabsTrigger>
          <TabsTrigger value="catalog">Katalog</TabsTrigger>
          <TabsTrigger value="invoices">Riwayat Pembelian</TabsTrigger>
        </TabsList>

        <TabsContent
          value="subscriptions"
          className="mt-6"
        >
          {loadingSubs ? (
            <Text variant="small">Memuat…</Text>
          ) : (subscriptions?.rows.length ?? 0) === 0 ? (
            <Text variant="small">Belum ada layanan yang aktif. Lihat tab Katalog untuk berlangganan.</Text>
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
          value="catalog"
          className="mt-6"
        >
          {loadingCatalog ? (
            <Text variant="small">Memuat…</Text>
          ) : (catalog?.rows.length ?? 0) === 0 ? (
            <Text variant="small">Belum ada service yang tersedia.</Text>
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
            emptyLabel="Belum ada pembelian"
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
