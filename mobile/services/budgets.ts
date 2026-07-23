import { apiFetch } from "../lib/client";

export type Budget = {
  /** "" pour le budget global, sinon la clé de catégorie. */
  category: string;
  label: string;
  emoji: string;
  color: string;
  amount: number;
};

export function listBudgets() {
  return apiFetch<{ budgets: Budget[] }>("/budgets");
}

/** Définit/ajuste un budget. amount <= 0 le supprime. */
export function setBudget(category: string, amount: number) {
  return apiFetch<{ budget?: Budget; message?: string }>("/budgets", {
    method: "PUT",
    body: { category, amount },
  });
}
