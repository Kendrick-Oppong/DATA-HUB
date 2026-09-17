import { AppTheme } from "../types";

import daylightLogo from "../assets/daylight-logo.png";
import midnightLogo from "../assets/midnight-logo.png";
import amberLogo from "../assets/amber-logo.png";
import rubyRedLogo from "../assets/ruby-red-logo.png";

export interface ThemeOption {
  id: AppTheme;
  name: string;
  dot: string;
}

export const themeOptions: ThemeOption[] = [
  { id: "light", name: "Daylight Clean", dot: "bg-blue-600" },
  { id: "dark", name: "Midnight Obsidian", dot: "bg-slate-900 border border-slate-700" },
  { id: "sunset-amber", name: "Sunset Amber", dot: "bg-amber-400" },
  { id: "ruby-red", name: "Ruby Red", dot: "bg-red-600" },
];

export const getThemeOption = (themeId: AppTheme): ThemeOption =>
  themeOptions.find((t) => t.id === themeId) || themeOptions[0];

/** Returns the correct logo asset for the given theme. */
export const getLogoForTheme = (theme: AppTheme): string => {
  switch (theme) {
    case "light": return daylightLogo;
    case "dark": return midnightLogo;
    case "sunset-amber": return amberLogo;
    case "ruby-red": return rubyRedLogo;
    default: return rubyRedLogo;
  }
};

/**
 * Reads the active theme from the document root class list
 * (App.tsx always keeps it in sync) and returns the matching logo.
 * Safe to call in components that don't receive a theme prop.
 */
export const getLogoFromDOM = (): string => {
  if (typeof document === "undefined") return rubyRedLogo;
  const cls = document.documentElement.classList;
  if (cls.contains("theme-sunset-amber")) return amberLogo;
  if (cls.contains("theme-ruby-red")) return rubyRedLogo;
  if (cls.contains("dark")) return midnightLogo;
  return daylightLogo;
};
