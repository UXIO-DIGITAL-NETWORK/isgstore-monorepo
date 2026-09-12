import * as React from "react";

export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  // Must agree with the pre-paint script in index.html, which reads the same
  // key to set the initial class. If the two disagree the panel flashes the
  // wrong theme on every cold load.
  const [theme, setTheme] = React.useState<Theme>(() => {
    try {
      return (localStorage.getItem(storageKey) as Theme | null) ?? defaultTheme;
    } catch {
      // A browser with site data blocked. Not a reason to fail to render.
      return defaultTheme;
    }
  });

  React.useEffect(() => {
    const root = window.document.documentElement;

    const apply = () => {
      root.classList.remove("light", "dark");
      root.classList.add(
        theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme,
      );
    };

    apply();

    // "System" has to keep meaning it. Without this, an OS that switches to
    // dark at sunset leaves a panel that chose to follow the system sitting in
    // light until the next reload.
    if (theme !== "system") return;

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener?.("change", apply);

    return () => query.removeEventListener?.("change", apply);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      try {
        localStorage.setItem(storageKey, theme);
      } catch {
        // The choice still applies for this session; it just will not persist.
      }
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider
      {...props}
      value={value}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export { ThemeProviderContext };
