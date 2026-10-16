import { useTheme } from "../context/ThemeContext";

/**
 * Returns theme-aware colors for icons.
 * Ionicons needs a `color` prop, not a className, so we compute it here.
 *
 * Usage:
 *   const ic = useIconColor();
 *   <Ionicons name="home" color={ic.primary} />
 *
 * Available: primary, muted, faint, onBrand, active, inactive, danger
 */
export function useIconColor() {
  const { scheme } = useTheme();
  const dark = scheme === "dark";

  return {
    /** Main icon color (dark text in light mode, light text in dark mode) */
    primary: dark ? "#F5F5F5" : "#0A0A0A",
    /** Secondary / muted icon */
    muted: dark ? "#B0B0B0" : "#4A4A4A",
    /** Very faint icon (e.g. inactive tab) */
    faint: dark ? "#9CA3AF" : "#9CA3AF",
    /** Icon on a brand-colored (orange) background */
    onBrand: "#FFFFFF",
    /** Currently-selected tab icon */
    active: "#FA3504",
    /** Unselected tab icon */
    inactive: "#9CA3AF",
    /** Destructive actions */
    danger: "#DC2626",
    /** Theme scheme, in case a component needs to branch further */
    scheme,
  };
}
