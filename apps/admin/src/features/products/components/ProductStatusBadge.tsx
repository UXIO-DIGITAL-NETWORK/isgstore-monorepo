import { Badge } from "@/components/ui/badge";
import type { ProductStatus } from "../types/product.type";

/**
 * The reference stacks two badges per row. §4.6 models them as two separate
 * axes rather than one repeated state: lifecycle (`status`) and storefront
 * visibility (`is_available`, the §6 entity field).
 *
 * Monochrome rules apply — colour is functional only (design_system.md §3.2),
 * so the positive value of each axis is `text-success` and the negative sits
 * on the muted outline rather than reaching for a third hue.
 */
export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const isActive = status === "active";

  return (
    <Badge
      variant="outline"
      className={isActive ? "border-success/30 bg-success/10 text-success" : "text-muted-foreground"}
    >
      {isActive ? "Active" : "Inactive"}
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
