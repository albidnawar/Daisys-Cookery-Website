import { computeDepositAmount, type DepositConfig } from "@/lib/pricing/deposit";
import type { CakeDetail, DraftOrderSpec, OptionValue, PriceBreakdown } from "@/lib/types/domain";

function selectedValues(cake: CakeDetail, spec: DraftOrderSpec): OptionValue[] {
  const byGroupAndCode = new Map<string, OptionValue>();
  for (const group of cake.optionGroups) {
    for (const value of group.values) {
      byGroupAndCode.set(`${group.code}:${value.valueCode}`, value);
    }
  }

  const codes: [string, string | string[] | undefined][] = [
    ["tiers", spec.tiers],
    ["extras", spec.extras],
    ["allergen_swap", spec.allergenSwap],
  ];
  if (spec.sponge) codes.push(["sponge", spec.sponge]);
  if (spec.photoPrint) codes.push(["photo_print", "photo_print"]);

  const values: OptionValue[] = [];
  for (const [group, code] of codes) {
    if (!code) continue;
    const list = Array.isArray(code) ? code : [code];
    for (const c of list) {
      const value = byGroupAndCode.get(`${group}:${c}`);
      if (value) values.push(value);
    }
  }

  // Cake color is free text (CakeColorField also allows typing anything
  // custom), not a valueCode a customer picks from, so it can't be looked
  // up the same way as the groups above. A chip click fills in that chip's
  // exact label, so matching the typed text against a "cake_color" option's
  // label is what makes its price apply — a custom, non-matching color
  // stays free, same as before this group existed.
  if (spec.cakeColor) {
    const cakeColorGroup = cake.optionGroups.find((g) => g.code === "cake_color");
    const match = cakeColorGroup?.values.find(
      (v) => v.label.trim().toLowerCase() === spec.cakeColor!.trim().toLowerCase(),
    );
    if (match) values.push(match);
  }

  return values;
}

/** The single place price math happens — called both for optimistic
 * client-side feedback and as the server-authoritative source on every
 * draft-order update and at checkout. Returns null when the size is
 * unset or still the literal "other" sentinel (the customer has clicked
 * "Other" but not yet typed a weight) since there's nothing to compute
 * yet. deposit is always the caller's responsibility to supply (from
 * getStoreSettings() via toDepositConfig() — see lib/settings/store.ts and
 * lib/pricing/deposit.ts) rather than a module constant, since it's now an
 * admin-editable business setting. */
export function calculatePrice(
  cake: CakeDetail,
  spec: DraftOrderSpec,
  deposit: DepositConfig,
): PriceBreakdown | null {
  if (!spec.sizeCode || spec.sizeCode === "other") return null;
  const sizeLb = Number(spec.sizeCode);
  if (!Number.isFinite(sizeLb) || sizeLb <= 0) return null;

  const subtotal = cake.basePrice * sizeLb;
  const extrasTotal = selectedValues(cake, spec).reduce(
    (sum, v) => sum + v.priceDelta,
    0,
  );
  const total = subtotal + extrasTotal;
  const depositAmount = computeDepositAmount(total, deposit);

  return {
    subtotal,
    extrasTotal,
    total,
    depositAmount,
    balanceDue: total - depositAmount,
  };
}

/** A bespoke cake has no option groups to price from — the admin just
 * names a number after inspecting the reference photo (Module 5's Custom
 * Quote Engine). Returns the same pre-delivery-fee shape calculatePrice()
 * does, so withDeliveryFee() and everything downstream treats a quoted
 * price exactly like a catalog one. */
export function fixedPrice(amount: number, deposit: DepositConfig): PriceBreakdown {
  const depositAmount = computeDepositAmount(amount, deposit);
  return {
    subtotal: amount,
    extrasTotal: 0,
    total: amount,
    depositAmount,
    balanceDue: amount - depositAmount,
  };
}

/** Folds a delivery fee into the cake+extras price from calculatePrice(),
 * recomputing the deposit/balance off the new grand total. Used once
 * fulfilment (pickup = free, delivery = zone fee) is known — kept separate
 * from calculatePrice() so the Customiser's price stays cake-only until
 * Buying Options adds delivery into the picture. */
export function withDeliveryFee(
  price: PriceBreakdown,
  deliveryFee: number,
  deposit: DepositConfig,
): PriceBreakdown {
  const total = price.subtotal + price.extrasTotal + deliveryFee;
  const depositAmount = computeDepositAmount(total, deposit);
  return {
    ...price,
    total,
    depositAmount,
    balanceDue: total - depositAmount,
  };
}
