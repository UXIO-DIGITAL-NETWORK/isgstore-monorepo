import { Box } from "@/components/common/Box";
import { Can } from "@/components/common/Can";
import { Text } from "@/components/common/Text";
import { Switch } from "@/components/ui/switch";
import { useUpdateCategory } from "../hooks/useCategories";
import type { Category } from "../types/category.type";

interface CategoryStatusToggleProps {
  category: Category;
}

/**
 * A simple active/inactive toggle (product_requirements.md §4.5) —
 * deliberately not a review-workflow status like the reference's "In
 * Process"/"Done" pills, which have no meaning for a taxonomy record.
 */
export function CategoryStatusToggle({ category }: CategoryStatusToggleProps) {
  const updateCategory = useUpdateCategory();
  const isActive = category.status === "active";
  const label = isActive ? "Active" : "Inactive";

  return (
    <Can
      permission="categories.edit"
      fallback={
        <Text
          as="span"
          className={isActive ? "text-success" : "text-muted-foreground"}
        >
          {label}
        </Text>
      }
    >
      <Box className="flex items-center gap-2">
        <Switch
          checked={isActive}
          onCheckedChange={(checked) =>
            updateCategory.mutate({ id: category.id, input: { status: checked ? "active" : "inactive" } })
          }
          aria-label={`${category.name} status`}
        />
        <Text
          as="span"
          className={isActive ? "text-success" : "text-muted-foreground"}
        >
          {label}
        </Text>
      </Box>
    </Can>
  );
}
