import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const label = `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex h-11 w-11 cursor-pointer items-center justify-center transition-opacity hover:opacity-60"
    >
      <Moon size={18} strokeWidth={1.5} className="dark:hidden" />
      <Sun size={18} strokeWidth={1.5} className="hidden dark:block" />
    </button>
  );
}
