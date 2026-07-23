import { apiFetch } from "../lib/client";

/**
 * Efface toutes les données de l'utilisateur (tickets, stock, courses,
 * budgets) côté serveur. Le compte est conservé. Irréversible.
 */
export function clearAllData() {
  return apiFetch<{ message: string }>("/auth/data", { method: "DELETE" });
}

/**
 * Supprime définitivement le compte de l'utilisateur ainsi que toutes ses
 * données associées (suppression en cascade côté serveur). Irréversible.
 */
export function deleteAccount() {
  return apiFetch<{ message: string }>("/auth/account", { method: "DELETE" });
}
