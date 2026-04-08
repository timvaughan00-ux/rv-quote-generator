import { Deal } from "./pipeline";

const STORAGE_KEY = "rv-pipeline-deals";

export function loadDeals(): Deal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Deal[];
  } catch {
    return [];
  }
}

export function saveDeals(deals: Deal[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
}

export function saveDeal(deal: Deal): Deal[] {
  const deals = loadDeals();
  const index = deals.findIndex((d) => d.id === deal.id);
  if (index >= 0) {
    deals[index] = deal;
  } else {
    deals.push(deal);
  }
  saveDeals(deals);
  return deals;
}

export function deleteDeal(id: string): Deal[] {
  const deals = loadDeals().filter((d) => d.id !== id);
  saveDeals(deals);
  return deals;
}
