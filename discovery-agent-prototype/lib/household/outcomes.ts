import { getHouseholdMemory } from "@/lib/household/memory";
import type { DiscoverBasketItem } from "@/lib/discover-types";

export type OutcomeCopy = {
  /** Customer-facing use-case headline — not a SKU pitch */
  outcome: string;
  /** One short body line grounded in history + basket */
  body: string;
  /** Optional second line about the product fit */
  fit: string;
};

type BasketKind = "breakfast" | "wellness" | "party" | "general";

function basketText(basket: DiscoverBasketItem[]) {
  return basket.map((b) => b.name.toLowerCase()).join(" ");
}

export function inferBasketKind(basket: DiscoverBasketItem[]): BasketKind {
  const t = basketText(basket);
  if (/chip|kurkure|lays|sprite|pepsi|drink|cola/.test(t)) return "party";
  if (/crocin|medicine|thermometer|water|kinley|bisleri|moov/.test(t)) {
    return "wellness";
  }
  if (/milk|bread|egg|oat|muesli|cereal/.test(t)) return "breakfast";
  return "general";
}

function memoryIdFor(kind: BasketKind): string {
  if (kind === "party") return "hosting_household";
  if (kind === "wellness") return "wellness_household";
  return "breakfast_household";
}

/** Human labels for what's in the cart — never brand fragments. */
export function humanBasketPhrase(basket: DiscoverBasketItem[]): string {
  const t = basketText(basket);
  const parts: string[] = [];
  if (/milk/.test(t)) parts.push("milk");
  if (/bread/.test(t)) parts.push("bread");
  if (/egg/.test(t)) parts.push("eggs");
  if (/crocin|medicine|moov|band-aid/.test(t)) parts.push("medicine");
  if (/water|kinley|bisleri/.test(t)) parts.push("water");
  if (/chip|kurkure|lays/.test(t)) parts.push("chips");
  if (/sprite|pepsi|cola|drink/.test(t) && !/water|kinley|bisleri/.test(t)) {
    parts.push("cold drinks");
  }
  if (parts.length === 0) {
    return basket.length === 1 ? "your item" : "your cart";
  }
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * Invisible Household Memory → customer copy.
 * Never mentions memory, confidence, lifecycle, or "AI".
 */
export function getOutcomeCopy(
  productId: string,
  basket: DiscoverBasketItem[],
): OutcomeCopy {
  const kind = inferBasketKind(basket);
  const memory = getHouseholdMemory(memoryIdFor(kind));
  const basketPhrase = humanBasketPhrase(basket);
  const regular =
    memory?.inferred_usecases[0]?.evidence ??
    "You tend to buy these together.";

  // Prefer plain "regularly" phrasing over internal evidence jargon
  const historyLine =
    kind === "breakfast"
      ? "You've been buying breakfast essentials regularly."
      : kind === "wellness"
        ? "You've ordered medicine and water together before."
        : kind === "party"
          ? "Snacks and drinks usually mean you're hosting."
          : regular.includes("pattern") || regular.includes("co-occur")
            ? "This fits what you usually buy on trips like this."
            : regular;

  const defaults: Record<string, OutcomeCopy> = {
    "epigamia-greek-yogurt": {
      outcome: "Complete your breakfast",
      body: historyLine,
      fit: `Greek yogurt pairs well with ${basketPhrase}.`,
    },
    "kelloggs-cornflakes": {
      outcome: "Complete your breakfast",
      body: historyLine,
      fit: "Cereal finishes a milk-and-eggs morning run.",
    },
    "saffola-oats": {
      outcome: "Complete your breakfast",
      body: historyLine,
      fit: "Oats pair with the milk already in your cart.",
    },
    "fresh-fruit-cup": {
      outcome: "Add fruit to breakfast",
      body: "Fruits & vegetables is a category you rarely buy here.",
      fit: "A ready fruit cup next to milk, bread and eggs — no cutting.",
    },
    banana: {
      outcome: "Add fruit to breakfast",
      body: "Fruits & vegetables is a category you rarely buy here.",
      fit: "Bananas are a fast add with a breakfast staples run.",
    },
    "apple-shimla": {
      outcome: "Add fruit to breakfast",
      body: "Fruits & vegetables is a category you rarely buy here.",
      fit: "Fresh apples pair with a quick morning basket.",
    },
    "colgate-strong": {
      outcome: "Try personal care on this trip",
      body: "Beauty & personal care is a category you rarely buy here.",
      fit: "Toothpaste fits a morning staples run without a second order.",
    },
    "dove-soap": {
      outcome: "Try personal care on this trip",
      body: "Beauty & personal care is a category you rarely buy here.",
      fit: "A bathroom essential while you're already checking out.",
    },
    "chia-seeds": {
      outcome: "Try organic toppings",
      body: "Organic & premium is a category you rarely buy here.",
      fit: "Chia seeds sit well with a breakfast staples basket.",
    },
    "peanut-butter": {
      outcome: "Complete your breakfast",
      body: "Bread is in the cart again — a spread usually follows.",
      fit: "Peanut butter is a natural add with bread.",
    },
    "digital-thermometer": {
      outcome: "Avoid another late-night pharmacy trip",
      body: historyLine,
      fit: "A thermometer helps you track without going out again.",
    },
    "california-almonds": {
      outcome: "Something light while you recover",
      body: "Dry fruits are a gentle add with hydration runs.",
      fit: "Easy protein when appetite is low.",
    },
    "paper-plates": {
      outcome: "Skip washing dishes after the party",
      body: historyLine,
      fit: "Disposable plates finish hosting without the sink.",
    },
    "paper-cups": {
      outcome: "Skip washing dishes after the party",
      body: historyLine,
      fit: "Disposable cups match what's already in your cart.",
    },
  };

  return (
    defaults[productId] ?? {
      outcome: "A useful add for this trip",
      body: `Pairs with ${basketPhrase} in your cart.`,
      fit: "A common next add for baskets like yours.",
    }
  );
}

/** Novel L0 aisles to prefer — opposite of habitual staples. */
export function inferHistoryGaps(basket: DiscoverBasketItem[]): string[] {
  const kind = inferBasketKind(basket);
  if (kind === "party") return ["home", "beauty", "organic"];
  if (kind === "wellness") return ["organic", "fruits", "beauty"];
  return ["fruits", "beauty", "organic"];
}
