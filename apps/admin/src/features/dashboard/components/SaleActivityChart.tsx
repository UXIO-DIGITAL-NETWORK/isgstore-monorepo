import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const data = [
  { name: "Jul", value: 28000 },
  { name: "Aug", value: 30000 },
  { name: "Sep", value: 32500 },
  { name: "Oct", value: 36000 },
  { name: "Nov", value: 42000 },
  { name: "Dec", value: 46000 },
  { name: "Jan", value: 48500 },
];

export function SaleActivityChart() {
  return (
    <Box className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-[400px]">
      <Box className="flex justify-between items-start mb-6">
        <Box>
          <Heading level={3} className="text-base font-semibold text-slate-900">
            Revenue Growth
          </Heading>
          <p className="text-sm text-slate-500 mt-0.5">Monthly recurring revenue trend</p>
        </Box>
        <Box className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
          <Button variant="ghost" size="sm" className="h-7 px-3 text-xs bg-white text-slate-900 shadow-sm rounded-md font-medium">
            MRR
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-3 text-xs text-slate-500 hover:text-slate-900 rounded-md font-medium">
            ARR
          </Button>
        </Box>
      </Box>
      <Box className="flex-1 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              dy={15}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickFormatter={(value) => `$${value >= 1000 ? value / 1000 + "K" : value}`}
              domain={[0, 'auto']}
              dx={-10}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <Box className="rounded-lg border bg-white p-3 shadow-md border-slate-100">
                      <Box className="flex flex-col gap-1">
                        <span className="text-[0.75rem] uppercase font-semibold text-slate-500">{label}</span>
                        <span className="font-bold text-slate-900 text-sm">${payload?.[0]?.value?.toLocaleString()}</span>
                      </Box>
                    </Box>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
