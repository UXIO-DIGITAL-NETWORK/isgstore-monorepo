import { Badge } from "@/components/ui/badge";
import { PUBLISH_STATE_LABELS, type PublishState } from "../types/product.type";

/**
 * The reference stacks two badges per row. §4.6 models them as two separate
 * axes rather than one repeated state: lifecycle and storefront availability
 * (`is_available`, the §6 entity field).
 *
 * The lifecycle badge reads `publish_state`, not `status`. `status` is only half
 * of what makes a product sellable — the other half is an active supplier
 * mapping — so a badge reading "Active" could sit next to a product the
 * storefront could not see.
 *
 * Monochrome rules apply — colour is functional only (design_system.md §3.2),
 * so only the live state earns `text-success`; everything else sits on the muted
 * outline rather than reaching for a third hue.
 */
export function ProductStatusBadge({ state }: { state: PublishState }) {
  return (
    <Badge
      variant="outline"
      className={state === "published" ? "border-success/30 bg-success/10 text-success" : "text-muted-foreground"}
    >
      {PUBLISH_STATE_LABELS[state]}
    </Badge>
  );
}

export function ProductAvailabilityBadge({ isAvailable }: { isAvailable: boolean }) {
  return (
    <Badge
      variant="outline"
      className={isAvailable ? "border-success/30 bg-success/10 text-success" : "text-muted-foreground"}
    >
      {isAvailable ? "Available" : "Unavailable"}
    </Badge>
  );
}
