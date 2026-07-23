import { apiFetch } from "../lib/client";

export type StockItem = {
  id: string;
  label: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  lastPrice: number | null;
  lastPurchasedAt: string | null;
  purchaseCount: number;
  isLow: boolean;
  category: string;
  expiryDate: string | null;
  /** Jours avant péremption (négatif si périmé, null si non renseigné). */
  daysLeft: number | null;
  isExpiringSoon: boolean;
};

export function listStock() {
  return apiFetch<{ items: StockItem[] }>("/stock");
}

export function createStockItem(payload: {
  label: string;
  quantity?: number;
  unit?: string;
  minQuantity?: number;
}) {
  return apiFetch<{ item: StockItem }>("/stock", { method: "POST", body: payload });
}

export function updateStockItem(
  id: string,
  payload: {
    quantity?: number;
    minQuantity?: number;
    label?: string;
    category?: string;
    /** "YYYY-MM-DD" pour définir, null pour effacer la date de péremption. */
    expiryDate?: string | null;
  },
) {
  return apiFetch<{ item: StockItem }>(`/stock/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteStockItem(id: string) {
  return apiFetch<{ message: string }>(`/stock/${id}`, { method: "DELETE" });
}
