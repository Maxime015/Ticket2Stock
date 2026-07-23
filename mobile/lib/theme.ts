/**
 * Design tokens partagés (couleurs utilisées côté JS : SVG, dégradés, icônes).
 * Miroir de theme-vars.ts pour les contextes où les classes NativeWind ne
 * s'appliquent pas (props de composants, LinearGradient, couleurs d'icônes).
 *
 * Deux palettes (clair/sombre) + un hook `useColors()` qui renvoie la palette
 * active selon le colorScheme du système.
 */
import { useColorScheme } from "react-native";

export type ThemeColors = {
  canvas: string;
  background: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  borderSoft: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  ink: string;
  muted: string;
  subtle: string;
  danger: string;
  warning: string;
  info: string;
  success: string;
  pink: string;
  screenGradient: [string, string, string];
  /** Dégradé de la carte hero d'accueil. */
  heroGradient: [string, string];
  /** Dégradé des boutons/CTA primaires. */
  buttonGradient: [string, string];
  /** Dégradé (violet doux, légèrement translucide) des grandes cartes hero. */
  cardGradient: [string, string];
};

export const darkColors: ThemeColors = {
  canvas: "#0B0A12",
  background: "#0F0E17",
  surface: "#171622",
  surface2: "#1E1D2E",
  surface3: "#262438",
  border: "#2A2840",
  borderSoft: "#322F4A",

  primary: "#8B6DFF",
  primaryDark: "#6C47FF",
  primarySoft: "#241F3D",

  ink: "#F5F4FB",
  muted: "#A5A2BE",
  subtle: "#6E6B8A",

  danger: "#F43F5E",
  warning: "#F59E0B",
  info: "#3B82F6",
  success: "#22C55E",
  pink: "#EC4899",

  screenGradient: ["#0F0E17", "#100F1C", "#0B0A12"],
  heroGradient: ["#241C4A", "#2A2154"],
  buttonGradient: ["#8B6DFF", "#6C47FF"],
  // Violet adouci + translucide : laisse transparaître le fond sombre.
  cardGradient: ["rgba(150,128,255,0.60)", "rgba(124,99,242,0.62)"],
};

export const lightColors: ThemeColors = {
  canvas: "#FFFFFF",
  background: "#F6F5FA",
  surface: "#FFFFFF",
  surface2: "#F1F0F7",
  surface3: "#E8E6F2",
  border: "#E6E4F0",
  borderSoft: "#EFEDF6",

  primary: "#6C47FF",
  primaryDark: "#5335CC",
  primarySoft: "#EDE8FF",

  ink: "#1B1B29",
  muted: "#6E6E85",
  subtle: "#A5A5BA",

  danger: "#E11D48",
  warning: "#D97706",
  info: "#2563EB",
  success: "#16A34A",
  pink: "#DB2777",

  screenGradient: ["#FFFFFF", "#F6F5FA", "#EFEDF6"],
  heroGradient: ["#EFEAFF", "#E4DBFF"],
  buttonGradient: ["#7C5CFF", "#5B39E0"],
  // Violet plus doux / pastel, légèrement translucide sur fond clair.
  cardGradient: ["rgba(139,110,255,0.82)", "rgba(120,84,240,0.85)"],
};

/** Palette par défaut (clair) — pour les contextes hors composant. */
export const colors = lightColors;

/** Hook : palette JS pour le thème actif (suit l'apparence système). */
export function useColors(): ThemeColors {
  return useColorScheme() === "dark" ? darkColors : lightColors;
}

/** Indique si le thème actif est sombre. */
export function useIsDark(): boolean {
  return useColorScheme() === "dark";
}

/**
 * Ombre douce pour les cartes (élévation discrète, surtout visible en clair ;
 * quasi invisible en sombre, ce qui est le comportement voulu).
 */
export const cardShadow = {
  shadowColor: "#1B1B29",
  shadowOpacity: 0.06,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;
