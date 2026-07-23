/**
 * Métadonnées d'affichage des catégories de dépense.
 * Miroir de backend/modules/categories.py (CATEGORY_META).
 */
export type CategoryKey =
  | "fruits_legumes"
  | "viande_poisson"
  | "cremerie"
  | "boulangerie"
  | "epicerie"
  | "boissons"
  | "surgeles"
  | "hygiene"
  | "entretien"
  | "bebe"
  | "animaux"
  | "maison"
  | "mode"
  | "loisirs"
  | "autres";

export type CategoryMeta = { label: string; emoji: string; color: string };

export const CATEGORIES: Record<string, CategoryMeta> = {
  fruits_legumes: { label: "Fruits & légumes", emoji: "🥦", color: "#22C55E" },
  viande_poisson: { label: "Viande & poisson", emoji: "🥩", color: "#EF4444" },
  cremerie: { label: "Crémerie", emoji: "🧀", color: "#F59E0B" },
  boulangerie: { label: "Boulangerie", emoji: "🥖", color: "#D97706" },
  epicerie: { label: "Épicerie", emoji: "🍝", color: "#EAB308" },
  boissons: { label: "Boissons", emoji: "🥤", color: "#3B82F6" },
  surgeles: { label: "Surgelés", emoji: "🧊", color: "#06B6D4" },
  hygiene: { label: "Hygiène", emoji: "🧴", color: "#EC4899" },
  entretien: { label: "Entretien", emoji: "🧽", color: "#14B8A6" },
  bebe: { label: "Bébé", emoji: "🍼", color: "#F472B6" },
  animaux: { label: "Animaux", emoji: "🐾", color: "#A16207" },
  maison: { label: "Maison", emoji: "🏠", color: "#8B5CF6" },
  mode: { label: "Mode", emoji: "👕", color: "#6366F1" },
  loisirs: { label: "Loisirs & high-tech", emoji: "🎬", color: "#0EA5E9" },
  autres: { label: "Autres", emoji: "🛒", color: "#94A3B8" },
};

/** Liste ordonnée des catégories (hors « autres ») pour l'édition des budgets. */
export const CATEGORY_ORDER: CategoryKey[] = [
  "fruits_legumes", "viande_poisson", "cremerie", "boulangerie", "epicerie",
  "boissons", "surgeles", "hygiene", "entretien", "bebe", "animaux",
  "maison", "mode", "loisirs", "autres",
];

export function category(key?: string | null): CategoryMeta {
  return (key && CATEGORIES[key]) || CATEGORIES.autres;
}
