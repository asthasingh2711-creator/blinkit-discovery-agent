import { formatINR } from "@/lib/products";

/** Blinkit-like fee rules for the demo cart */
export const FREE_DELIVERY_MIN = 199;
export const DELIVERY_FEE = 25;
export const HANDLING_FEE = 5;

export type BillBreakdown = {
  itemTotal: number;
  deliveryFee: number;
  deliveryWaived: boolean;
  handlingFee: number;
  grandTotal: number;
};

export function computeBill(itemTotal: number): BillBreakdown {
  const deliveryWaived = itemTotal >= FREE_DELIVERY_MIN;
  const deliveryFee = deliveryWaived ? 0 : DELIVERY_FEE;
  const handlingFee = itemTotal > 0 ? HANDLING_FEE : 0;
  return {
    itemTotal,
    deliveryFee,
    deliveryWaived,
    handlingFee,
    grandTotal: itemTotal + deliveryFee + handlingFee,
  };
}

export { formatINR };
