export interface LineItem {
  id: string;
  name: string;
  numberOfUsers: number;
  periodMonths: number;
  standardPrice: number;
  discountPercent: number;
}

export interface QuoteData {
  // School info
  schoolName: string;
  streetAddress: string;
  postcode: string;
  city: string;
  region: string;
  country: string;

  // Contact
  contactName: string;
  contactEmail: string;

  // Quote details
  quoteDate: string;
  preparedBy: string;
  templateType: "full-suite" | "educator-pro" | "custom";

  // Line items
  lineItems: LineItem[];

  // Additional discount
  additionalDiscountLabel: string;
  additionalDiscountPercent: number;
}

export function calculateLineItemTotal(item: LineItem): number {
  const total = item.standardPrice * item.numberOfUsers;
  return total * (1 - item.discountPercent / 100);
}

export function calculateSubtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + calculateLineItemTotal(item), 0);
}

export function calculateTotalDiscount(items: LineItem[]): number {
  return items.reduce((sum, item) => {
    const full = item.standardPrice * item.numberOfUsers;
    return sum + (full - calculateLineItemTotal(item));
  }, 0);
}

export function calculateAdditionalDiscount(
  subtotal: number,
  percent: number
): number {
  return subtotal * (percent / 100);
}

export function calculateGrandTotal(data: QuoteData): number {
  const subtotal = calculateSubtotal(data.lineItems);
  const additionalDiscount = calculateAdditionalDiscount(
    subtotal,
    data.additionalDiscountPercent
  );
  return subtotal - additionalDiscount;
}
