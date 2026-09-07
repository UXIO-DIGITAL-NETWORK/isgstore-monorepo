import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import { ContentRowActions } from "./ContentRowActions";
import type {
  Announcement,
  Article,
  ArticleCategory,
  Banner,
  ContentPage,
  Faq,
  Testimonial,
} from "../types/content.type";

const dateCell = (value?: string) => (
  <Text
    as="span"
    className="tabular-nums"
  >
    {value ? format(new Date(value), "d MMM yyyy, HH.mm") : "—"}
  </Text>
);

const publishedBadge = (published: boolean) => (
  <Badge
    variant="outline"
    className={cn(published ? "text-success" : "text-muted-foreground")}
  >
    {published ? "Published" : "Draft"}
  </Badge>
);

export const articleColumns = (
  onDelete: (ids: string[]) => void,
  onEdit: (id: string) => void,
): ColumnDef<Article>[] => [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text
          as="span"
          className="font-medium"
        >
          {row.original.title}
        </Text>
        <Text
          variant="muted"
          as="span"
        >
          /{row.original.slug}
        </Text>
      </Box>
    ),
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => (
      // The badge label can differ from the category it files under — a PUBG
      // article sits in "Lainnya" but badges as PUBG Mobile.
      <Text as="span">{row.original.category_label || row.original.category?.name || "—"}</Text>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="capitalize"
      >
        {row.original.type}
      </Badge>
    ),
  },
  { accessorKey: "author_name", header: "Author", cell: ({ row }) => <Text as="span">{row.original.author_name}</Text> },
  { id: "published_at", header: "Published", cell: ({ row }) => dateCell(row.original.published_at) },
  { id: "status", header: "Status", cell: ({ row }) => publishedBadge(row.original.is_published) },
  {
    id: "actions",
    cell: ({ row }) => (
      <ContentRowActions
        id={row.original.id}
        label={row.original.title}
        entityLabel={row.original.type === "news" ? "News" : "Article"}
        onDelete={onDelete}
      onEdit={onEdit}
      />
    ),
  },
];

export const articleCategoryColumns = (
  onDelete: (ids: string[]) => void,
  onEdit: (id: string) => void,
): ColumnDef<ArticleCategory>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Text
        as="span"
        className="font-medium"
      >
        {row.original.name}
      </Text>
    ),
  },
  {
    accessorKey: "key",
    header: "Key",
    cell: ({ row }) => (
      <Text
        as="span"
        variant="muted"
      >
        {row.original.key}
      </Text>
    ),
  },
  { accessorKey: "sort_order", header: "Order", cell: ({ row }) => <Text as="span">{row.original.sort_order}</Text> },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(row.original.status ? "text-success" : "text-muted-foreground")}
      >
        {row.original.status ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ContentRowActions
        id={row.original.id}
        label={row.original.name}
        entityLabel="Category"
        onDelete={onDelete}
      onEdit={onEdit}
      />
    ),
  },
];

export const faqColumns = (
  onDelete: (ids: string[]) => void,
  onEdit: (id: string) => void,
): ColumnDef<Faq>[] => [
  {
    accessorKey: "question",
    header: "Question",
    cell: ({ row }) => (
      <Text
        as="span"
        className="font-medium"
      >
        {row.original.question}
      </Text>
    ),
  },
  {
    accessorKey: "locale",
    header: "Locale",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="uppercase"
      >
        {row.original.locale}
      </Badge>
    ),
  },
  { accessorKey: "sort_order", header: "Order", cell: ({ row }) => <Text as="span">{row.original.sort_order}</Text> },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(row.original.is_active ? "text-success" : "text-muted-foreground")}
      >
        {row.original.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ContentRowActions
        id={row.original.id}
        label={row.original.question}
        entityLabel="FAQ"
        onDelete={onDelete}
      onEdit={onEdit}
      />
    ),
  },
];

export const pageColumns = (
  onDelete: (ids: string[]) => void,
  onEdit: (id: string) => void,
): ColumnDef<ContentPage>[] => [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text
          as="span"
          className="font-medium"
        >
          {row.original.title}
        </Text>
        <Text
          variant="muted"
          as="span"
        >
          /{row.original.slug}
        </Text>
      </Box>
    ),
  },
  {
    accessorKey: "locale",
    header: "Locale",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="uppercase"
      >
        {row.original.locale}
      </Badge>
    ),
  },
  {
    id: "sections",
    header: "Sections",
    cell: ({ row }) => (
      <Text
        as="span"
        className="tabular-nums"
      >
        {row.original.sections.length}
      </Text>
    ),
  },
  { id: "status", header: "Status", cell: ({ row }) => publishedBadge(row.original.is_published) },
  { id: "updated_at", header: "Updated", cell: ({ row }) => dateCell(row.original.updated_at) },
  {
    id: "actions",
    cell: ({ row }) => (
      <ContentRowActions
        id={row.original.id}
        label={row.original.title}
        entityLabel="Page"
        onDelete={onDelete}
      onEdit={onEdit}
      />
    ),
  },
];

