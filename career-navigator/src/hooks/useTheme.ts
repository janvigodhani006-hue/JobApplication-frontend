import { useEffect, useState } from "react";

type Theme = "dark" | "light";

// Read stored theme immediately — avoids the "dark default overwrites saved light" bug.
function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch (_) {
    // localStorage unavailable (SSR / sandboxed)
  }
  return "dark";
}

export function useTheme() {
  // Lazy initializer reads localStorage BEFORE first render — no race condition.
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, setTheme, toggleTheme };
}
