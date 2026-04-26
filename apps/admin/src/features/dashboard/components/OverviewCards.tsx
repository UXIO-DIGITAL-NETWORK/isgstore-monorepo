import { Box } from "@/components/common/Box";
import { Zap, Users, Rocket, Activity, TrendingUp } from "lucide-react";

export function CardMRR() {
  return (
    <Box className="bg-white/10 border border-white/20 rounded-3xl p-5 text-white shadow-sm flex flex-col justify-between h-full backdrop-blur-md">
      <Box className="flex items-center gap-2 text-blue-100 mb-4">
        <Zap className="h-4 w-4" />
        <span className="text-sm font-medium">MRR</span>
      </Box>
      <Box>
        <div className="text-3xl font-bold tracking-tight mb-1">$48.2K</div>
        <div className="flex items-center gap-1.5 text-xs text-blue-100/80">
          <TrendingUp className="h-3 w-3 text-emerald-300" />
          <span className="text-emerald-300 font-medium">+12.4%</span> vs last month
        </div>
      </Box>
    </Box>
  );
}

export function CardActiveUsers() {
  return (
    <Box className="bg-white/10 border border-white/20 rounded-3xl p-5 text-white shadow-sm flex flex-col justify-between h-full backdrop-blur-md">
      <Box className="flex items-center gap-2 text-blue-100 mb-4">
        <Users className="h-4 w-4" />
        <span className="text-sm font-medium">Active Users</span>
      </Box>
      <Box>
        <div className="text-3xl font-bold tracking-tight mb-1">12,847</div>
        <div className="flex items-center gap-1.5 text-xs text-blue-100/80">
          <TrendingUp className="h-3 w-3 text-emerald-300" />
          <span className="text-emerald-300 font-medium">+8.2%</span> vs last month
        </div>
      </Box>
    </Box>
  );
}

export function CardDeployments() {
  return (
    <Box className="bg-white/10 border border-white/20 rounded-3xl p-5 text-white shadow-sm flex flex-col justify-between h-full backdrop-blur-md">
      <Box className="flex items-center gap-2 text-blue-100 mb-4">
        <Rocket className="h-4 w-4" />
        <span className="text-sm font-medium">Deployments</span>
      </Box>
      <Box>
        <div className="text-3xl font-bold tracking-tight mb-1">342</div>
        <div className="flex items-center gap-1.5 text-xs text-blue-100/80">
          <TrendingUp className="h-3 w-3 text-emerald-300" />
          <span className="text-emerald-300 font-medium">+24.1%</span> vs last month
        </div>
      </Box>
    </Box>
  );
}

export function CardUptime() {
  return (
    <Box className="bg-white/10 border border-white/20 rounded-3xl p-5 text-white shadow-sm flex flex-col justify-between h-full backdrop-blur-md">
      <Box className="flex items-center gap-2 text-blue-100 mb-4">
        <Activity className="h-4 w-4" />
        <span className="text-sm font-medium">Uptime</span>
      </Box>
      <Box>
        <div className="text-3xl font-bold tracking-tight mb-1">99.98%</div>
        <div className="flex items-center gap-1.5 text-xs text-blue-100/80">
          <TrendingUp className="h-3 w-3 text-emerald-300" />
          <span className="text-emerald-300 font-medium">+0.02%</span> vs last month
        </div>
      </Box>
    </Box>
  );
}
