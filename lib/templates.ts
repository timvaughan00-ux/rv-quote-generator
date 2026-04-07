import { LineItem } from "./types";

export interface QuoteTemplate {
  label: string;
  lineItems: LineItem[];
}

export const TEMPLATES: Record<string, QuoteTemplate> = {
  "full-suite": {
    label: "Full Learning Suite",
    lineItems: [
      {
        id: "gold-full-suite",
        name: "Revision Village Gold - Full IBDP Learning Suite (13 Subjects)",
        numberOfUsers: 200,
        periodMonths: 12,
        standardPrice: 499.0,
        discountPercent: 79.11,
      },
      {
        id: "educator-pro-bundled",
        name: "IBDP EducatorPro Premium Access",
        numberOfUsers: 20,
        periodMonths: 12,
        standardPrice: 299.0,
        discountPercent: 100,
      },
    ],
  },
  "educator-pro": {
    label: "EducatorPro Only",
    lineItems: [
      {
        id: "educator-pro-only",
        name: "IBDP EducatorPro Premium Access",
        numberOfUsers: 20,
        periodMonths: 12,
        standardPrice: 299.0,
        discountPercent: 0,
      },
    ],
  },
  custom: {
    label: "Custom",
    lineItems: [],
  },
};
