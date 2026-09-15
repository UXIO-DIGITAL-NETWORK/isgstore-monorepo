import { CalendarIcon } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatWib, toApiDate } from "@/utils/date";

interface DateFieldProps {
  id: string;
  label: string;
  /** `YYYY-MM-DD`. */
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

/**
 * A labelled calendar-day picker. Lifted out of TransactionFilterBar so the
 * reports filters don't fork it — with one deliberate change: it emits
 * `YYYY-MM-DD` via `toApiDate` rather than a UTC-shifted `toISOString()`.
 */
export function DateField({ id, label, value, onChange, placeholder = "Pick a date" }: DateFieldProps) {
  // Parsed as local noon so the rendered label can never slip a day either.
  const date = value ? new Date(`${value}T12:00:00`) : undefined;

  return (
    <Box className="flex flex-col gap-2.5">
      <Label htmlFor={id}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn("w-full justify-start rounded-xl font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="size-4" />
            {date ? formatWib(date, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(next) => onChange(next ? toApiDate(next) : undefined)}
          />
        </PopoverContent>
      </Popover>
    </Box>
  );
}
