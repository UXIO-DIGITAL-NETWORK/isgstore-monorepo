import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { CardMRR, CardActiveUsers, CardDeployments, CardUptime } from "../components/OverviewCards";
import { SaleActivityChart } from "../components/SaleActivityChart";
import { SprintProgress } from "../components/SprintProgress";
import { TeamActivity } from "../components/TeamActivity";
import { Text } from "@/components/common/Text";

export default function DashboardPage() {
  return (
    <Box className="flex flex-col gap-6">
      {/* Blue Gradient Header Area */}
      <Box className="bg-linear-to-br from-blue-600 to-[#1e88e5] rounded-3xl p-8 shadow-sm">
        <Box className="mb-8">
          <Heading
            level={2}
            className="text-2xl font-bold tracking-tight text-white mb-1"
          >
            Good morning, Aigars
          </Heading>
          <Text className="text-blue-100/90 text-sm">Here's what's happening with your product today.</Text>
        </Box>

        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardMRR />
          <CardActiveUsers />
          <CardDeployments />
          <CardUptime />
        </Box>
      </Box>

      {/* Main Content Grid */}
      <Box className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2) */}
        <Box className="flex flex-col gap-6 lg:col-span-2">
          <SaleActivityChart />
        </Box>

        {/* Right Column (Span 1) */}
        <Box className="flex flex-col gap-6 lg:col-span-1">
          <SprintProgress />
          <TeamActivity />
        </Box>
      </Box>
    </Box>
  );
}
