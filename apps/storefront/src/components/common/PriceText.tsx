import { cn } from "@/lib/utils";

interface PriceTextProps {
  children: React.ReactNode;
  className?: string;
}

export function PriceText({ children, className }: PriceTextProps) {
  return (
    <p
      className={cn(
        "bg-gradient-price bg-clip-text text-transparent font-plex font-bold text-[25px] leading-7",
        className,
      )}
    >
      {children}
    </p>
  );
}
