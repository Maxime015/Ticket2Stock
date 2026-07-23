import { vars } from "nativewind";

/**
 * Variables CSS de thème appliquées via un View racine (`style={themeVars}`).
 * Mécanisme fiable de NativeWind pour un thème dynamique sur natif : les
 * classes `bg-background`, `text-ink`… lisent ces variables dans le sous-arbre.
 * Valeurs = canaux RGB « R G B » (opacité via `rgb(var(--x) / <alpha-value>)`).
 *
 * Identité Ticket2Stock : violet (#6C47FF).
 */
export const lightVars = vars({
  "--canvas": "255 255 255",
  "--background": "246 245 250",
  "--surface": "255 255 255",
  "--surface-2": "241 240 247",
  "--surface-3": "232 230 242",
  "--border": "230 228 240",
  "--border-soft": "239 237 246",
  "--primary": "108 71 255",
  "--primary-dark": "83 53 204",
  "--primary-soft": "237 232 255",
  "--ink": "27 27 41",
  "--muted": "110 110 133",
  "--subtle": "165 165 186",
  "--danger": "225 29 72",
  "--warning": "217 119 6",
  "--info": "37 99 235",
  "--success": "22 163 74",
  "--pink": "219 39 119",
});

export const darkVars = vars({
  "--canvas": "11 10 18",
  "--background": "15 14 23",
  "--surface": "23 22 34",
  "--surface-2": "30 29 46",
  "--surface-3": "38 36 56",
  "--border": "42 40 64",
  "--border-soft": "50 47 74",
  "--primary": "139 109 255",
  "--primary-dark": "108 71 255",
  "--primary-soft": "36 31 61",
  "--ink": "245 244 251",
  "--muted": "165 162 190",
  "--subtle": "110 107 138",
  "--danger": "244 63 94",
  "--warning": "245 158 11",
  "--info": "59 130 246",
  "--success": "34 197 94",
  "--pink": "236 72 153",
});
