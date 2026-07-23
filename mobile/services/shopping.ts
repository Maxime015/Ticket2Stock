import { apiFetch } from "../lib/client";

export type ShoppingItem = {
  id: string;
  label: string;
  quantity: number;
  checked: boolean;
  source: "auto" | "manual";
  stockItemId: string | null;
  createdAt: string;
};

export function listShopping() {
  return apiFetch<{ items: ShoppingItem[] }>("/shopping");
}

export function generateShoppingList() {
  return apiFetch<{ message: string; addedCount: number }>("/shopping/generate", {
    method: "POST",
  });
}

export function addShoppingItem(label: string, quantity = 1) {
  return apiFetch<{ item: ShoppingItem }>("/shopping", {
    method: "POST",
    body: { label, quantity },
  });
}

export function toggleShoppingItem(id: string) {
  return apiFetch<{ item: ShoppingItem }>(`/shopping/${id}/toggle`, {
    method: "PATCH",
  });
}

export function deleteShoppingItem(id: string) {
  return apiFetch<{ message: string }>(`/shopping/${id}`, { method: "DELETE" });
}

export function clearChecked() {
  return apiFetch<{ message: string }>("/shopping/clear-checked", {
    method: "DELETE",
  });
}
