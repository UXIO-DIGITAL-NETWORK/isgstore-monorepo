import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Text } from "./Text";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const settedTheme = theme === "light" ? "dark" : "light";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(settedTheme)}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <Text
        as="span"
        className="sr-only"
      >
        Toggle theme
      </Text>
    </Button>
  );
}
