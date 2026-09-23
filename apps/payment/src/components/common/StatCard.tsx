import type { ComponentType } from "react";
import { ChevronRight } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import { TrendPill, type TrendDirection } from "./TrendPill";

export interface StatCardData {
  id: string;
  label: string;
  value: number;
  /** Trend-pill variant (Dashboard/Financial): both set together, omit for the icon+caption variant. */
  deltaPct?: number;
  direction?: TrendDirection;
  /** Icon+plain-caption variant (Integration): a leading icon instead of a trend pill. */
  icon?: ComponentType<{ className?: string }>;
  iconClassName?: string;
  /** "currency" (default, formatCurrency) or "count" (plain integer, e.g. channel totals). */
  format?: "currency" | "count";
  caption: string;
  /**
   * Where this number is explained.
   *
   * A figure with no way through is a dead end: the client can read that money
   * is "held" and still have no idea which sales are holding it. Cards that
   * have somewhere to go get a link and a chevron; the rest stay plain, so the
   * affordance means something.
   */
  href?: string;
}

interface StatCardProps {
  data: StatCardData;
}

const CARD = "flex flex-col gap-3 rounded-xl border border-border bg-card p-4";

export function StatCard({ data }: StatCardProps) {
  const { label, value, deltaPct, direction, caption, icon: Icon, iconClassName, format = "currency", href } = data;

  const formattedValue = format === "count" ? value.toLocaleString("id-ID") : formatCurrency(value);

  const content = (
    <>
      <Box className="flex items-center justify-between gap-2">
        <Box className="flex items-center gap-2">
          {Icon ? <Icon className={iconClassName ?? "size-4 text-muted-foreground"} /> : null}
          <Text
            as="span"
            variant="small"
            className="font-medium text-muted-foreground"
          >
            {label}
          </Text>
        </Box>
        {direction && deltaPct !== undefined ? (
          <TrendPill
            direction={direction}
            deltaPct={deltaPct}
          />
        ) : href ? (
          // Decorative: the anchor's own text already names the destination, so
          // this only signals that there is one.
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground/70"
          />
        ) : null}
      </Box>
      <Text
        as="div"
        className="text-3xl font-semibold tabular-nums text-foreground"
      >
        {formattedValue}
      </Text>
      <Text variant="small">{caption}</Text>
    </>
  );

  if (!href) {
    return <Box className={CARD}>{content}</Box>;
  }

  return (
    <Link
      href={href}
      className={cn(
        CARD,
        "outline-none transition-colors hover:border-ring/60 hover:bg-accent/40",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      )}
    >
      {content}
    </Link>
  );
}
