import { apiFetch } from "../lib/client";

export type CategorySpend = {
  category: string;
  label: string;
  emoji: string;
  color: string;
  amount: number;
  count: number;
};

export type MonthPoint = { month: string; label: string; total: number };

export type TopProduct = {
  label: string;
  category: string;
  amount: number;
  quantity: number;
  times: number;
};

export type TopShop = { shop: string; amount: number; count: number };

export type BudgetProgress = CategorySpend & { spent: number };

export type StatsOverview = {
  month: string;
  monthLabel: string;
  monthTotal: number;
  prevMonthTotal: number;
  deltaPct: number | null;
  ticketCount: number;
  avgBasket: number;
  series: MonthPoint[];
  categories: CategorySpend[];
  topProducts: TopProduct[];
  topShops: TopShop[];
  budgets: {
    global: { amount: number; spent: number } | null;
    categories: BudgetProgress[];
  };
};

export function getStatsOverview() {
  return apiFetch<StatsOverview>("/stats/overview");
}
