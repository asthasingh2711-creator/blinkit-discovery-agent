"use client";

import {
  computeBill,
  DELIVERY_FEE,
  formatINR,
  FREE_DELIVERY_MIN,
} from "@/lib/bill";

type BillDetailsProps = {
  itemTotal: number;
};

export function BillDetails({ itemTotal }: BillDetailsProps) {
  const bill = computeBill(itemTotal);

  return (
    <section className="rounded-2xl border border-blinkit-border bg-white px-3.5 py-3.5">
      <h2 className="mb-2.5 text-sm font-extrabold text-blinkit-charcoal">
        Bill details
      </h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-blinkit-secondary">
          <span>Item total</span>
          <span className="tabular-nums text-blinkit-charcoal">
            {formatINR(bill.itemTotal)}
          </span>
        </div>

        <div className="flex justify-between text-blinkit-secondary">
          <span className="flex items-center gap-1">
            Delivery fee
            {bill.deliveryWaived && (
              <span className="rounded bg-[#E8F8EE] px-1 py-0.5 text-[10px] font-semibold text-blinkit-green">
                FREE
              </span>
            )}
          </span>
          <span className="tabular-nums">
            {bill.deliveryWaived ? (
              <>
                <span className="mr-1.5 text-blinkit-muted line-through">
                  {formatINR(DELIVERY_FEE)}
                </span>
                <span className="font-semibold text-blinkit-green">FREE</span>
              </>
            ) : (
              <span className="text-blinkit-charcoal">
                {formatINR(bill.deliveryFee)}
              </span>
            )}
          </span>
        </div>

        <div className="flex justify-between text-blinkit-secondary">
          <span>Handling charge</span>
          <span className="tabular-nums text-blinkit-charcoal">
            {formatINR(bill.handlingFee)}
          </span>
        </div>

        <div className="flex justify-between border-t border-blinkit-border pt-2 text-sm font-extrabold text-blinkit-charcoal">
          <span>Grand total</span>
          <span className="tabular-nums">{formatINR(bill.grandTotal)}</span>
        </div>
      </div>

      {!bill.deliveryWaived && (
        <p className="mt-2 text-[11px] text-blinkit-muted">
          Shop for {formatINR(FREE_DELIVERY_MIN - bill.itemTotal)} more to get
          FREE delivery
        </p>
      )}
    </section>
  );
}
