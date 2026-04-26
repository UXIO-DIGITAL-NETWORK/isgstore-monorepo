import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

const activities = [
  {
    id: 1,
    user: "Sarah C.",
    initials: "SC",
    color: "bg-blue-600",
    action: "merged PR #284",
    time: "3m",
  },
  {
    id: 2,
    user: "Alex M.",
    initials: "AM",
    color: "bg-cyan-500",
    action: "deployed to production",
    time: "12m",
  },
  {
    id: 3,
    user: "Priya K.",
    initials: "PK",
    color: "bg-orange-500",
    action: "opened issue #92",
    time: "28m",
  },
  {
    id: 4,
    user: "Marcus L.",
    initials: "ML",
    color: "bg-pink-500",
    action: "reviewed PR #281",
    time: "45m",
  },
  {
    id: 5,
    user: "Jan T.",
    initials: "JT",
    color: "bg-indigo-500",
    action: "closed issue #88",
    time: "1h",
  },
];

export function TeamActivity() {
  return (
    <Box className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-6">
      <Box className="flex justify-between items-start">
        <Box>
          <Heading level={3} className="text-sm font-semibold text-slate-900">
            Team Activity
          </Heading>
          <p className="text-xs text-slate-500 mt-1">Latest from your team</p>
        </Box>
        <Link
          to="/dashboard"
          className="text-xs font-medium text-blue-600 flex items-center hover:underline"
        >
          View all <ArrowUpRight className="h-3 w-3 ml-1" />
        </Link>
      </Box>

      <Box className="flex flex-col gap-6">
        {activities.map((activity) => (
          <Box key={activity.id} className="flex items-center justify-between">
            <Box className="flex items-center gap-3">
              <Box
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${activity.color}`}
              >
                {activity.initials}
              </Box>
              <Box className="text-sm">
                <span className="font-semibold text-slate-900 mr-1">{activity.user}</span>
                <span className="text-slate-600">{activity.action}</span>
              </Box>
            </Box>
            <span className="text-xs text-slate-500">{activity.time}</span>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
