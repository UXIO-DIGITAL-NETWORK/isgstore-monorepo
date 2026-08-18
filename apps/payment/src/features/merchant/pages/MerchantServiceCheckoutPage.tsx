import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

import { useMerchantServiceDetail, useSubscribeService } from "../hooks/useMerchant";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

interface MerchantServiceCheckoutPageProps {
  serviceId: number;
}

/**
 * What the client is about to buy, before they are committed to it: price,
 * period length, and the exact window confirmation will open.
 *
 * The window comes from the server, which applies the same renewal-stacking
 * rule the confirmation does — deriving it here would eventually disagree with
 * what the client actually gets.
 */
export default function MerchantServiceCheckoutPage({ serviceId }: MerchantServiceCheckoutPageProps) {
  const [notes, setNotes] = useState("");
  const navigate = useNavigate();
  const { data: service, isLoading, isError } = useMerchantServiceDetail(serviceId);
  const { mutate: subscribe, isPending } = useSubscribeService();

  if (isLoading) {
    return <Text variant="small">Memuat…</Text>;
  }

  if (isError || !service) {
    return (
      <Box className="flex flex-col gap-4">
        <Heading level={1}>Service tidak ditemukan</Heading>
        <Text variant="small">Layanan ini mungkin sudah tidak tersedia.</Text>
        <Link
          href="/app/payment-admin/services"
          className="underline"
        >
          Kembali ke katalog
        </Link>
      </Box>
    );
  }

  const confirm = () =>
    subscribe(
      { service_id: service.id, notes: notes.trim() || undefined },
      {
        onSuccess: (invoice) =>
          navigate({
            to: "/app/payment-admin/service-invoices/$invoiceId",
            params: { invoiceId: String(invoice.id) },
          }),
      },
    );

  return (
    <Box className="flex max-w-2xl flex-col gap-6">
      <Box className="flex flex-col gap-1">
        <Link
          href="/app/payment-admin/services"
          className="text-sm text-muted-foreground underline"
        >
          ← Kembali ke katalog
        </Link>
        <Heading level={1}>Konfirmasi Langganan</Heading>
      </Box>

      <Box className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
        <Box className="flex items-start justify-between gap-2">
          <Heading level={2}>{service.name}</Heading>
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

        <Box className="flex flex-col gap-2 border-t border-border pt-4">
          <Row
            label="Harga"
            value={money(service.selling_price)}
          />
          <Row
            label="Masa aktif"
            value={`${service.duration_days} hari`}
          />
          <Row
            label="Periode berlaku"
            value={`${formatDate(service.projected_starts_at)} – ${formatDate(service.projected_ends_at)}`}
          />
        </Box>

        {service.current_period_ends_at && (
          <Text
            variant="small"
            className="text-muted-foreground"
          >
            Langganan aktif Anda berakhir {formatDate(service.current_period_ends_at)}. Periode baru dimulai setelahnya,
            jadi sisa hari yang sudah dibayar tidak hangus.
          </Text>
        )}

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="checkout-notes">Catatan (opsional)</Label>
          <Textarea
            id="checkout-notes"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Misalnya kebutuhan khusus saat instalasi"
          />
        </Box>

        {service.has_open_invoice ? (
          <Box className="flex flex-col gap-2">
            <Text
              variant="small"
              className="text-destructive"
            >
              Masih ada invoice yang belum selesai untuk layanan ini.
            </Text>
            <Link href={`/app/payment-admin/service-invoices/${service.open_invoice_id}`}>
              <Button
                variant="secondary"
                className="w-full"
              >
                Lihat Invoice
              </Button>
            </Link>
          </Box>
        ) : (
          <Button
            className="w-full"
            disabled={isPending}
            onClick={confirm}
          >
            {isPending ? "Memproses…" : "Konfirmasi & Buat Invoice"}
          </Button>
        )}
      </Box>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box className="flex items-baseline justify-between gap-4">
      <Text
        as="span"
        variant="small"
        className="text-muted-foreground"
      >
        {label}
      </Text>
      <Text
        as="span"
        className="font-medium tabular-nums"
      >
        {value}
      </Text>
    </Box>
  );
}
