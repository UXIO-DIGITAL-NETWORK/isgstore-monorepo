import { Bell } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

/**
 * Placeholder. There is no notifications backend yet — deliberately no hook and
 * no service call, so this page cannot quietly start depending on an endpoint
 * that does not exist. The empty state makes its unfinished state obvious
 * rather than showing a convincing but hollow list.
 */
export default function NotificationsPage() {
  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Notifikasi</Heading>

      <Empty className="border border-dashed border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Bell />
          </EmptyMedia>
          <EmptyTitle>Fitur notifikasi akan segera hadir</EmptyTitle>
          <EmptyDescription>
            Nantinya halaman ini menampilkan pemberitahuan invoice jatuh tempo, langganan yang akan berakhir, dan
            perubahan status layanan.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Box>
  );
}
