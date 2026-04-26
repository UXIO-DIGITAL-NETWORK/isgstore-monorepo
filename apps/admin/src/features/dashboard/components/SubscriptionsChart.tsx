import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, Tooltip, Cell } from "recharts";

const data = [
  { name: "1", value: 300 },
  { name: "2", value: 450 },
  { name: "3", value: 300 },
  { name: "4", value: 200 },
  { name: "5", value: 600 },
  { name: "6", value: 450 },
  { name: "7", value: 800 },
  { name: "8", value: 400 },
  { name: "9", value: 500 },
  { name: "10", value: 850 },
  { name: "11", value: 400 },
  { name: "12", value: 550 },
  { name: "13", value: 300 },
  { name: "14", value: 950 },
  { name: "15", value: 400 },
  { name: "16", value: 700 },
  { name: "17", value: 500 },
  { name: "18", value: 400 },
];

export function SubscriptionsChart() {
  return (
    <Card className="flex flex-col h-full border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
        <Box className="mt-2">
          <Text className="text-3xl font-bold">+2350</Text>
          <Text className="text-sm text-muted-foreground mt-1">+180.1% from last month</Text>
        </Box>
      </CardHeader>
      <CardContent className="flex-1 min-h-[250px] w-full mt-4">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart data={data}>
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <Box className="rounded-lg border bg-background px-3 py-2 shadow-sm">
                      <span className="font-bold text-muted-foreground">{payload[0].value}</span>
                    </Box>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="value"
              radius={[4, 4, 4, 4]}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index % 3 === 0 ? "#10b981" : "#3b82f6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
