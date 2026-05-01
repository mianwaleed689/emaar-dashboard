/**
 * DXB Analytics �€” Theme
 * File: src/theme.js
 *
 * S16: Extracted from data.js �€” single source of truth for all colors/tokens.
 * Import: import { T } from "./theme";
 *
 * Iron Rule: NEVER run npx vercel --prod �€” use git push only
 */

export const T = {
  // Backgrounds
  bg:           "#04090F",
  surface:      "#0A1628",
  surfaceAlt:   "#0E1D35",
  card:         "#0D1B30",
  cardHover:    "#112240",
  navy:         "#0B1F3F",

  // Gold �€” primary brand colour
  gold:         "#D4A843",
  goldLight:    "#E8C96A",
  goldGlow:     "rgba(212,168,67,0.15)",
  goldMuted:    "rgba(212,168,67,0.08)",
  goldDim:      "#B8912F",

  // Text
  textPrimary:  "#E2E8F0",
  textSecondary:"#94A3B8",
  textMuted:    "#7E95AD",
  white:        "#FFFFFF",

  // Borders
  border:       "rgba(212,168,67,0.12)",
  borderHover:  "rgba(212,168,67,0.3)",

  // Accent colours
  teal:         "#00BFA5",
  red:          "#EF4444",
  green:        "#10B981",
  blue:         "#3B82F6",
  purple:       "#8B5CF6",
  orange:       "#F59E0B",
  cyan:         "#06B6D4",
};

export default T;
