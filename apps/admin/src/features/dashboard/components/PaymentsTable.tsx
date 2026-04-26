import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ArrowUpDown } from "lucide-react";

const payments = [
  { id: "1", status: "Success", email: "ken99@yahoo.com", amount: 316.0 },
  { id: "2", status: "Success", email: "Abe45@gmail.com", amount: 242.0 },
  { id: "3", status: "Processing", email: "Monserrat44@gmail.com", amount: 837.0 },
  { id: "4", status: "Success", email: "Silas22@gmail.com", amount: 874.0 },
  { id: "5", status: "Failed", email: "carmella@hotmail.com", amount: 721.0 },
];

export function PaymentsTable() {
  return (
    <Card className="flex flex-col h-full border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <Text className="text-sm text-muted-foreground">Manage your payments.</Text>
      </CardHeader>
      <CardContent>
        <Box className="flex items-center justify-between mb-4">
          <Input
            placeholder="Filter emails..."
            className="max-w-sm"
          />
          <Button
            variant="outline"
            className="ml-auto"
          >
            Columns <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </Box>
        <Box className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox />
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="-ml-4 h-8 data-[state=open]:bg-accent"
                  >
                    <span>Email</span>
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium capitalize">{payment.status}</TableCell>
                  <TableCell>{payment.email}</TableCell>
                  <TableCell className="text-right font-medium">${payment.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <span className="sr-only">Open menu</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="1"
                        />
                        <circle
                          cx="12"
                          cy="5"
                          r="1"
                        />
                        <circle
                          cx="12"
                          cy="19"
                          r="1"
                        />
                      </svg>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
}
