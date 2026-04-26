import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export function SprintProgress() {
  return (
    <Box className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-5">
      <Box className="flex justify-between items-start">
        <Box>
          <Heading level={3} className="text-sm font-semibold text-slate-900">
            Sprint 24
          </Heading>
          <p className="text-xs text-slate-500 mt-1">5 days remaining</p>
        </Box>
        <Link
          to="/dashboard"
          className="text-xs font-medium text-blue-600 flex items-center hover:underline"
        >
          View board <ArrowUpRight className="h-3 w-3 ml-1" />
        </Link>
      </Box>

      <Box className="flex flex-col gap-3">
        {/* Progress Bar */}
        <Box className="flex h-2 w-full overflow-hidden rounded-full drop-shadow-sm">
          <Box className="bg-blue-600 w-[60%]" />
          <Box className="bg-blue-400 w-[30%]" />
          <Box className="bg-orange-500 w-[10%]" />
        </Box>

        {/* Legend */}
        <Box className="flex items-center justify-between text-xs text-slate-600">
          <Box className="flex items-center gap-1.5">
            <Box className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Completed (14)</span>
          </Box>
          <Box className="flex items-center gap-1.5">
            <Box className="w-2 h-2 rounded-full bg-blue-400" />
            <span>In Progress (5)</span>
          </Box>
          <Box className="flex items-center gap-1.5">
            <Box className="w-2 h-2 rounded-full bg-orange-500" />
            <span>To Do (2)</span>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