export const testimonialColumns = (
  onDelete: (ids: string[]) => void,
  onEdit: (id: string) => void,
): ColumnDef<Testimonial>[] => [
  {
    accessorKey: "author_name",
    header: "Author",
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text
          as="span"
          className="font-medium"
        >
          {row.original.author_name}
        </Text>
        <Text
          variant="muted"
          as="span"
        >
          {row.original.author_title ?? "—"}
        </Text>
      </Box>
    ),
  },
  {
    accessorKey: "game_name",
    header: "Game",
    cell: ({ row }) => <Text as="span">{row.original.game_name ?? "—"}</Text>,
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => (
      <Text
        as="span"
        className="tabular-nums"
      >
        {row.original.rating ? `${row.original.rating}/5` : "—"}
      </Text>
    ),
  },
  {
    id: "featured",
    header: "Featured",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(row.original.is_featured ? "text-success" : "text-muted-foreground")}
      >
        {row.original.is_featured ? "Featured" : "Standard"}
      </Badge>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(row.original.is_active ? "text-success" : "text-muted-foreground")}
      >
        {row.original.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ContentRowActions
        id={row.original.id}
        label={row.original.author_name}
        entityLabel="Testimonial"
        onDelete={onDelete}
      onEdit={onEdit}
      />
    ),
  },
];

const scopeBadge = (scope: "global" | "targeted") => (
  <Badge
    variant="outline"
    className={cn("capitalize", scope === "global" ? "text-success" : "text-muted-foreground")}
  >
    {scope}
  </Badge>
);

export const bannerColumns = (
  onDelete: (ids: string[]) => void,
  onEdit: (id: string) => void,
): ColumnDef<Banner>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Text
        as="span"
        className="font-medium"
      >
        {row.original.name}
      </Text>
    ),
  },
  {
    id: "link",
    header: "Link",
    cell: ({ row }) => (
      <Text
        as="span"
        variant="muted"
      >
        {row.original.link ?? "—"}
      </Text>
    ),
  },
  // A banner whose file is missing is dropped from the storefront entirely, so
  // the admin needs to see that state rather than an empty cell.
  {
    id: "image",
    header: "Image",
    cell: ({ row }) => (
      <Text
        as="span"
        variant={row.original.image_url ? "default" : "muted"}
      >
        {row.original.image_url ? "Uploaded" : "Missing"}
      </Text>
    ),
  },
  { id: "scope", header: "Scope", cell: ({ row }) => scopeBadge(row.original.scope) },
  { id: "created_at", header: "Created", cell: ({ row }) => dateCell(row.original.created_at) },
  {
    id: "actions",
    cell: ({ row }) => (
      <ContentRowActions
        id={row.original.id}
        label={row.original.name}
        entityLabel="Banner"
        onDelete={onDelete}
      onEdit={onEdit}
      />
    ),
  },
];

export const announcementColumns = (
  onDelete: (ids: string[]) => void,
  onEdit: (id: string) => void,
): ColumnDef<Announcement>[] => [
  {
    accessorKey: "content",
    header: "Content",
    cell: ({ row }) => (
      <Text
        as="span"
        className="line-clamp-2 max-w-lg"
      >
        {row.original.content}
      </Text>
    ),
  },
  { id: "scope", header: "Scope", cell: ({ row }) => scopeBadge(row.original.scope) },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(row.original.is_active ? "text-success" : "text-muted-foreground")}
      >
        {row.original.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  { id: "created_at", header: "Created", cell: ({ row }) => dateCell(row.original.created_at) },
  {
    id: "actions",
    cell: ({ row }) => (
      <ContentRowActions
        id={row.original.id}
        // Announcements have no name — the copy itself identifies the row.
        label={row.original.content.slice(0, 40)}
        entityLabel="Announcement"
        onDelete={onDelete}
      onEdit={onEdit}
      />
    ),
  },
];
