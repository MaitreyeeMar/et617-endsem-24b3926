"use client";
// Light/Dark toggle. Default = device preference; a learner override is persisted.
import { useEffect, useState } from "react";

export const THEME_KEY = "wirelab-theme";
type Theme = "light" | "dark";

function effectiveTheme(): Theme {
  const set = document.documentElement.getAttribute("data-theme");
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    setTheme(effectiveTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setTheme(effectiveTheme());
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  if (!theme) return <span className="theme-toggle-placeholder" aria-hidden="true" />;
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="btn btn-ghost theme-toggle"
      aria-pressed={theme === "dark"}
      aria-label={`Dark mode ${theme === "dark" ? "on" : "off"}. Switch to ${next} mode.`}
      onClick={() => {
        document.documentElement.setAttribute("data-theme", next);
        try {
          window.localStorage.setItem(THEME_KEY, next);
        } catch {
          /* storage blocked — theme still applies for this visit */
        }
        setTheme(next);
      }}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span> <span className="tt-label">{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}

/** Runs before paint (in <head>) so a saved override never flashes the wrong theme. */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
